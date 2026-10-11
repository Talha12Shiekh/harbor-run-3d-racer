"""Blender 4.5 city kit. Run: blender --background --python assets-src/build_city.py"""
import bpy,math,random,json,sys
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1];TEX=ROOT/'assets-src/textures';OUT=ROOT/'dist/assets/city';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
rnd=random.Random(7814);collections={};assets=[];current=None

def material(name,color=(.4,.4,.4),rough=.8,metal=0,texture=None,normal=None,alpha=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1);bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 if texture:
  img=bpy.data.images.load(str(texture),check_existing=True);n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=img;m.node_tree.links.new(n.outputs['Color'],bs.inputs['Base Color'])
  if alpha:m.node_tree.links.new(n.outputs['Alpha'],bs.inputs['Alpha']);m.surface_render_method='DITHERED';m.use_transparency_overlap=False
 if normal:
  n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=bpy.data.images.load(str(normal),check_existing=True);n.image.colorspace_settings.name='Non-Color';nm=m.node_tree.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.3;m.node_tree.links.new(n.outputs['Color'],nm.inputs['Color']);m.node_tree.links.new(nm.outputs['Normal'],bs.inputs['Normal'])
 return m
stone=material('Weathered limestone',texture=TEX/'limestone.jpg',normal=TEX/'limestone-normal.jpg');concrete=material('Aged concrete',texture=TEX/'concrete.jpg',normal=TEX/'concrete-normal.jpg');brick=material('Photo brick',texture=ROOT/'dist/assets/brick.jpg',normal=ROOT/'dist/assets/brick-normal.jpg');pavement=material('Paving slabs',texture=TEX/'pavement.jpg',normal=TEX/'pavement-normal.jpg');rust=material('Weathered industrial steel',rough=.72,metal=.45,texture=TEX/'rust.jpg',normal=TEX/'rust-normal.jpg');bark=material('Ridged bark',texture=TEX/'bark.jpg',normal=TEX/'bark-normal.jpg');foliage=material('Leaf cluster cutout',rough=.88,texture=TEX/'foliage.png',alpha=True);foliage.use_backface_culling=False
trim=material('Muted stone trim',(.34,.35,.31));dark=material('Recess shadow and roofing',(.09,.11,.11));iron=material('Ironwork',(.08,.1,.095),.48,.6);paint=material('Painted industrial green',(.13,.18,.17),.55,.3);glass=[material('Glass '+str(i),c,.19,.45) for i,c in enumerate([(.065,.10,.12),(.13,.19,.22),(.22,.28,.30),(.055,.075,.08)])]
for g in glass:g.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=.45

def collection(name):
 global current
 c=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(c);collections[name]=c;current=c;return c

def add_obj(o,name,mat):
 o.name=name
 for c in list(o.users_collection):c.objects.unlink(o)
 current.objects.link(o);o.data.materials.append(mat);return o

def uv_world(o,tile=3):
 if o.type!='MESH':return
 mesh=o.data
 if not mesh.uv_layers:mesh.uv_layers.new(name='UVMap')
 uv=mesh.uv_layers.active.data
 for f in mesh.polygons:
  axis=max(range(3),key=lambda i:abs(f.normal[i]));axes=[i for i in range(3) if i!=axis]
  for li in f.loop_indices:
   v=mesh.vertices[mesh.loops[li].vertex_index].co;uv[li].uv=(v[axes[0]]/tile,v[axes[1]]/tile)

def box(name,location,size,mat,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=location);o=add_obj(bpy.context.object,name,mat);o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);uv_world(o)
 if bevel:
  m=o.modifiers.new('Edge bevel','BEVEL');m.width=bevel;m.segments=1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
 return o

def cyl(name,a,b,r,mat,vertices=8,r2=None):
 a,b=Vector(a),Vector(b);v=b-a;bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r if r2 is None else r2,depth=v.length,location=(a+b)/2);o=add_obj(bpy.context.object,name,mat);o.rotation_euler=v.to_track_quat('Z','Y').to_euler();uv_world(o,1);return o

def window(x,z,w,h,front):
 box('Dark recessed window',(x,front-.035,z),(w+.24,.1,h+.25),dark)
 box('Window glazing',(x,front-.105,z),(w,.045,h),rnd.choice(glass))
 for dx in [-w/2-.045,w/2+.045]:box('Jamb',(x+dx,front-.14,z),(.085,.2,h+.16),trim,.015)
 for dz in [-h/2,h/2]:box('Frame',(x,front-.15,z+dz),(w+.14,.2,.09),trim,.012)
 box('Sill',(x,front-.24,z-h/2-.07),(w+.32,.45,.13),stone,.02)
 box('Mullion',(x,front-.135,z),(.045,.08,h),iron)

def cornice(w,d,z):
 for i,(extra,h) in enumerate([(0,.18),(.35,.16),(.6,.12)]):box('Cornice profile',(0,0,z+i*.16),(w+extra,d+extra,h),stone,.04)

def doors(front,width=3):
 box('Entry recess',(0,front-.04,1.5),(width+1,.18,3.1),dark)
 box('Glass doors',(0,front-.12,1.35),(width,.06,2.6),glass[1])
 for x in [-width/2,0,width/2]:box('Entry metal frame',(x,front-.2,1.4),(.07,.15,2.8),iron)
 box('Entrance canopy',(0,front-1.2,3.15),(width+2,2.4,.2),iron,.05)
 for x in [-width/2+.3,width/2-.3]:box('Door handle',(x,front-.22,1.2),(.04,.08,.6),trim)

def roof_details(w,d,h):
 box('Roof deck',(0,0,h+.1),(w-.6,d-.6,.2),dark)
 for y in [-d/2,d/2]:box('Parapet',(0,y,h+.5),(w,.25,.9),concrete,.03)
 for x in [-w/2,w/2]:box('Parapet',(x,0,h+.5),(.25,d,.9),concrete,.03)
 box('HVAC housing',(w*.2,0,h+.9),(3,4,1.5),rust,.08)
 for i in range(9):box('HVAC vent',(w*.2, -2.04,h+.35+i*.12),(2.5,.05,.035),dark)
 cyl('Vent stack',(-w*.2,d*.15,h),(-w*.2,d*.15,h+2.4),.28,rust,12)

def arch(front):
 r=1.8;z=2.2
 for i in range(13):
  a=i/13*math.pi;b=(i+1)/13*math.pi;verts=[]
  for y in [front-.13,front-.42]:
   for rad,angle in [(r,a),(r+.35,a),(r+.35,b),(r,b)]:verts.append((math.cos(angle)*rad,y,z+math.sin(angle)*rad))
  faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)];mesh=bpy.data.meshes.new('Arch voussoir');mesh.from_pydata(verts,[],faces);o=bpy.data.objects.new('Arched stone entrance',mesh);current.objects.link(o);mesh.materials.append(stone);uv_world(o)
 for x in [-r-.175,r+.175]:box('Arch pier',(x,front-.28,1.1),(.35,.5,2.2),stone,.03)

def building(name,style,w,d,h):
 collection(name);front=-d/2
 wall=brick if style=='masonry' else stone if style=='limestone' else rust if style=='warehouse' else concrete
 box('Architectural shell',(0,0,h/2),(w,d,h),wall,.055)
 box('Weathered base',(0,0,.65),(w+.12,d+.12,1.3),dark,.03)
 if style in ['masonry','limestone']:
  for z in [3.4,h-1.2]:cornice(w,d,z)
  cols=int(w/3.2);floors=int((h-4)/3.6)
  for row in range(floors):
   z=5+row*3.6
   for i in range(cols):window(-w/2+2+(w-4)*i/max(1,cols-1),z,1.45,2.1,front)
  if style=='limestone':
   for x in [-w/2+.4,w/2-.4,-w*.28,w*.28]:box('Stone pilaster',(x,front-.24,h/2),(.38,.4,h-1.5),stone,.03)
   arch(front)
  doors(front)
  # Fire escape structure and rainwater downpipe add recognizable silhouette.
  side=w/2+.3
  for z in range(5,int(h)-2,4):
   box('Fire escape platform',(side+.45,0,z),(1.4,5,.12),iron)
   for y in [-2.3,0,2.3]:cyl('Railing upright',(side+1,y,z),(side+1,y,z+1),.03,iron,6)
   cyl('Escape railing',(side+1,-2.3,z+1),(side+1,2.3,z+1),.03,iron,6)
  cyl('Rainwater downpipe',(-w/2+.7,front-.2,.6),(-w/2+.7,front-.2,h),.08,rust,8)
 elif style in ['office','tower']:
  floor_h=3.8;cols=int(w/2.6)
  for row in range(int(h/floor_h)):
   z=2.1+row*floor_h
   for i in range(cols):
    x=-w/2+1.35+i*(w-2.7)/max(1,cols-1);box('Curtain glazing',(x,front-.075,z),(2.15,.05,3.15),glass[(i+row)%4]);box('Curtain mullion',(x-1.14,front-.13,z),(.065,.12,3.8),iron)
   box('Spandrel band',(0,front-.12,z+1.7),(w,.16,.28),trim)
  for i in [-1,1]:box('Vertical structural pier',(i*(w/2-.2),front-.2,h/2),(.3,.35,h),concrete,.025)
  doors(front,5)
  if style=='tower':
   for i in range(3):box('Stepped crown',(0,0,h+1.5+i*3),(w-3-i*3,d-3-i*3,3),stone,.07)
   cyl('Spire',(0,0,h+9),(0,0,h+19),.35,iron,8,r2=.04)
 else:
  box('Concrete warehouse lower wall',(0,front-.08,2),(w,.17,4),concrete)
  for x in range(-int(w/2)+1,int(w/2)):
   box('Corrugated steel rib',(x,front-.14,(h+4)/2),(.08,.15,h-4),rust)
  for x in [-w*.3,w*.3]:
   box('Roller loading door',(x,front-.15,2.8),(6,.1,5.5),dark)
   for z in range(1,11):box('Roller shutter slat',(x,front-.23,z*.5),(5.8,.06,.34),rust)
   box('Loading door lintel',(x,front-.4,5.9),(6.5,.5,.3),concrete,.04)
  for x in [-w*.4,0,w*.4]:window(x,h-2.2,2.8,1.3,front)
 roof_details(w,d,h)
 return export(name,{'kind':'building','width':w,'depth':d,'height':h+(19 if style=='tower' else 3)})

def export(name,meta):
 # Join by material, applying all real geometry before export. No placeholder boxes at runtime.
 objs=[o for o in current.objects if o.type=='MESH'];groups={}
 for o in objs:groups.setdefault(o.data.materials[0].name,[]).append(o)
 merged=[]
 for matname,parts in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=name+' / '+matname;merged.append(o)
 bpy.ops.object.select_all(action='DESELECT')
 for o in merged:o.select_set(True)
 bpy.context.view_layer.objects.active=merged[0]
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False,export_image_format='AUTO')
 bpy.context.view_layer.update();points=[o.matrix_world@v.co for o in merged for v in o.data.vertices]
 lo=[min(v[i] for v in points) for i in range(3)];hi=[max(v[i] for v in points) for i in range(3)]
 meta.update(name=name,file=name+'.glb',meshes=len(merged),triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in merged),bounds={'min':[lo[0],lo[2],-hi[1]],'max':[hi[0],hi[2],-lo[1]]});assets.append(meta);print('EXPORTED',name,meta,flush=True)
 return current

building('masonry','masonry',18,17,22)
building('limestone','limestone',23,19,30)
building('office','office',25,23,52)
building('tower','tower',19,19,59)
building('warehouse','warehouse',31,22,12)

def tree(name,seed,height,spread):
 global rnd
 rnd=random.Random(seed);collection(name)
 cyl('Tapered trunk',(0,0,0),(.1,.05,height*.75),.24,bark,10,r2=.08)
 clusters=[]
 for i in range(18):
  a=i*2.399;z=height*.32+i/18*height*.53;r=spread*(.6+ rnd.random()*.4)*(1-abs(z-height*.63)/height)
  end=Vector((math.sin(a)*r,math.cos(a)*r,z));start=Vector((.06,0,z*.68));cyl('Branch',start,end,.07*(1-i/24),bark,7,r2=.015);clusters.append(end)
  for j in range(3):
   tip=end+Vector((rnd.uniform(-1,1),rnd.uniform(-1,1),rnd.uniform(.2,1.5)));cyl('Twig',end,tip,.025,bark,6,r2=.008)
   for k in range(2):clusters.append(tip+Vector((rnd.uniform(-.6,.6),rnd.uniform(-.6,.6),rnd.uniform(-.3,.7))))
 verts=[];faces=[];uv=[]
 for center in clusters:
  for i in range(2):
   a=rnd.random()*math.tau;tilt=rnd.uniform(-.55,.55);size=rnd.uniform(.7,1.15);u=Vector((math.cos(a),math.sin(a),0))*size;v=Vector((-math.sin(a)*math.sin(tilt),math.cos(a)*math.sin(tilt),math.cos(tilt)))*size
   n=len(verts);verts.extend([center-u-v,center+u-v,center+u+v,center-u+v]);faces.append((n,n+1,n+2,n+3));uv.extend([(0,0),(1,0),(1,1),(0,1)])
 mesh=bpy.data.meshes.new('Leaf card mesh');mesh.from_pydata(verts,[],faces);mesh.uv_layers.new(name='UVMap');o=bpy.data.objects.new('Detailed leaf clusters',mesh);current.objects.link(o);mesh.materials.append(foliage)
 for f in mesh.polygons:
  f.use_smooth=True
  for i,li in enumerate(f.loop_indices):mesh.uv_layers.active.data[li].uv=[(0,0),(1,0),(1,1),(0,1)][i]
 mesh.normals_split_custom_set_from_vertices([tuple((v.co-Vector((0,0,height*.58))).normalized()) for v in mesh.vertices])
 export(name,{'kind':'tree','height':height,'spread':spread})
tree('tree-broad',21,9.3,3.4);tree('tree-tall',53,12.5,2.8)
collection('pipe-bridge')
for x in [-12,12]:
 for y in [-1.6,1.6]:box('Bridge steel support',(x,y,4.3),(.45,.45,8.6),paint,.04)
 box('Concrete pier',(x,0,.5),(1.5,4,1),concrete,.07)
for y in [-1.6,1.6]:
 box('Crossing girder',(0,y,7.7),(25,.28,.5),rust,.03)
 for x in range(-12,13,3):
  cyl('Truss diagonal',(x,y,7.7),(min(12,x+3),y,9),.07,rust,6)
  cyl('Truss diagonal',(x,y,9),(min(12,x+3),y,7.7),.07,rust,6)
for y,r,z in [(-1.1,.42,8.4),(0,.32,8.35),(1,.5,8.45)]:
 cyl('Industrial pipe',(-13,y,z),(13,y,z),r,rust,16)
 for x in range(-12,13,3):cyl('Pipe collar',(x-.08,y,z),(x+.08,y,z),r+.055,iron,16)
export('pipe-bridge',{'kind':'bridge','width':27,'depth':4,'height':9.5})
collection('street-props')
box('Bus shelter base',(0,0,.12),(6,2,.24),concrete,.04)
for x in [-2.8,2.8]:
 for y in [-.8,.8]:cyl('Shelter post',(x,y,.2),(x,y,2.8),.055,iron,8)
box('Shelter canopy',(0,0,2.8),(6.4,2.4,.15),iron,.04);box('Shelter glass backing',(0,.8,1.5),(5.5,.03,2.3),glass[2]);box('Bench',(0,.4,.65),(4,.6,.12),stone,.04)
for x in [-1.5,1.5]:box('Bench supports',(x,.4,.37),(.12,.55,.55),iron)
export('street-props',{'kind':'prop','width':6.4,'depth':2.4,'height':2.9})
collection('hydrant')
cyl('Hydrant body',(0,0,0),(0,0,.9),.16,rust,12);cyl('Hydrant lid',(0,0,.9),(0,0,1.04),.19,rust,12,r2=.10);cyl('Hydrant nozzle',(-.3,0,.65),(.3,0,.65),.10,iron,10);export('hydrant',{'kind':'prop','width':.7,'depth':.4,'height':1.04})
(OUT/'manifest.json').write_text(json.dumps({'blender':bpy.app.version_string,'seed':7814,'assets':assets},indent=2))
# Pack a clearly arranged editable asset kit. Exports were made at origin before gallery placement.
for i,(name,c) in enumerate(collections.items()):
 for o in c.objects:o.location.x+=(i%5)*43;o.location.y+=(i//5)*45
for img in bpy.data.images:
 if img.source=='FILE':img.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets-src/city-kit.blend'),compress=True)
print('SAVED EDITABLE CITY KIT',flush=True)
bpy.context.view_layer.update()
# A Blender render uses the actual exported asset geometry, not a concept image or game screenshot.
if '--render' in sys.argv:
 for c in collections.values():
  for o in c.objects:o.hide_render=True
 scene=bpy.context.scene;collection('Render verification street')
 for row in range(4):
  for side in [-1,1]:
   source=collections[['masonry','limestone','office','warehouse'][row]]
   for o in source.objects:
    idx=list(collections).index(source.name);asset_matrix=Matrix.Translation(Vector((-(idx%5)*43,-(idx//5)*45,0)))@o.matrix_world
    copy=o.copy();copy.data=o.data;current.objects.link(copy);copy.hide_render=False;copy.matrix_world=Matrix.Translation(Vector((side*24,30+row*35,0)))@Matrix.Rotation(-side*math.pi/2,4,'Z')@asset_matrix
 for side in [-1,1]:
  for y in [12,43,80,120]:
   for o in collections['tree-broad'].objects:
    copy=o.copy();copy.data=o.data;current.objects.link(copy);copy.hide_render=False;idx=list(collections).index('tree-broad');copy.location=o.location-Vector(((idx%5)*43,(idx//5)*45,0))+Vector((side*12.2,y,0))
 road=material('Weathered road',texture=TEX/'road-worn.jpg',rough=.92);box('Street',(0,65,-.13),(19,220,.2),road);box('Ground',(0,70,-.3),(300,350,.3),concrete)
 for side in [-1,1]:box('Sidewalk',(side*11.5,65,-.04),(4,220,.2),pavement)
 white=material('Worn road markings',(.5,.5,.43))
 for y in range(-20,165,10):box('Lane marking',(0,y,-.02),(.13,4,.015),white)
 # The existing detailed car is kept in the preview for scale and contact.
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets/car.glb'))
 imported=[o for o in bpy.context.selected_objects if o.type=='MESH']
 if imported:
  bpy.context.view_layer.update();corners=[o.matrix_world@Vector(c) for o in imported for c in o.bound_box];lo=Vector(tuple(min(v[i] for v in corners) for i in range(3)));hi=Vector(tuple(max(v[i] for v in corners) for i in range(3)));s=4.6/(hi.y-lo.y)
  for o in imported:
   mat=o.matrix_world.copy();o.parent=None;o.matrix_world=mat;o.location*=s;o.scale*=s;o.location.z-=lo.z*s;o.location.y-=4;o.location.x-=3
 scene.world.use_nodes=True;wn=scene.world.node_tree;wn.nodes.clear();env=wn.nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(ROOT/'dist/assets/daylight.hdr'));bg=wn.nodes.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.6;wn.links.new(env.outputs['Color'],bg.inputs['Color']);output=wn.nodes.new('ShaderNodeOutputWorld');wn.links.new(bg.outputs[0],output.inputs[0])
 bpy.ops.object.light_add(type='SUN',location=(-20,-40,30));sun=bpy.context.object;sun.rotation_euler=(math.radians(28),math.radians(-25),math.radians(-40));sun.data.energy=2.2;sun.data.angle=math.radians(4)
 bpy.ops.object.camera_add(location=(-7,-14,3.5));camera=bpy.context.object;direction=Vector((2,30,5))-camera.location;camera.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();camera.data.lens=29;scene.camera=camera
 scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=20;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=6;scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100;scene.render.filepath=str(ROOT/'assets-src/scene-preview.png');scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.45;bpy.ops.render.render(write_still=True)
