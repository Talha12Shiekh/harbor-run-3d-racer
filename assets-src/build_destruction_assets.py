"""Original breakable masonry and exposed vehicle frame, for Blender 4.5.
Run: blender --background --python assets-src/build_destruction_assets.py
No downloaded meshes are imported. Existing licensed brick maps are reused.
"""
import sys,json,math,random
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from asset_tools import *
OUT=ROOT/'dist/assets/wilderness';SRC=ROOT/'assets-src/wilderness'

def brick_material():
 m=material('Masonry weathered brick',(.72,.68,.62),.87);bs=m.node_tree.nodes.get('Principled BSDF');nt=m.node_tree
 t=nt.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(ROOT/'dist/assets/brick.jpg'),check_existing=True);nt.links.new(t.outputs['Color'],bs.inputs['Base Color'])
 n=nt.nodes.new('ShaderNodeTexImage');n.image=bpy.data.images.load(str(ROOT/'dist/assets/brick-normal.jpg'),check_existing=True);n.image.colorspace_settings.name='Non-Color';normal=nt.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.55;nt.links.new(n.outputs['Color'],normal.inputs['Color']);nt.links.new(normal.outputs['Normal'],bs.inputs['Normal']);return m

def finish(name,kind):
 groups={}
 for o in list(bpy.context.scene.objects):
  if o.type=='MESH':groups.setdefault(o.data.materials[0].name,[]).append(o)
 for mat,items in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in items:o.select_set(True)
  bpy.context.view_layer.objects.active=items[0];bpy.ops.object.join();bpy.context.object.name=mat
 meta={'name':name,'file':name+'.glb','kind':kind,'originalGeometry':True,**measurements()};export(OUT/meta['file']);bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(SRC/(name+'.blend')),compress=True);return meta

def masonry():
 reset();brick=brick_material();cap=material('Masonry capstone',(.34,.34,.30),.93);rng=random.Random(819)
 for row in range(3):
  for i in range(6):
   y=-2.5+i+(row%2)*.04;o=cube('Bonded masonry block',(0,y,.145+row*.295),(.58,.985,.28),brick,.018)
   for v in o.data.vertices:
    if abs(v.co.x)>.2 and abs(v.co.y)>.35:v.co.z+=rng.uniform(-.008,.008)
 for i in range(6):cube('Separate top cap',(0,-2.5+i,.93),(.68,.985,.09),cap,.015)
 wall=finish('masonry-barrier','prop')
 reset();brick=brick_material();o=cube('Chipped masonry fracture block',(0,0,.145),(.58,.985,.28),brick,.024)
 for v in o.data.vertices:
  if v.co.x>.15 and v.co.y>.26:v.co.x-=.07;v.co.y-=.07;v.co.z+=.018*math.sin(v.co.x*31+v.co.y*17)
 return [wall,finish('masonry-chunk','fracture')]

def frame():
 reset();steel=material('Exposed chassis steel',(.12,.14,.15),.57,.65);alloy=material('Crash radiator fins',(.31,.35,.36),.48,.72)
 for x in [-.55,.55]:cube('Front chassis longitudinal',(x,-.2,.31),(.09,3.5,.11),steel,.008)
 for y in [-1.6,-.4,.7,1.25]:cube('Chassis cross member',(0,y,.31),(1.17,.09,.11),steel,.008)
 cube('Front radiator core',(0,-1.63,.56),(1.18,.12,.38),steel,.008)
 for i in range(18):cube('Visible heat exchanger fin',(-.54+i*.064,-1.715,.56),(.017,.018,.35),alloy,.002)
 for x in [-.59,.59]:cylinder('Crash frame brace',(x,-1.7,.35),(x,-.9,.58),.028,alloy,12)
 return finish('crash-frame','vehicle-detail')

def main():
 OUT.mkdir(parents=True,exist_ok=True);SRC.mkdir(parents=True,exist_ok=True)
 bpy.ops.preferences.addon_enable(module='io_scene_gltf2')
 assets=[*masonry(),frame()];p=OUT/'manifest.json';manifest=json.loads(p.read_text());names={a['name'] for a in assets};manifest['assets']=[a for a in manifest['assets'] if a['name'] not in names]+assets;p.write_text(json.dumps(manifest,separators=(',',':')))
 (SRC/'destruction-assets.json').write_text(json.dumps({'authoring':'Blender 4.5.3','originalGeometry':True,'assets':assets},indent=2));print('DESTRUCTION_ASSETS_EXPORTED',json.dumps(assets),flush=True)
if __name__=='__main__':main()
