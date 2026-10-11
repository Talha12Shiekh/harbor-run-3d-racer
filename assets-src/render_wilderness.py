"""Render the authored kit on the actual circuit. This is not a browser screenshot.
blender -b --factory-startup --python assets-src/render_wilderness.py
"""
import sys,json,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from asset_tools import *
from mathutils import Matrix
SRC=ROOT/'assets-src/wilderness';TRACK=json.loads((ROOT/'assets-src/track.json').read_text());CACHE={}
def source(name,vehicle=False):
 key=(name,vehicle)
 if key not in CACHE:
  folder=ROOT/'assets-src/vehicles' if vehicle else SRC
  with bpy.data.libraries.load(str(folder/(name+'.blend')),link=False) as (a,b):b.objects=a.objects
  CACHE[key]=[o for o in b.objects if o and o.type=='MESH']
 return CACHE[key]
def original_matrix(o):
 return original_matrix(o.parent)@o.matrix_parent_inverse@o.matrix_basis if o.parent else o.matrix_basis
def place(name,p,vehicle=False):
 matrix=Matrix.Translation((p['x'],-p['z'],p['y']))@Matrix.Rotation(p.get('heading',0),4,'Z')@Matrix.Diagonal((p.get('scaleX',p.get('scale',1)),p.get('scaleZ',p.get('scale',1)),p.get('scaleY',p.get('scale',1)),1))
 for proto in source(name,vehicle):
  o=bpy.data.objects.new(name,proto.data);bpy.context.collection.objects.link(o);o.matrix_world=matrix@original_matrix(proto)
def render(theme):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);CACHE.clear();place('terrain-'+theme,{'x':0,'y':0,'z':0,'heading':0});place('road-'+theme,{'x':0,'y':0,'z':0,'heading':0})
 placements=json.loads((SRC/(theme+'-placements.json')).read_text())
 for p in placements:
  if math.hypot(p['x'],p['z'])<330:place(p['name'],p)
 car='hypercar' if theme=='forest' else 'spyder';p=TRACK['samples'][0];place(car,{'x':p['x']-2.4,'y':p['y']+.03,'z':p['z'],'heading':p['heading']},True)
 scene=bpy.context.scene;scene.world.use_nodes=True;nt=scene.world.node_tree;nt.nodes.clear();tex=nt.nodes.new('ShaderNodeTexEnvironment');tex.image=bpy.data.images.load(str(ROOT/'dist/assets/daylight.hdr'),check_existing=True);bg=nt.nodes.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.65 if theme=='forest' else .85;nt.links.new(tex.outputs[0],bg.inputs[0]);out=nt.nodes.new('ShaderNodeOutputWorld');nt.links.new(bg.outputs[0],out.inputs[0]);
 bpy.ops.object.light_add(type='SUN',location=(-65,45,85));sun=bpy.context.object;sun.data.energy=2.1 if theme=='forest' else 2.5;sun.data.angle=.10;sun.rotation_euler=(Vector((0,0,0))-sun.location).to_track_quat('-Z','Y').to_euler();
 bpy.ops.object.camera_add(location=(-2.4,8.2,p['y']+2.4));cam=bpy.context.object;cam.rotation_euler=(Vector((-2.4,-6,p['y']+.9))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=31;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=6;scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.render.filepath=str(SRC/(theme+'-scene.png'));bpy.ops.render.render(write_still=True)
 bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(SRC/(theme+'-circuit.blend')),compress=True)
for theme in ['forest','alpine']:render(theme)
