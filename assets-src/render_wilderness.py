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
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);CACHE.clear();base='forest' if theme=='night' else theme;place('terrain-'+base,{'x':0,'y':0,'z':0,'heading':0});place('road-'+base,{'x':0,'y':0,'z':0,'heading':0})
 placements=json.loads((SRC/(theme+'-placements.json')).read_text())
 for p in placements:
  if math.hypot(p['x'],p['z'])<330:place(p['name'],p)
 car='spyder' if theme=='alpine' else 'rally' if theme=='night' else 'hypercar';p=TRACK['samples'][0];place(car,{'x':p['x']-2.4,'y':p['y']+.03,'z':p['z'],'heading':p['heading']},True)
 scene=bpy.context.scene;scene.world.use_nodes=True;nt=scene.world.node_tree;nt.nodes.clear();tex=nt.nodes.new('ShaderNodeTexEnvironment');tex.image=bpy.data.images.load(str(ROOT/('dist/assets/night-sky.png' if theme=='night' else 'dist/assets/daylight.hdr')),check_existing=True);bg=nt.nodes.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.7 if theme=='night' else .65 if theme=='forest' else .85;nt.links.new(tex.outputs[0],bg.inputs[0]);out=nt.nodes.new('ShaderNodeOutputWorld');nt.links.new(bg.outputs[0],out.inputs[0]);
 bpy.ops.object.light_add(type='SUN',location=(-65,45,85));sun=bpy.context.object;sun.data.energy=.9 if theme=='night' else 2.1 if theme=='forest' else 2.5;sun.data.color=(.55,.69,1) if theme=='night' else (1,.95,.87);sun.data.angle=.10;sun.rotation_euler=(Vector((0,0,0))-sun.location).to_track_quat('-Z','Y').to_euler();
 if theme=='night':
  # Broad cool fill approximates the runtime hemisphere light in the authoring preview.
  bpy.ops.object.light_add(type='AREA',location=(-2.4,3,14));fill=bpy.context.object;fill.data.energy=420;fill.data.shape='DISK';fill.data.size=18;fill.data.color=(.32,.52,1)
  for q in placements:
   if q['name']!='street-lamp' or math.hypot(q['x'],q['z'])>230:continue
   bpy.ops.object.light_add(type='SPOT',location=(q['x']-2.95*math.cos(q['heading']),-(q['z']+2.95*math.sin(q['heading'])),q['y']+8.20));light=bpy.context.object;light.data.energy=1400;light.data.color=(1,.67,.33);light.data.spot_size=1.6;light.data.spot_blend=.8;light.rotation_euler=(Vector((q['x']-12*math.cos(q['heading']),-q['z'],q['y']))-light.location).to_track_quat('-Z','Y').to_euler()
  meta=json.loads((ROOT/'dist/assets/vehicles'/('rally.json')).read_text())
  for xyz in meta['headlights']:
   bpy.ops.object.light_add(type='SPOT',location=(p['x']-2.4+xyz[0],-p['z']-xyz[2]-.05,p['y']+xyz[1]));light=bpy.context.object;light.data.energy=1800;light.data.color=(.68,.82,1);light.data.spot_size=.7;light.data.spot_blend=.65;light.rotation_euler=(Vector((light.location.x,light.location.y-22,p['y']-.5))-light.location).to_track_quat('-Z','Y').to_euler()
  for mat in bpy.data.materials:
   if mat.name.startswith('Brakelight'):
    mat.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=1.5
 bpy.ops.object.camera_add(location=(-2.4,8.2,p['y']+2.4));cam=bpy.context.object;cam.rotation_euler=(Vector((-2.4,-6,p['y']+.9))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=31;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=6;scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.render.filepath=str(SRC/(theme+'-scene.png'));bpy.ops.render.render(write_still=True)
 ui=ROOT/'dist/assets/ui';ui.mkdir(exist_ok=True);scene.render.resolution_x=960;scene.render.resolution_y=540;scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=88;scene.render.filepath=str(ui/(theme+'.jpg'));bpy.ops.render.render(write_still=True)
 if theme=='night':
  cam.data.shift_x=-.32;cam.location=(-7.5,9.5,p['y']+3);cam.rotation_euler=(Vector((-5,-4,p['y']+.8))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.resolution_x=1600;scene.render.resolution_y=900;scene.render.filepath=str(ui/'title.jpg');bpy.ops.render.render(write_still=True)
 scene.render.image_settings.file_format='PNG';bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(SRC/(theme+'-circuit.blend')),compress=True)
if __name__=='__main__':
 selected=next((theme for theme in sys.argv if theme in ['forest','alpine','night']),None)
 for theme in ([selected] if selected else ['forest','alpine','night']):render(theme)
