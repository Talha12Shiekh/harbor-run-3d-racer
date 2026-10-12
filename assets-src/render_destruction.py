"""CPU render of actual runtime damage snapshots, not browser GPU evidence.
First run prepare_destruction_preview.mjs; then pass its output folder:
blender -b --python assets-src/render_destruction.py -- /tmp/harbor-damage
"""
import sys,json,base64,array
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from asset_tools import *
from mathutils import Matrix
folder=Path(sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else '/tmp/harbor-damage')
def floats(data):
 a=array.array('f');a.frombytes(base64.b64decode(data));return a
for stage in ['intact','front-dent','front-wreck','side-wreck']:
 reset();data=json.loads((folder/(stage+'.json')).read_text())
 for source in data['meshes']:
  p=floats(source['position']);normals=floats(source['normal']);count=len(p)//3;points=[(p[i],-p[i+2],p[i+1]) for i in range(0,len(p),3)];faces=[(i,i+1,i+2) for i in range(0,count,3)];m=source['material'];mat=material(m['name'],m['color'],m['roughness'],m['metalness'],m['clearcoat'],m['opacity']);o=mesh(source['name'],points,faces,mat);o.data.normals_split_custom_set_from_vertices([(normals[i],-normals[i+2],normals[i+1]) for i in range(0,len(normals),3)])
  a=source['matrix'];runtime=Matrix([[a[i+j*4] for j in range(4)] for i in range(4)]);basis=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));o.matrix_world=basis@runtime@basis.inverted()
  if source['uv']:
   uv=floats(source['uv']);layer=o.data.uv_layers.new(name='UVMap')
   for loop in o.data.loops:layer.data[loop.index].uv=(uv[loop.vertex_index*2],uv[loop.vertex_index*2+1])
  bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(*m['emissive'],1);bs.inputs['Emission Strength'].default_value=m['emissiveIntensity']
  if m['name']=='Masonry weathered brick':
   tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'dist/assets/brick.jpg'),check_existing=True);mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
  if m['cracks']:
   t=m['cracks'];image=bpy.data.images.new('Runtime glazing cracks',width=t['width'],height=t['height']);raw=base64.b64decode(t['data']);image.pixels=[v/255 for v in raw];tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
 scene,cam=studio();scene.render.resolution_x=900;scene.render.resolution_y=560;scene.cycles.samples=12;scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=90
 for angle,pose in [('front',(5,-7,2.5)),('side',(-7,-3,2.4))]:
  cam.location=pose;cam.rotation_euler=(Vector((.25,0,.55))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(folder/(stage+'-'+angle+'.jpg'));bpy.ops.render.render(write_still=True)
 print('DAMAGE_RENDER',stage,flush=True)
