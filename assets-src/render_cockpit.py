"""Render the shipped GLBs from the actual driver poses, without a browser.
Blender authoring evidence only: these are not WebGL screenshots or FPS tests.
blender -b --factory-startup --python assets-src/render_cockpit.py -- hypercar
"""
import sys, math, re, ast
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from asset_tools import *
from mathutils import Matrix
import bmesh

OUT = ROOT/'assets-src/cockpit/previews'
OUT.mkdir(parents=True, exist_ok=True)
poses = {}
for kind, eye, lift in re.findall(r"(\w+):\{eye:(\[[^\]]+\]),lift:([.\d]+)", (ROOT/'dist/cameras.js').read_text()):
 poses[kind] = {'eye': ast.literal_eval(eye), 'lift': float(lift)}
roof_bounds = {kind: ast.literal_eval(bounds) for kind,bounds in re.findall(r'(\w+):(\[[^\]]+\])', (ROOT/'dist/cameras.js').read_text().split('DRIVER_ROOFS=')[1].split('});')[0])}
args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
kinds = [arg for arg in args if arg in poses] or list(poses)
mode = 'night' if 'night' in args else 'tracking' if 'tracking' in args else 'day'
jobs = [(kind,mode) for kind in kinds]
if not args: jobs += [('hypercar','night'),('hypercar','tracking')]

def load_body(kind,inside=True):
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets/vehicles'/f'{kind}.glb'))
 bpy.context.view_layer.update()
 objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
 points = [o.matrix_world@v.co for o in objects for v in o.data.vertices]
 low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
 high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
 tires = [o.matrix_world@v.co for o in objects if any('Tire' in m.name for m in o.data.materials) for v in o.data.vertices]
 scale = 4.6/(high.y-low.y)
 ground = min(p.z for p in tires)
 n = Matrix.Scale(scale,4)@Matrix.Translation(Vector((-(high.x+low.x)/2, -(high.y+low.y)/2, -ground)))
 for o in objects:
  world = n@o.matrix_world
  o.parent = None
  o.matrix_world = world
  bm = bmesh.new();bm.from_mesh(o.data)
  def hide_face(f):
   if not inside:return False
   name=o.data.materials[f.material_index].name
   if name in ['Cabin leather','Glass glazing']: return True
   if name != 'Paint Pearl' or kind not in roof_bounds: return False
   c=world@f.calc_center_median();x,y,z=c.x,c.z,-c.y;b=roof_bounds[kind]
   return b[0]<=x<=b[1] and b[2]<=y<=b[3] and b[4]<=z<=b[5]
  remove = [f for f in bm.faces if hide_face(f)]
  bmesh.ops.delete(bm, geom=remove, context='FACES')
  bm.to_mesh(o.data);bm.free()
 return objects

for kind,mode in jobs:
 reset();load_body(kind,mode!='tracking')
 existing = set(bpy.context.scene.objects)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets/vehicles/cockpit.glb'))
 bpy.context.view_layer.update()
 for o in set(bpy.context.scene.objects)-existing:
  if o.type != 'MESH': continue
  parent=o.parent;group=''
  while parent:
   if parent.name in ['CockpitHeader','CockpitFrame']:group=parent.name;break
   parent=parent.parent
  world=o.matrix_world.copy();o.parent=None;o.matrix_world=world
  o.location.z += poses[kind]['lift']
  if group:
   o.location.z += poses[kind]['eye'][1]-poses['hypercar']['eye'][1]-poses[kind]['lift']
   o.location.y -= poses[kind]['eye'][2]-poses['hypercar']['eye'][2]
  if group == 'CockpitHeader' and kind == 'spyder':o.hide_render=True
  if mode == 'tracking':o.hide_render=True
 scene, cam = studio()
 # Replace the neutral studio floor with a road and local reflection texture.
 ground=bpy.data.objects.get('Plane')
 ground.data.materials.clear()
 road=material('Preview asphalt',(.09,.11,.12),.54)
 bs=road.node_tree.nodes.get('Principled BSDF')
 tex=road.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'dist/assets/road-worn.jpg'))
 road.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
 ground.data.materials.append(road)
 paint=material('Preview lane marking',(.78,.79,.74),.67)
 for y in range(-70,6,5):cube('Road dash',(0,y,.004),(.1,2.2,.008),paint,0)
 for x in [-4.7,4.7]:cube('Road edge',(x,-34,.006),(.1,80,.009),paint,0)
 if mode == 'night':
  nt=scene.world.node_tree
  nt.nodes.get('Environment Texture').image=bpy.data.images.load(str(ROOT/'dist/assets/night-sky.png'))
  nt.nodes.get('Background').inputs['Strength'].default_value=.7
  for o in scene.objects:
   if o.type=='LIGHT':o.data.energy=120;o.data.color=(.34,.48,.74)
  bpy.ops.object.light_add(type='SUN',location=(-65,45,85))
  moon=bpy.context.object;moon.data.energy=.9;moon.data.color=(.55,.69,1);moon.data.angle=.10
  moon.rotation_euler=(Vector((0,0,0))-moon.location).to_track_quat('-Z','Y').to_euler()
  for x in [-.75,.75]:
   bpy.ops.object.light_add(type='SPOT',location=(x,-1.98,.73))
   light=bpy.context.object;light.data.energy=1800;light.data.color=(.65,.82,1)
   light.data.spot_size=.70;light.data.spot_blend=.65
   light.rotation_euler=(Vector((x,-20,0))-light.location).to_track_quat('-Z','Y').to_euler()
  for x,y in [(-4.6,-14),(4.6,-28)]:
   bpy.ops.object.light_add(type='POINT',location=(x,y,3.6))
   light=bpy.context.object;light.data.energy=300;light.data.color=(1,.55,.19);light.data.shadow_soft_size=.4
 eye=poses[kind]['eye'];cam.location=(eye[0],-eye[2],eye[1])
 target=cam.location+Vector((0,-28,-.06))
 cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 cam.data.sensor_fit='VERTICAL';cam.data.sensor_height=24
 cam.data.lens=12/math.tan(math.radians(76)/2)
 cam.data.clip_start=.035
 if mode == 'tracking':
  cam.location=(math.sin(-.72)*7.5,-math.cos(-.72)*7.5,1.45)
  cam.rotation_euler=(Vector((0,0,.55))-cam.location).to_track_quat('-Z','Y').to_euler()
  cam.data.lens=12/math.tan(math.radians(50)/2);cam.data.clip_start=.1
 scene.render.resolution_x=960;scene.render.resolution_y=540;scene.cycles.samples=16
 scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=92
 scene.render.filepath=str(OUT/f'{kind}-{mode}.jpg')
 bpy.ops.render.render(write_still=True)
 print('COCKPIT_PREVIEW',kind,mode,flush=True)
