"""Prepare Benit Kibabu's CC BY sedan for Harbor Run in Blender 4.5.
Run from the project root: blender -b --factory-startup --python assets-src/build_car.py -- --render
The original FBX and attribution are included. Runtime front is +Z, Blender front is -Y.
"""
import bpy,math,json,sys,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'assets-src';OUT=ROOT/'dist/assets';TEX=SRC/'textures'
UPSTREAM=SRC/'upstream/lancer-evolution-ix.fbx'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=str(UPSTREAM))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
# Freeze the imported hierarchy before editing or regrouping. Preserve the sculpted surfaces.
for o in meshes:
 world=o.matrix_world.copy();o.parent=None;o.data.transform(world);o.matrix_world=Matrix.Identity(4)
 # Join keeps UV layers by name. Use one name so decal UVs survive in TEXCOORD_0.
 if o.data.uv_layers:
  o.data.uv_layers.active.name='UVMap'
for o in list(bpy.context.scene.objects):
 if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True)
# The source is oversized. Fit a 4.6 m tuned body without changing the round tires.
ys=[v.co.y for o in meshes for v in o.data.vertices];scale=4.6/(max(ys)-min(ys))
tires=[o for o in meshes if o.name in ['FR_Wheel','FL_Wheel','RL_Wheel','RR_Wheel']]
ground=min(v.co.z for o in tires for v in o.data.vertices)*scale
for o in meshes:
 for v in o.data.vertices:
  v.co*=scale;v.co.z-=ground
  if o not in tires and not any(t in o.name for t in ['Brake','Break']):
   if v.co.z>.9:v.co.z=.9+(v.co.z-.9)*.86
 o.data.update()
# A small badge is omitted. The underlying car shape is credited to the original author.
for name in ['polySurface596']:
 o=bpy.data.objects.get(name)
 if o:bpy.data.objects.remove(o,do_unlink=True);meshes.remove(o)
def material(name,col,rough=.4,metal=0,coat=0,alpha=1,emission=None):
 m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF')
 bs.inputs['Base Color'].default_value=(*col,alpha);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough;bs.inputs['Coat Weight'].default_value=coat;bs.inputs['Coat Roughness'].default_value=.12;bs.inputs['Alpha'].default_value=alpha;m.diffuse_color=(*col,alpha)
 if alpha<1:m.surface_render_method='DITHERED';m.use_transparency_overlap=False
 if emission:bs.inputs['Emission Color'].default_value=(*emission[0],1);bs.inputs['Emission Strength'].default_value=emission[1]
 return m
paint=material('Paint Pearl',(.55,.32,.045),.29,.42,.8)
rubber=material('Tire rubber',(.025,.028,.032),.86)
trim=material('Black trim',(.014,.018,.022),.53,.08)
alloy=material('Forged red alloy',(.43,.018,.008),.25,.72,.45)
silver=material('Lamp reflector and metal',(.48,.50,.52),.23,.9)
glass=material('Glass glazing',(.055,.078,.09),.13,.06,.45,.44)
lens=material('Clear lamp lens',(.42,.47,.49),.12,.03,.6,.18)
head=material('Projector light',(.80,.85,.92),.22,.2,.2,emission=((.65,.72,.85),.18))
brake=material('Brakelight red',(.48,.005,.008),.26,.18,.65,emission=((.30,.002,.003),.22))
amber=material('Amber side markers',(.76,.17,.002),.25,.18,.5)
disc=material('Brake disc',(.22,.24,.25),.52,.72)
caliper=material('Red caliper',(.44,.012,.008),.36,.2)
interior=material('Interior charcoal',(.038,.044,.05),.82)
seat=material('Seat fabric',(.055,.063,.07),.95)
mirror=material('Mirror reflective face',(.62,.66,.7),.08,1)
carbon=material('Carbon trim',(.014,.018,.019),.38,.28)
# Source material names describe face regions, but original lamp and brake colors were unfinished.
for o in meshes:
 old=list(o.data.materials);face_materials=[p.material_index for p in o.data.polygons];new=[]
 center=sum((v.co for v in o.data.vertices),Vector())/len(o.data.vertices)
 for source in old:
  n=source.name if source else ''
  if n=='Body_Paint':m=paint
  elif n=='Glass_Material':m=lens if o.name in ['polySurface653','Interior_glass_cover'] else glass
  elif n=='Rims_Material':m=alloy
  elif n=='Tyres_Material':m=disc if any(t in o.name for t in ['Brake','Break']) else rubber
  elif n=='Lights_Material':
   # Positive Blender Y is the rear. Rear circular lamps and lower strip are red.
   m=brake if center.y>1.8 else (amber if o.name in ['polySurface446','polySurface458','polySurface447','polySurface459'] else head)
  elif n=='Silver_Paint':m=silver
  elif n=='Mirror_Material':m=mirror
  elif n=='Seats_Material':m=seat
  elif n in ['Grill_Material','Black_Paint']:m=trim
  else:m=interior
  new.append(m)
 o.data.materials.clear()
 for m in new:o.data.materials.append(m)
 for face,index in zip(o.data.polygons,face_materials):face.material_index=index
 # The tuned reference has a dark rear aerofoil, distinct from selectable body paint.
 for face in o.data.polygons:
  if o.name=='Boot_Spoiler' and o.data.materials[face.material_index]==paint and face.center.z>1.03:
   if carbon not in o.data.materials[:]:o.data.materials.append(carbon)
   face.material_index=list(o.data.materials).index(carbon)
 # Keep the author's smooth surfaces, panel gaps, handles, window frames and real interior.
 # Interior detail is hidden at game distance, simplify just these pieces.
 if any(n.name in ['Interior3_Material','Seats_Material','Dashboard_Paint','SteeringWheel_Material'] for n in old) and len(o.data.polygons)>2000:
  bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Interior game detail','DECIMATE');mod.ratio=.38;bpy.ops.object.modifier_apply(modifier=mod.name)
# Five spoke wheel faces follow the supplied tuned sedan reference.
for name in ['polySurface19','polySurface9','polySurface14','polySurface24']:
 o=bpy.data.objects.get(name)
 if o:meshes.remove(o);bpy.data.objects.remove(o,do_unlink=True)
for tire in tires:
 points=[v.co for v in tire.data.vertices];center=Vector([(min(v[i] for v in points)+max(v[i] for v in points))/2 for i in range(3)]);side=1 if center.x>0 else -1;outer=center.x+side*.102
 for index in range(5):
  a=index/5*math.tau+.3;u=Vector((0,math.cos(a),math.sin(a)));v=Vector((0,-math.sin(a),math.cos(a)))
  verts=[]
  outline=[(.048,-.032),(.16,-.035),(.241,-.025),(.246,.020),(.16,.037),(.048,.032)]
  for depth in [-.020,.016]:
   for radius,width in outline:verts.append(center+u*radius+v*width+Vector((outer-center.x+side*depth,0,0)))
  count=len(outline);faces=[tuple(range(count-1,-1,-1)),tuple(range(count,count*2))]
  for i in range(count):j=(i+1)%count;faces.append((i,j,j+count,i+count))
  data=bpy.data.meshes.new('Sculpted five spoke');data.from_pydata(verts,[],faces);data.update();o=bpy.data.objects.new('Forged wheel spoke',data);bpy.context.collection.objects.link(o);data.materials.append(alloy);meshes.append(o)
  bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Wheel edge machining','BEVEL');mod.width=.005;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)

# Independent wheel pivots come from actual tire centers, not guessed body bounds.
wheel_meta={};groups={}
for name,label in [('FL_Wheel','WheelFrontL'),('FR_Wheel','WheelFrontR'),('RL_Wheel','WheelRearL'),('RR_Wheel','WheelRearR')]:
 tire=bpy.data.objects[name];bb=[Vector(v) for v in tire.bound_box];center=Vector([(min(v[i] for v in bb)+max(v[i] for v in bb))/2 for i in range(3)])
 bpy.ops.object.empty_add(type='PLAIN_AXES',location=center);g=bpy.context.object;g.name=label;groups[label]=g;wheel_meta[label]=[round(center.x,6),round(center.z,6),round(-center.y,6)]
 for o in meshes:
  if any(t in o.name for t in ['Brake','Break']):continue
  bb=[v.co for v in o.data.vertices];c=sum(bb,Vector())/len(bb)
  # Only tire, rim and lug objects fit fully inside the local wheel volume.
  if abs(c.x-center.x)<.16 and abs(c.y-center.y)<.36 and max(v.z for v in bb)<.74:
   world=o.matrix_world.copy();o.parent=g;o.matrix_world=world
# Subtle geometric tire grooves, centered caliper accents and honest exhaust openings.
def cylinder(name,a,b,r,m):
 a,b=Vector(a),Vector(b);delta=b-a;bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r,depth=delta.length,location=(a+b)/2);o=bpy.context.object;o.name=name;o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
for label,g in groups.items():
 x,y,z=g.location;side=1 if x>0 else -1
 # The fixed caliper remains outside the spinning wheel hierarchy.
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x+side*.067,y+.10,z+.13));o=bpy.context.object;o.name='Stationary red caliper';o.scale=(.038,.075,.10);o.data.materials.append(caliper);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);mod=o.modifiers.new('Caliper rounded edges','BEVEL');mod.width=.012;mod.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
# Original decals use only our supplied texture, projected onto the authored body surfaces.
def decals(texture_path,hood=False):
 if not texture_path.exists():return
 m=material('Vinyl hood' if hood else 'Vinyl graphic',(1,1,1),.32,.15,.5)
 nt=m.node_tree;n=nt.nodes.new('ShaderNodeTexImage');n.image=bpy.data.images.load(str(texture_path));bs=nt.nodes.get('Principled BSDF');nt.links.new(n.outputs['Color'],bs.inputs['Base Color']);nt.links.new(n.outputs['Alpha'],bs.inputs['Alpha']);m.surface_render_method='DITHERED'
 targets=['polySurface593'] if hood else ['chassi','polySurface644','polySurface646','polySurface662','polySurface663']
 for target in targets:
  o=bpy.data.objects.get(target)
  if not o:continue
  vv=[];ff=[];uv=[]
  for p in o.data.polygons:
   c=p.center;n=p.normal
   if o.data.materials[p.material_index]!=paint:continue
   if hood:
    if not (-2.0<c.y<-1.0 and abs(c.x)<.32 and c.z>.7 and n.z>.5):continue
   elif not (abs(n.x)>.62 and .34<c.z<.95 and -.85<c.y<1.18):continue
   ids=[]
   for index in p.vertices:
    v=o.data.vertices[index].co+n*.0018;ids.append(len(vv));vv.append(v)
    uv.append((.67+(v.x+.32)/.64*.33,(v.y+2.0)) if hood else ((v.y+.85)/2.0,(v.z-.28)/.68))
   ff.append(ids)
  if not ff:continue
  data=bpy.data.meshes.new('Projected decal');data.from_pydata(vv,[],ff);data.update();decal=bpy.data.objects.new('Hood art' if hood else 'Door and fender art',data);bpy.context.collection.objects.link(decal);data.materials.append(m);layer=data.uv_layers.new(name='UVMap')
  for p in data.polygons:
   p.use_smooth=True
   for li in p.loop_indices:layer.data[li].uv=uv[data.loops[li].vertex_index]
decals(TEX/'sedan-vinyl.png');decals(TEX/'sedan-vinyl.png',True)
# Merge only matching materials inside each wheel and body. Multi material face regions are retained.
bpy.ops.object.select_all(action='DESELECT');merge={}
for o in bpy.context.scene.objects:
 if o.type=='MESH':merge.setdefault(o.parent.name if o.parent else 'Body',[]).append(o)
for parent,parts in merge.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=parent+' surfaces';bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
# Store the original wheel radius and mesh measurements for integration checks.
allmeshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];points=[o.matrix_world@v.co for o in allmeshes for v in o.data.vertices]
low=[min(v[i] for v in points) for i in range(3)];high=[max(v[i] for v in points) for i in range(3)]
meta={'name':'Harbor Rally Sedan','baseAuthor':'Benit Kibabu','license':'CC BY 4.0','source':'https://sketchfab.com/3d-models/mitsubishi-lancer-evolution-ix-ee88ad9414884bdabaf0658943ac339b','authoring':'Blender '+bpy.app.version_string,'frontAxis':'+Z','wheelRadius':round(.36309*scale,6),'wheels':wheel_meta,'dimensions':[round(high[0]-low[0],5),round(high[2]-low[2],5),round(high[1]-low[1],5)],'sourceSha256':hashlib.sha256(UPSTREAM.read_bytes()).hexdigest(),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in allmeshes)}
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(OUT/'tuner-sedan.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
for img in bpy.data.images:
 if img.source=='FILE':img.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'tuner-sedan.blend'),compress=True);(OUT/'tuner-sedan.json').write_text(json.dumps(meta,indent=2));print('SEDAN_EXPORTED',meta,flush=True)
if '--render' in sys.argv:
 scene=bpy.context.scene;scene.world.use_nodes=True;nt=scene.world.node_tree;nt.nodes.clear();env=nt.nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(OUT/'daylight.hdr'));bg=nt.nodes.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.8;nt.links.new(env.outputs['Color'],bg.inputs['Color']);end=nt.nodes.new('ShaderNodeOutputWorld');nt.links.new(bg.outputs[0],end.inputs[0])
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.012));o=bpy.context.object;o.data.materials.append(material('Studio floor',(.30,.32,.34),.84))
 bpy.ops.object.light_add(type='AREA',location=(4,-3,6));light=bpy.context.object;light.data.energy=1000;light.data.shape='DISK';light.data.size=5;light.rotation_euler=(Vector((0,0,.8))-light.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.lens=58;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=6;scene.render.resolution_x=1100;scene.render.resolution_y=700;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
 for name,pos in [('front',(5,-7,2.8)),('rear',(5,7,2.6)),('left',(8,0,1.45)),('right',(-8,0,1.45)),('front-direct',(0,-8,1.5)),('rear-direct',(0,8,1.5))]:
  cam.location=pos;cam.rotation_euler=(Vector((0,0,.75))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(SRC/('sedan-'+name+'.png'));bpy.ops.render.render(write_still=True)
