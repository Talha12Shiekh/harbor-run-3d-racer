"""Shared original Blender authoring helpers. No mesh import operations."""
import bpy,math,json
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def reset():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for d in list(bpy.data.materials):bpy.data.materials.remove(d)
def material(name,color,rough=.4,metal=0,coat=0,alpha=1,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,alpha);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal;bs.inputs['Coat Weight'].default_value=coat;bs.inputs['Coat Roughness'].default_value=.13;bs.inputs['Alpha'].default_value=alpha
 if alpha<1:m.surface_render_method='DITHERED';m.use_transparency_overlap=False
 if emission:bs.inputs['Emission Color'].default_value=(*color,1);bs.inputs['Emission Strength'].default_value=emission
 m.diffuse_color=(*color,alpha);return m
def mesh(name,verts,faces,mat,smooth=True):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(mat)
 for p in d.polygons:p.use_smooth=smooth
 return o
def bevel(o,width=.01,segments=3):
 bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Machined edge','BEVEL');mod.width=width;mod.segments=segments;bpy.ops.object.modifier_apply(modifier=mod.name)
def cube(name,loc,size,mat,rounding=.015):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=size;o.data.materials.append(mat);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if rounding:bevel(o,rounding)
 return o
def cylinder(name,a,b,r,mat,vertices=48):
 a,b=Vector(a),Vector(b);v=b-a;bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=v.length,location=(a+b)/2);o=bpy.context.object;o.name=name;o.rotation_euler=v.to_track_quat('Z','Y').to_euler();o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
 return o
def torus(name,loc,r,tube,mat,axis='X',major=64):
 bpy.ops.mesh.primitive_torus_add(major_segments=major,minor_segments=10,location=loc,major_radius=r,minor_radius=tube);o=bpy.context.object;o.name=name;o.data.materials.append(mat);o.rotation_euler.y=math.pi/2 if axis=='X' else 0;o.rotation_euler.x=math.pi/2 if axis=='Y' else 0
 for p in o.data.polygons:p.use_smooth=True
 return o
def curve(name,points,mat,r=.007,closed=False):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=8;d.bevel_depth=r;d.bevel_resolution=3;s=d.splines.new('POLY');s.points.add(len(points)-1)
 for p,v in zip(s.points,points):p.co=(*v,1)
 s.use_cyclic_u=closed;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(mat);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);return o
def text(name,value,loc,rot,mat,size=.11):
 d=bpy.data.curves.new(name,'FONT');d.body=value;d.size=size;d.align_x='CENTER';d.align_y='CENTER';d.extrude=.001;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;d.materials.append(mat);bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');o.select_set(False);return o
def export(path):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
def measurements():
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH'];bpy.context.view_layer.update();pts=[o.matrix_world@v.co for o in objects for v in o.data.vertices];low=[min(v[i] for v in pts) for i in range(3)];high=[max(v[i] for v in pts) for i in range(3)];return {'dimensions':[high[0]-low[0],high[2]-low[2],high[1]-low[1]],'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects),'bounds':{'min':[low[0],low[2],-high[1]],'max':[high[0],high[2],-low[1]]}}
def studio():
 scene=bpy.context.scene;scene.world.use_nodes=True;nt=scene.world.node_tree;nt.nodes.clear();e=nt.nodes.new('ShaderNodeTexEnvironment');e.image=bpy.data.images.load(str(ROOT/'dist/assets/daylight.hdr'));b=nt.nodes.new('ShaderNodeBackground');b.inputs['Strength'].default_value=.7;nt.links.new(e.outputs['Color'],b.inputs['Color']);out=nt.nodes.new('ShaderNodeOutputWorld');nt.links.new(b.outputs[0],out.inputs[0]);bpy.ops.mesh.primitive_plane_add(size=100);bpy.context.object.data.materials.append(material('Studio ground',(.20,.23,.25),.78));bpy.context.object.location.z=-.01
 bpy.ops.object.light_add(type='AREA',location=(3,-3,6));light=bpy.context.object;light.data.energy=700;light.data.size=5;light.rotation_euler=(Vector((0,0,.7))-light.location).to_track_quat('-Z','Y').to_euler();bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.lens=55;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=6;scene.render.resolution_x=1100;scene.render.resolution_y=650;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';return scene,cam
def render_views(folder):
 scene,cam=studio()
 for name,pose in [('front',(5,-7,2.2)),('rear',(5,7,2.1)),('left',(8,0,1.3)),('right',(-8,0,1.3)),('front-direct',(0,-8,1.35)),('rear-direct',(0,8,1.35))]:
  cam.location=pose;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(folder/(name+'.png'));bpy.ops.render.render(write_still=True)
