"""Original street coupe. Blender 4.5: blender -b --python assets-src/build_car.py -- --render"""
import bpy,math,json,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'dist/assets';SRC=ROOT/'assets-src';TEX=SRC/'textures';TEX.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
# Author coordinates match runtime X, height, forward Z. Blender uses Z up.
def B(p):return Vector((p[0],-p[2],p[1]))
def mat(name,color,rough=.4,metal=0,coat=0,alpha=1):
 m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,alpha);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal;bs.inputs['Alpha'].default_value=alpha;bs.inputs['Coat Weight'].default_value=coat;bs.inputs['Coat Roughness'].default_value=.1;m.diffuse_color=(*color,alpha)
 if alpha<1:m.surface_render_method='DITHERED';m.use_transparency_overlap=False
 return m
paint=mat('Paint Pearl',(0.78,.8,.81),.26,.38,.85);carbon=mat('Carbon trim',(.019,.023,.026),.36,.25);rubber=mat('Tire rubber',(.023,.027,.031),.87);chrome=mat('Forged alloy',(.49,.52,.55),.22,.9);dark=mat('Interior and vents',(.019,.022,.025),.82);glass=mat('Glass glazing',(.025,.045,.06),.1,0,.5,.36);lens=mat('Clear lamp lens',(.32,.4,.48),.09,0,.45,.16);brake=mat('Brakelight red',(.52,.012,.007),.22,.25,.6);head=mat('Projector light',(.75,.81,.89),.16,.1);disc=mat('Brake disc',(.28,.3,.31),.53,.65);caliper=mat('Red caliper',(.46,.015,.012),.4,.25);seam=mat('Panel gaps',(.025,.029,.032),.6);amber=mat('Amber side markers',(.7,.22,.005),.27,.1)
for m,col,strength in [(brake,(.5,.006,.002),.35),(head,(.75,.82,1),.4)]:
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(*col,1);bs.inputs['Emission Strength'].default_value=strength
# Carbon weave is a tiny repeatable texture, not a chrome black substitute.
weave=bpy.data.images.new('Carbon weave',width=64,height=64);pixels=[]
for y in range(64):
 for x in range(64):
  v=.03+(.018 if ((x//4+y//4)%2)==0 else .006)+(x%4)*.002;pixels.extend((v,v*1.1,v*1.16,1))
weave.pixels=pixels;weave.filepath_raw=str(TEX/'carbon-weave.png');weave.file_format='PNG';weave.save();n=carbon.node_tree.nodes.new('ShaderNodeTexImage');n.image=weave;carbon.node_tree.links.new(n.outputs['Color'],carbon.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
objects=[]
def finish(o,name,m,smooth=False):
 o.name=name;o.data.materials.append(m);objects.append(o)
 if smooth:
  for f in o.data.polygons:f.use_smooth=True
 return o

def mesh(name,verts,faces,m,smooth=True):
 data=bpy.data.meshes.new(name);data.from_pydata([B(v) for v in verts],[],faces);data.update();o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);finish(o,name,m,smooth);data.uv_layers.new(name='UVMap')
 # Consistent object space planar UVs, with repeat for trim materials.
 for f in data.polygons:
  axis=max(range(3),key=lambda i:abs(f.normal[i]));axes=[i for i in range(3) if i!=axis]
  for li in f.loop_indices:
   v=data.vertices[data.loops[li].vertex_index].co;data.uv_layers.active.data[li].uv=(v[axes[0]]*3,v[axes[1]]*3)
 return o

def box(name,pos,size,m,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=B(pos));o=finish(bpy.context.object,name,m);o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Rounded manufactured edges','BEVEL');mod.width=bevel;mod.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Weighted panel normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name);return o

def tube(name,points,r,m):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=2;curve.bevel_depth=r;curve.bevel_resolution=2;s=curve.splines.new('POLY');s.points.add(len(points)-1)
 for p,v in zip(s.points,points):p.co=(*B(v),1)
 o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o=bpy.context.object;finish(o,name,m,True);o.select_set(False);return o

def cyl(name,a,b,r,m,n=32):
 a,b=B(a),B(b);v=b-a;bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=v.length,location=(a+b)/2);o=finish(bpy.context.object,name,m,True);o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return o

def sph(name,pos,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=B(pos));o=finish(bpy.context.object,name,m,True);o.scale=(scale[0],scale[2],scale[1]);return o
# Body shape: width and bonnet/trunk height at each longitudinal station.
profile=[(-2.2,.69,.60),(-2.13,.84,.73),(-1.95,.9,.81),(-1.65,.94,.85),(-1.3,.95,.86),(-.9,.90,.87),(-.4,.89,.87),(.2,.89,.85),(.65,.90,.85),(1.1,.94,.83),(1.45,.95,.82),(1.8,.91,.79),(2.03,.84,.73),(2.2,.71,.64),(2.23,.65,.58)]
def shape(z):
 for i in range(len(profile)-1):
  a,b=profile[i:i+2]
  if a[0]<=z<=b[0]:
   t=(z-a[0])/(b[0]-a[0]);t=t*t*(3-2*t);return a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t
 return profile[0][1:]
def surface(x,z):
 w,top=shape(z);bottom=lower(z);return bottom+(top-bottom)*max(0,1-(x/w)**2)**.12
def lower(z):
 h=.27
 for center in [-1.35,1.35]:
  d=abs(z-center)
  if d<.395:h=max(h,.35+math.sqrt(.395**2-d*d))
 return h
verts=[];faces=[];N=180;K=48
for i in range(N+1):
 z=-2.2+(4.43*i/N);w,top=shape(z);bottom=lower(z)
 for j in range(K+1):
  a=-math.pi/2+j/K*math.pi;x=w*math.sin(a);h=bottom+(top-bottom)*max(0,math.cos(a))**.24;verts.append((x,h,z))
for i in range(N):
 for j in range(K):a=i*(K+1)+j;faces.append((a,a+K+1,a+K+2,a+1))
body=mesh('Sculpted body with open arches',verts,faces,paint)
# The concealed cabin floor has dark trim, rather than glossy exterior paint.
body.data.materials.append(dark)
for f in body.data.polygons:
 center=sum((body.data.vertices[i].co for i in f.vertices),Vector())/len(f.vertices)
 if -1.10 < -center.y < .86 and abs(center.x)<.67:f.material_index=1
# Ends are closed bumper panels; grille and lamp components sit just ahead of them.
for z in [-2.2,2.23]:
 w,h=shape(z);points=[(-w,.27,z),(w,.27,z),(w,.52,z),(.65,h,z),(-.65,h,z),(-w,.52,z)];mesh('Bumper face',points,[(0,1,2,3,4,5)],paint,False)
# Fender opening trim follows the actual cut, giving a readable wheel arch lip.
for side in [-1,1]:
 for center in [-1.35,1.35]:
  points=[]
  for i in range(49):
   a=i/48*math.pi;z=center+.395*math.cos(a);w,_=shape(z);points.append((side*(w+.003),.35+.395*math.sin(a),z))
  tube('Rolled fender lip',points,.009,paint)
 # Side sill, shutlines, door handle, mirror and vent details.
 box('Aero side skirt',(side*.91,.235,0),(.12,.09,1.88),carbon,.025)
 box('Painted sill',(side*.895,.285,0),(.09,.085,1.78),paint,.023)
 for z in [-.83,.70]:
  points=[]
  for i in range(20):
   h=.34+i/19*.48;w,top=shape(z);fraction=max(0,min(.99,(h-lower(z))/(top-lower(z))));x=w*math.sqrt(1-fraction**(2/.24));points.append((side*(x+.004),h,z))
  tube('Door shutline',points,.0038,seam)
 box('Recessed door handle',(side*.878,.765,-.62),(.013,.025,.14),chrome,.008)
 box('Side fender vent',(side*.944,.68,1.05),(.009,.06,.22),dark,.015)
 for i in range(3):box('Side vent louvers',(side*.952,.667+i*.016,1.05),(.012,.007,.20),carbon,.003)
 sph('Mirror housing',(side*.98,1.005,.63),(.12,.055,.08),paint);box('Mirror stalk',(side*.87,.96,.62),(.15,.025,.024),carbon,.01);box('Mirror reflective face',(side*.984,1.005,.577),(.16,.065,.008),chrome,.015)
# Cabin: gently bowed windshield and rear glazing; separate roof and pillars.
def curved_panel(name,bottomz,topz,bottomh,toph,bottomw,topw,m):
 vv=[];ff=[];nx=24;ny=16
 for row in range(ny+1):
  t=row/ny;w=bottomw+(topw-bottomw)*t
  for col in range(nx+1):
   u=col/nx*2-1;z=bottomz+(topz-bottomz)*t+.038*(1-u*u)*math.sin(math.pi*t);h=bottomh+(toph-bottomh)*t+.015*(1-u*u);vv.append((w*u,h,z))
 for row in range(ny):
  for col in range(nx):a=row*(nx+1)+col;ff.append((a,a+1,a+nx+2,a+nx+1))
 if bottomz<topz:ff=[tuple(reversed(f)) for f in ff]
 return mesh(name,vv,ff,m)
curved_panel('Windshield',.91,.26,.87,1.305,.735,.61,glass);curved_panel('Rear window',-1.21,-.79,.87,1.28,.735,.61,glass)
vv=[];ff=[]
for row in range(25):
 z=-.8+row/24*1.08
 for col in range(25):
  u=col/24*2-1;vv.append((u*.625,1.295+.065*(1-u*u)-.02*((z+.2)/.6)**2,z))
for row in range(24):
 for col in range(24):a=row*25+col;ff.append((a,a+1,a+26,a+25))
mesh('Curved roof',vv,[tuple(reversed(f)) for f in ff],paint)
for side in [-1,1]:
 corners=[(side*.735,.88,.89),(side*.608,1.3,.25),(side*.614,1.285,-.78),(side*.735,.88,-1.18)]
 mesh('Side glass',corners,[(3,2,1,0) if side>0 else (0,1,2,3)],glass)
 for i in range(4):tube('Window perimeter', [corners[i],corners[(i+1)%4]],.016,carbon)
 tube('A pillar',[(side*.735,.87,.93),(side*.61,1.31,.28)],.019,paint)
 tube('C pillar',[(side*.735,.87,-1.24),(side*.61,1.3,-.80)],.028,paint)
 tube('Window B pillar',[(side*.707,.89,-.53),(side*.616,1.3,-.53)],.02,carbon)
 tube('Window sill',[(side*.735,.875,.89),(side*.735,.875,-1.18)],.015,paint)
# Bonnet shutline, windshield wipers and subtle front vents.
for side in [-1,1]:tube('Bonnet panel gap',[(side*(.68+.02*math.sin(t*math.pi)),surface(.68+.02*math.sin(t*math.pi),1.96-t*1.02)+.003,1.96-t*1.02) for t in [i/40 for i in range(41)]],.0025,seam)
tube('Bonnet trailing seam',[(x,surface(x,.92)+.003,.92) for x in [-.70+i/40*1.4 for i in range(41)]],.0025,seam)
for side in [-1,1]:tube('Wiper',[(side*.15,.912,.86),(side*.60,.92,.78)],.007,carbon)
for side in [-1,1]:
 for i in range(4):box('Hood extractor',(side*.42,.823,1.31+i*.038),(.24,.008,.018),carbon,.005)
# Full front and rear lamps, with bezels, individual projector elements and lens surfaces.
for side in [-1,1]:
 sph('Headlamp housing',(side*.60,.67,2.075),(.23,.105,.07),dark)
 for dx,r in [(-.08,.06),(.06,.047)]:
  x=side*(.60+dx);cyl('Headlamp chrome bezel',(x,.67,2.09),(x,.67,2.16),r,chrome);cyl('Headlamp projector',(x,.67,2.158),(x,.67,2.165),r*.72,head)
 sph('Headlamp lens',(side*.60,.68,2.16),(.22,.083,.018),lens)
 tube('Front LED strip',[(side*.40,.608,2.149),(side*.67,.599,2.12),(side*.79,.622,2.09)],.009,head)
 box('Amber marker',(side*.805,.65,2.042),(.025,.037,.06),amber,.007)
 sph('Rear lamp housing',(side*.58,.70,-2.115),(.24,.075,.035),dark)
 for h in [.682,.72]:tube('Rear red lamp signature',[(side*.38,h,-2.153),(side*.57,h+.005,-2.172),(side*.78,h,-2.129)],.014,brake)
 box('Rear reverse lamp',(side*.63,.65,-2.151),(.11,.023,.01),head,.005)
 # Grilles and fog lamps, distinct black cutouts with real fins.
 box('Front side intake',(side*.68,.40,2.17),(.30,.16,.035),dark,.04)
 for i in range(3):box('Intake louver',(side*.68,.35+i*.045,2.20),(.25,.009,.025),carbon,.003)
 cyl('Fog lamp bezel',(side*.68,.41,2.195),(side*.68,.41,2.215),.039,chrome);cyl('Fog lamp',(side*.68,.41,2.214),(side*.68,.41,2.218),.029,head)
box('Front center grille',(0,.45,2.245),(.92,.23,.035),dark,.045)
for i in range(24):box('Grille vertical mesh',(-.44+i*.038,.45,2.27),(.007,.17,.006),carbon,.001)
for h in [.39,.44,.49,.54]:box('Grille horizontal mesh',(0,h,2.273),(.88,.007,.007),carbon,.002)
box('Front splitter',(0,.255,2.18),(1.68,.048,.22),carbon,.017)
box('Rear diffuser',(0,.27,-2.18),(1.58,.11,.15),carbon,.02)
for x in [-.62,-.31,0,.31,.62]:box('Diffuser fins',(x,.22,-2.17),(.018,.1,.27),carbon,.006)
box('Rear plate recess',(0,.54,-2.211),(.34,.10,.012),dark,.01)
box('Rear plate',(0,.54,-2.222),(.26,.066,.006),chrome,.003)
for side in [-1,1]:
 cyl('Exhaust metal tip',(side*.69,.32,-2.07),(side*.69,.32,-2.255),.048,chrome);cyl('Exhaust opening',(side*.69,.32,-2.256),(side*.69,.32,-2.26),.037,dark)
 # Pedestals and wing, readable from the chase camera.
 box('Rear wing pedestal',(side*.54,.985,-1.88),(.04,.47,.11),carbon,.009)
 box('Rear wing endplate',(side*.94,1.23,-1.9),(.026,.14,.32),carbon,.014)
vv=[];ff=[]
for x in [-.95,0,.95]:
 for h,z in [(1.22,-1.73),(1.24,-1.89),(1.2,-2.03),(1.176,-2.03),(1.206,-1.89),(1.194,-1.73)]:vv.append((x,h,z))
for i in range(2):
 for j in range(6):a=i*6+j;b=i*6+(j+1)%6;ff.append((a,b,b+6,a+6))
ff.extend([(0,5,4,3,2,1),(12,13,14,15,16,17)]);mesh('Rear carbon airfoil',vv,ff,carbon)
# Cabin interior is visible through glazing, with separate seats, dash and steering rim.
box('Cabin floor',(0,.39,-.12),(1.42,.08,1.73),dark,.04);box('Dashboard',(0,.86,.63),(1.35,.17,.25),dark,.06)
for side in [-1,1]:
 sph('Seat cushion',(side*.35,.86,-.25),(.22,.085,.30),dark);sph('Seat back',(side*.35,1.02,-.57),(.23,.20,.09),dark);sph('Headrest',(side*.35,1.235,-.58),(.11,.08,.07),dark)
box('Console',(0,.86,-.13),(.18,.14,.60),carbon,.02)
pts=[(-.36+.12*math.cos(a),.87+.12*math.sin(a),.42) for a in [i/48*math.tau for i in range(49)]];tube('Steering wheel',pts,.017,carbon)
# Detailed wheels are independent groups with neutral rotation, unlike steered source wheels.
for axle,z in [('Front',1.35),('Rear',-1.35)]:
 for side,label in [(1,'L'),(-1,'R')]:
  before=len(objects);x=side*.84;y=.35
  bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=16,location=B((x,y,z)),major_radius=.285,minor_radius=.065);o=finish(bpy.context.object,'Tire tread',rubber,True);o.rotation_euler.y=math.pi/2;o.scale.z=1.55
  # Sidewalls, polished rim lip and brake disc behind open spokes.
  for face in [-1,1]:
   xf=x+face*.085;pts=[(xf,y+.285*math.cos(a),z+.285*math.sin(a)) for a in [i/64*math.tau for i in range(65)]];tube('Tire sidewall bead',pts,.021,rubber)
  outer=x+side*.105;cyl('Ventilated brake rotor',(x,y,z),(outer-side*.024,y,z),.215,disc)
  for i in range(24):
   a=i/24*math.tau;r=.185;box('Rotor drill recess',(outer-side*.029,y+r*math.cos(a),z+r*math.sin(a)),(.003,.01,.01),dark,.002)
  box('Performance brake caliper',(outer-side*.048,y+.12,z-.14),(.06,.13,.09),caliper,.018)
  pts=[(outer,y+.252*math.cos(a),z+.252*math.sin(a)) for a in [i/64*math.tau for i in range(65)]];tube('Polished wheel lip',pts,.019,chrome)
  cyl('Wheel hub',(outer-side*.02,y,z),(outer+side*.01,y,z),.062,chrome)
  for i in range(5):
   a=i/5*math.tau+.2;u=Vector((math.cos(a),math.sin(a)));v=Vector((-math.sin(a),math.cos(a)));poly=[]
   for depth in [outer-side*.024,outer+side*.011]:
    for r,w in [(.045,.025),(.23,.022),(.23,-.022),(.045,-.025)]:poly.append((depth,y+u.x*r+v.x*w,z+u.y*r+v.y*w))
   mesh('Forged five spoke',poly,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],chrome,False)
   cyl('Hub lug bolt',(outer,y+.042*math.cos(a),z+.042*math.sin(a)),(outer+side*.015,y+.042*math.cos(a),z+.042*math.sin(a)),.008,carbon,12)
  # Geometric tread grooves give small scale detail without a dense tire mesh.
  for i in range(44):
   a=i/44*math.tau;pts=[]
   for j in range(5):
    t=j/4;aa=a+(t-.5)*.08;pts.append((x-.071+t*.142,y+.349*math.cos(aa),z+.349*math.sin(aa)))
   tube('Tread groove',pts,.0017,dark)
  bpy.ops.object.empty_add(type='PLAIN_AXES',location=B((x,y,z)));group=bpy.context.object;group.name='Wheel'+axle+label
  for o in objects[before:]:
   if o.name.startswith('Performance brake caliper'):continue
   m=o.matrix_world.copy();o.parent=group;o.matrix_world=m
# Original vinyl atlas, generated by Pillow before this Blender script.
image_path=TEX/'coupe-vinyl.png'
if image_path.exists():
 vinyl=mat('Vinyl graphic',(1,1,1),.27,.2,.6);nt=vinyl.node_tree;tex=nt.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(image_path));bs=nt.nodes.get('Principled BSDF');nt.links.new(tex.outputs['Color'],bs.inputs['Base Color']);nt.links.new(tex.outputs['Alpha'],bs.inputs['Alpha']);vinyl.surface_render_method='DITHERED'
 for side in [-1,1]:
  vv=[];ff=[];uv=[];nx=140;ny=12
  for i in range(nx+1):
   z=-1.91+i/nx*3.77;w,top=shape(z);lo=max(.32,lower(z)+.006);hi=min(.795,top-.018)
   for j in range(ny+1):
    h=lo+(hi-lo)*j/ny;fraction=max(0,min(1,(h-lower(z))/(top-lower(z))));x=w*math.sqrt(max(0,1-fraction**(2/.24)))+.004;vv.append((side*x,h,z));uv.append(((z+1.91)/3.77,(h-.27)/.58))
  for i in range(nx):
   for j in range(ny):a=i*(ny+1)+j;ff.append((a,a+ny+1,a+ny+2,a+1))
  o=mesh('Original side vinyl',vv,[tuple(reversed(f)) for f in ff] if side>0 else ff,vinyl)
  for f in o.data.polygons:
   for li in f.loop_indices:o.data.uv_layers.active.data[li].uv=uv[o.data.loops[li].vertex_index]
# Apply transforms and group by material within body and each wheel to limit draw calls.
bpy.ops.object.select_all(action='DESELECT');groups={}
for o in objects:
 key=(o.parent.name if o.parent else 'Body',o.data.materials[0].name);groups.setdefault(key,[]).append(o)
for (parent,material),parts in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=parent+' / '+material
 # Bake transforms so the runtime normal merge is reproducible.
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(OUT/'tuner-coupe.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
for img in bpy.data.images:
 if img.source=='FILE' or img.name=='Carbon weave':img.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'tuner-coupe.blend'),compress=True)
meta={'name':'Harbor Coupe','authoring':'Blender '+bpy.app.version_string,'frontAxis':'+Z','wheelRadius':.35,'wheels':{'WheelFrontL':[.84,.35,1.35],'WheelFrontR':[-.84,.35,1.35],'WheelRearL':[.84,.35,-1.35],'WheelRearR':[-.84,.35,-1.35]},'parts':len(groups),'triangles':sum(sum(len(f.vertices)-2 for f in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')};(OUT/'tuner-coupe.json').write_text(json.dumps(meta,indent=2));print('CAR_EXPORTED',meta,flush=True)
if '--render' in sys.argv:
 scene=bpy.context.scene;scene.world.use_nodes=True;nt=scene.world.node_tree;nt.nodes.clear();env=nt.nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(OUT/'daylight.hdr'));bg=nt.nodes.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.7;nt.links.new(env.outputs['Color'],bg.inputs['Color']);end=nt.nodes.new('ShaderNodeOutputWorld');nt.links.new(bg.outputs[0],end.inputs[0])
 box('Studio ground',(0,-.08,0),(200,.12,200),mat('Studio floor',(.25,.26,.25),.85),0)
 bpy.ops.object.light_add(type='AREA',location=(4,-2,6));light=bpy.context.object;light.data.energy=1600;light.data.shape='DISK';light.data.size=5;light.rotation_euler=(Vector((0,0,.7))-light.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.lens=48;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=6;scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
 for name,pos in [('front', (5,-6,3.2)),('rear',(4.7,6,2.8))]:
  cam.location=pos;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(SRC/('coupe-'+name+'.png'));bpy.ops.render.render(write_still=True)
