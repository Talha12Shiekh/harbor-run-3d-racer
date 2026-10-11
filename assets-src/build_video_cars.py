"""Original video-reference vehicle surfaces, wheels and trim, authored in Blender.
No downloaded model is read. Rebuild: blender -b --factory-startup --python assets-src/build_video_cars.py -- --render
"""
import sys,math,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from asset_tools import *
from mathutils import Matrix
OUT=ROOT/'dist/assets/vehicles';SRC=ROOT/'assets-src/vehicles';OUT.mkdir(parents=True,exist_ok=True);SRC.mkdir(parents=True,exist_ok=True)
CONFIGS={
 'hypercar':{'name':'Mid-engine hypercar','color':(.035,.055,.55),'roof':1.17,'wheelbase':2.70,'rim':(.24,.21,.12),'spokes':7,'profiles':[(-2.27,.52,.32,.31),(-2.05,.88,.44,.39),(-1.65,1.00,.71,.49),(-1.18,.99,.72,.56),(-.65,.92,.65,.62),(.10,.93,.66,.65),(.65,1.00,.76,.70),(1.35,1.01,.76,.67),(1.95,.98,.68,.65),(2.27,.80,.54,.53)]},
 'spyder':{'name':'Open road spyder','color':(.58,.018,.065),'roof':1.19,'wheelbase':2.77,'rim':(.36,.38,.39),'spokes':10,'profiles':[(-2.29,.58,.32,.30),(-2.03,.89,.44,.38),(-1.50,.99,.72,.45),(-.95,.95,.66,.56),(-.50,.90,.62,.63),(.10,.91,.64,.60),(.65,.98,.76,.69),(1.35,1.00,.79,.68),(1.95,.96,.65,.61),(2.29,.77,.53,.51)]},
 'interceptor':{'name':'Road interceptor','color':(.012,.019,.023),'roof':1.24,'wheelbase':2.71,'rim':(.45,.47,.49),'spokes':8,'profiles':[(-2.25,.66,.43,.43),(-2.02,.88,.58,.55),(-1.55,1.00,.72,.65),(-.95,.98,.71,.67),(-.50,.96,.68,.64),(.15,.98,.71,.66),(.65,1.02,.80,.73),(1.40,1.03,.80,.69),(1.95,.99,.68,.64),(2.25,.87,.57,.55)]}}
def interpolate(rows,y,col):
 if y<=rows[0][0]:return rows[0][col]
 if y>=rows[-1][0]:return rows[-1][col]
 for i in range(len(rows)-1):
  if rows[i][0]<=y<=rows[i+1][0]:
   t=(y-rows[i][0])/(rows[i+1][0]-rows[i][0]);a=rows[max(0,i-1)][col];b=rows[i][col];c=rows[i+1][col];d=rows[min(len(rows)-1,i+2)][col]
   return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)
def build(kind,cfg):
 reset();paint=material('Paint Pearl',cfg['color'],.23,.48,.9);carbon=material('Carbon aero',(.009,.014,.018),.34,.25);rubber=material('Tire rubber',(.015,.019,.023),.86);metal=material('Forged alloy',cfg['rim'],.22,.88);disc=material('Brake disc',(.23,.24,.25),.5,.75);caliper=material('Fixed caliper',(.62,.09,.007),.36,.2);glass=material('Glass glazing',(.045,.075,.10),.11,.15,.5,.46);head=material('Projector light',(.8,.9,1),.18,.3,.4,emission=.8);brake=material('Brakelight red',(.50,.004,.008),.22,.25,.7,emission=.35);chrome=material('Polished trim',(.45,.5,.55),.15,.96);cabin=material('Cabin leather',(.025,.03,.035),.82);white=material('Police white panel',(.8,.83,.86),.27,.24,.6)
 rows=[list(row) for row in cfg['profiles']];lo,hi=rows[0][0],rows[-1][0]
 for row in rows:
  if -1.7<row[0]<-1.05:row[2]+=.08
 rows[-1][1]=.94
 def deck(x,y):
  w=interpolate(rows,y,1);edge=interpolate(rows,y,2);center=interpolate(rows,y,3);return center+(edge-center)*min(1,abs(x/w))**1.65
 verts=[];faces=[];rings=140;count=46
 for i in range(rings+1):
  y=lo+(hi-lo)*i/rings;w=interpolate(rows,y,1)
  cross=[(w*u,deck(w*u,y)) for u in [(-1+2*j/36) for j in range(37)]]
  flank=.18+.62*(interpolate(rows,y,2)-.18)
  cross.extend([(w*.995,flank),(w*.94,.23),(w*.76,.17),(w*.35,.17),(0,.17),(-w*.35,.17),(-w*.76,.17),(-w*.94,.23),(-w*.995,flank)])
  for x,z in cross:verts.append((x,y,z))
 for i in range(rings):
  for j in range(count):k=(j+1)%count;faces.append((i*count+j,(i+1)*count+j,(i+1)*count+k,i*count+k))
 faces.extend([tuple(range(count-1,-1,-1)),tuple(rings*count+j for j in range(count))]);body=mesh('Continuous sculpted body',verts,[tuple(reversed(f)) for f in faces],paint)
 # Open wheel arches cut through the actual sculpted shell. Wheel geometry remains round.
 centers=[(side*.85,y,.345) for y in [-cfg['wheelbase']/2,cfg['wheelbase']/2] for side in [-1,1]]
 for x,y,z in centers:
  side=1 if x>0 else -1;cutter=cylinder('Arch tooling',(x-side*.13,y,z),(x+side*.45,y,z),.367,carbon,64);bpy.context.view_layer.objects.active=body;mod=body.modifiers.new('Open wheel arch','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
 cutter=cube('Cockpit tooling',(0,.02,.88),(1.27,1.08,1.04),carbon,.11);bpy.context.view_layer.objects.active=body;mod=body.modifiers.new('Interior cavity','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
 cube('Cockpit floor',(0,.02,.39),(1.23,1.04,.055),cabin,.025)
 # Deliberate sharp undersill, intake inserts and bumper splitters contrast with painted surfaces.
 for side in [-1,1]:
  curve('Curved lower sill',[(side*interpolate(rows,y,1)*.955,y,.235) for y in [-.90+i*.045 for i in range(39)]],carbon,.027)
  curve('Door panel seam',[(side*(interpolate(rows,y,1)+.001),y,z) for y,z in [(-.84,.65),(-.87,.48),(-.79,.32),(.40,.31),(.62,.53),(.52,.72)]],carbon,.003)
  cube('Flush door handle',(side*.948,.15,.65),(.018,.18,.028),chrome,.008)
  # Recessed side cooling mouth, a thin curved surface instead of a painted rectangle.
  vv=[(side*(interpolate(rows,y,1)+.007),y,z) for y,z in [(.48,.66),(.97,.70),(1.10,.43),(.54,.35)]];mesh('Deep side cooling intake',vv,[(0,1,2,3)],carbon,False)
  for a in range(5):curve('Intake internal vane',[(side*(interpolate(rows,y,1)+.012),y,.43+a*.042) for y in [.64,.98]],carbon,.011)
 curve('Front carbon splitter',[(x,lo-.014,.19) for x in [-.80,-.6,-.3,0,.3,.6,.80]],carbon,.035)
 # Curved canopy with glazing and distinct painted roof/pillars.
 cap=[];capfaces=[];ny=48;nx=32
 front,rear=(-1.08,1.10) if kind=='interceptor' else (-.92,.93)
 capwidth=.77 if kind=='interceptor' else .69
 def canopy(x,y):
  q=(y-front)/(rear-front);rise=max(0,math.sin(q*math.pi))**.8;w=capwidth*(1-.20*q);u=x/w;return .65+(cfg['roof']-.65)*rise*max(0,1-u*u)**.35
 if kind!='spyder':
  for i in range(ny+1):
   y=front+(rear-front)*i/ny;w=capwidth*(1-.2*i/ny)
   for j in range(nx+1):x=w*(-1+2*j/nx);cap.append((x,y,canopy(x,y)))
  for i in range(ny):
   for j in range(nx):a=i*(nx+1)+j;capfaces.append((a,a+1,a+nx+2,a+nx+1))
  o=mesh('Curved canopy glazing',cap,capfaces,glass);o.data.materials.append(paint)
  for p in o.data.polygons:
   c=p.center
   if (-.28<c.y<.45 and abs(c.x)<.46) or -.34<c.y<-.28 or .45<c.y<.51:p.material_index=1
  for side in [-1,1]:curve('Canopy edge frame',[(side*capwidth*(1-.2*i/48),front+(rear-front)*i/48,.658) for i in range(49)],carbon,.018)
 else:
  # Open cockpit, curved windscreen, roll hoops and twin rear engine fairings.
  for i in range(17):
   y=-.91+i*.035
   for j in range(33):x=(-1+2*j/32)*.67;cap.append((x,y,.65+(cfg['roof']-.65)*(i/16)*max(.01,1-(x/.72)**2)**.23))
  for i in range(16):
   for j in range(32):a=i*33+j;capfaces.append((a,a+1,a+34,a+33))
  mesh('Spyder windscreen',cap,capfaces,glass)
  for side in [-1,1]:
   curve('Spyder windscreen pillar',[(side*.65,-.92,.68),(side*.63,-.36,1.12)],carbon,.026)
   curve('Roll hoop',[(side*.35+.19*math.cos(a),.47,.86+.20*math.sin(a)) for a in [j*math.pi/32 for j in range(33)]],chrome,.028)
   cube('Engine fairing',(side*.36,.95,.78),(.38,.72,.20),paint,.14)
 for side in [-1,1]:
  cube('Sculpted seat bolster',(side*.34,.15,.65),(.38,.34,.20),cabin,.07);o=cube('Seat back',(side*.34,.40,.81),(.39,.14,.45),cabin,.06);o.rotation_euler.x=.12
  cube('Headrest',(side*.34,.43,1.00),(.24,.10,.12),cabin,.05)
 cube('Instrument binnacle',(0,-.58,.67),(1.12,.20,.17),cabin,.04);torus('Steering wheel',(-.34,-.50,.84),.13,.016,cabin,axis='Y',major=48)
 for side in [-1,1]:
  cylinder('Mirror stem',(side*.68,-.52,.78),(side*1.03,-.56,.79),.016,carbon);cube('Streamlined mirror',(side*1.03,-.59,.82),(.23,.18,.08),paint,.039)
 # Defined front apertures and a continuous dark rear fascia.
 mesh('Rear cooling fascia',[(-.89,hi+.010,.37),(.89,hi+.010,.37),(.86,hi+.010,.64),(-.86,hi+.010,.64)],[(0,1,2,3)],carbon,False)
 if kind=='interceptor':
  points=[(.19*math.cos(a),lo-.016,.46+.20*math.sin(a)) for a in [j*math.tau/64 for j in range(65)]]
  mesh('Central horseshoe intake',points[:-1],[tuple(range(64))],carbon,False);curve('Horseshoe chrome surround',points,chrome,.018)
  for side in [-1,1]:
   mesh('Lower front cooling mouth',[(side*x,lo-.019,z) for x,z in [(.32,.34),(.79,.35),(.79,.51),(.32,.51)]],[(0,1,2,3)],carbon,False)
 else:
  mesh('Front recessed cooling mouth',[(-.59,lo-.021,.24),(.59,lo-.021,.24),(.55,lo-.021,.34),(-.55,lo-.021,.34)],[(0,1,2,3)],carbon,False)
 # Lamp shapes are mapped onto the deck instead of floating above guessed coordinates.
 for side in [-1,1]:
  points=[(side*x,y,deck(side*x,y)+.012) for x,y in [(.62,-1.97),(.82,-1.94),(.91,-1.61),(.79,-1.24),(.64,-1.52)]]
  mesh('Headlight housing',points,[tuple(range(5))],carbon,False);curve('LED perimeter',points,head,.008,True)
  for x,y in [(.76,-1.73),(.79,-1.51)]:
   z=deck(side*x,y)+.024;cylinder('Projector lens',(side*x,y,z-.006),(side*x,y,z+.005),.055,head,32)
  yy=hi+.01;xx=side*.64
  if kind=='interceptor':
   for offset in [-.115,.115]:
    torus('Rear circular lamp',(xx+offset,yy,.56),.078,.017,brake,'Y',48)
  else:
   oval=[(xx+.22*math.cos(t),yy,.565+.069*math.sin(t)) for t in [j*math.tau/64 for j in range(64)]];curve('Rear LED ring',oval,brake,.018,True)
  for z in [.39,.46]:curve('Rear ventilation slat',[(xx-.24,hi+.008,z),(xx+.24,hi+.008,z)],carbon,.026)
  torus('Exhaust polished rim',(side*.23,hi+.028,.30),.061,.011,chrome,'Y',48);cylinder('Exhaust black bore',(side*.23,hi+.030,.30),(side*.23,hi+.043,.30),.051,carbon,32)
 for side in [-1,0,1]:cube('Rear diffuser vane',(side*.45,hi-.12,.20),(.022,.34,.12),carbon,.008)
 cube('Rear registration recess',(0,hi+.009,.49),(.34,.018,.10),carbon,.01);text('Registration text','HR • 01',(0,hi+.023,.49),(math.pi/2,0,math.pi),white,.058)
 if kind=='interceptor':
  # Original police lettering and visible lightbar; no imported livery or logos.
  for side in [-1,1]:
   yvalues=[-.80+i*.035 for i in range(43)];vv=[];ff=[]
   for y in yvalues:
    for z in [.34,.62]:vv.append((side*(interpolate(rows,y,1)+.014),y,z))
   for i in range(len(yvalues)-1):ff.append((i*2,i*2+1,i*2+3,i*2+2))
   mesh('Police door stripe',vv,ff,white,False)
   text('Original police lettering','POLICE',(side*1.015,-.02,.48),(math.pi/2,0,side*math.pi/2),carbon,.14)
  cube('Lightbar mount',(0,.03,1.255),(.80,.16,.025),carbon,.01)
  for side,color in [(-1,(.008,.05,.75)),(1,(.72,.008,.012))]:cube('Police lightbar',(side*.22,.03,1.285),(.37,.15,.075),material('Police blue' if side<0 else 'Police red',color,.19,.12,.4,emission=2),.027)
 if kind!='spyder':
  for side in [-1,1]:cube('Wing upright',(side*.55,1.83,.86),(.038,.22,.31),carbon,.017)
  vv=[];ff=[]
  for j in range(33):
   x=-.95+1.9*j/32
   for y,z in [(1.66,1.04),(1.82,1.07),(2.00,1.04),(1.98,1.00),(1.68,1.01)]:vv.append((x,y,z+.04*(x/.95)**2))
  for j in range(32):
   for k in range(5):ff.append((j*5+k,(j+1)*5+k,(j+1)*5+(k+1)%5,j*5+(k+1)%5))
  mesh('Curved rear aerofoil',vv,ff,carbon)
 # Wheels have round sidewalls, tire ribs, barrels, sculpted spoke geometry and fixed brakes.
 wheelmeta={}
 for x,y,z in centers:
  front=y<0;label='Wheel'+('Front' if front else 'Rear')+('L' if x>0 else 'R');bpy.ops.object.empty_add(type='PLAIN_AXES',location=(x,y,z));group=bpy.context.object;group.name=label;wheelmeta[label]=[x,z,-y];side=1 if x>0 else -1
  start=set(bpy.context.scene.objects)
  torus('Round tire',(x,y,z),.291,.054,rubber)
  for offset in [-.040,0,.040]:torus('Tire tread rib',(x+offset,y,z),.338,.007,rubber)
  for offset in [-.080,.080]:torus('Tire sidewall',(x+offset,y,z),.292,.027,rubber)
  torus('Polished rim lip',(x+side*.107,y,z),.247,.012,metal);cylinder('Wheel barrel',(x-.10,y,z),(x+.10,y,z),.249,carbon)
  cylinder('Wheel hub',(x+side*.104,y,z),(x+side*.132,y,z),.044,metal)
  for i in range(cfg['spokes']):
   a=i*math.tau/cfg['spokes'];u=Vector((0,math.cos(a),math.sin(a)));v=Vector((0,-math.sin(a),math.cos(a)));vv=[]
   for depth in [.100,.126]:
    for rr,ww in [(.037,-.020),(.18,-.022),(.245,-.013),(.244,.015),(.16,.022),(.039,.023)]:vv.append(Vector((x+side*depth,y,z))+u*rr+v*ww)
   ff=[tuple(range(5,-1,-1)),tuple(range(6,12))]+[(j,(j+1)%6,(j+1)%6+6,j+6) for j in range(6)];o=mesh('Forged wheel spoke',vv,ff,metal);bevel(o,.004,2)
  for i in range(5):
   a=i*math.tau/5;cylinder('Wheel lug',(x+side*.126,y+.035*math.cos(a),z+.035*math.sin(a)),(x+side*.139,y+.035*math.cos(a),z+.035*math.sin(a)),.007,chrome,16)
  bpy.context.view_layer.update()
  for o in set(bpy.context.scene.objects)-start:
   world=o.matrix_world.copy();o.parent=group;o.matrix_world=world
  cylinder('Fixed brake rotor',(x-.018,y,z),(x+.018,y,z),.215,disc);cube('Fixed caliper',(x+side*.07,y+.13,z+.07),(.05,.09,.15),caliper,.02)
 # Consolidate objects without changing surface assignments or wheel pivots.
 bpy.ops.object.select_all(action='DESELECT');parts={}
 for o in bpy.context.scene.objects:
  if o.type=='MESH':parts.setdefault(o.parent.name if o.parent else 'Body',[]).append(o)
 for name,items in parts.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in items:o.select_set(True)
  bpy.context.view_layer.objects.active=items[0];bpy.ops.object.join();bpy.context.object.name=name+' surfaces'
 meta={'id':kind,'name':cfg['name'],'originalGeometry':True,'authoring':'Blender '+bpy.app.version_string,'frontAxis':'+Z','wheelRadius':.345,'wheels':wheelmeta,**measurements()}
 export(OUT/(kind+'.glb'));bpy.ops.wm.save_as_mainfile(filepath=str(SRC/(kind+'.blend')),compress=True);(OUT/(kind+'.json')).write_text(json.dumps(meta,indent=2));print('ORIGINAL_CAR_EXPORTED',meta,flush=True)
 if '--render' in sys.argv:
  folder=SRC/kind;folder.mkdir(exist_ok=True);render_views(folder)
 return meta
if __name__=='__main__':
 chosen=next((v for v in sys.argv if v in CONFIGS),None);catalog=[]
 for kind,cfg in CONFIGS.items():
  if not chosen or chosen==kind:catalog.append(build(kind,cfg))
 if not chosen:(OUT/'manifest.json').write_text(json.dumps({'originalGeometry':True,'vehicles':catalog},indent=2))
