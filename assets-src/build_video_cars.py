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
 'hypercar':{'name':'Mid-engine hypercar','color':(.035,.055,.55),'roof':1.17,'wheelbase':2.70,'rim':(.24,.21,.12),'spokes':7,'profiles':[(-2.27,.78,.47,.43),(-2.05,.93,.55,.46),(-1.65,1.00,.71,.49),(-1.18,.99,.72,.56),(-.65,.92,.65,.62),(.10,.93,.66,.65),(.65,1.00,.76,.70),(1.35,1.01,.76,.67),(1.95,.98,.68,.65),(2.27,.80,.54,.53)]},
 'spyder':{'name':'Open road spyder','color':(.58,.018,.065),'roof':1.19,'wheelbase':2.77,'rim':(.36,.38,.39),'spokes':10,'profiles':[(-2.29,.76,.43,.40),(-2.03,.92,.55,.43),(-1.50,.99,.72,.45),(-.95,.95,.66,.56),(-.50,.90,.62,.63),(.10,.91,.64,.60),(.65,.98,.76,.69),(1.35,1.00,.79,.68),(1.95,.96,.65,.61),(2.29,.77,.53,.51)]},
 'interceptor':{'name':'Road interceptor','color':(.012,.019,.023),'roof':1.24,'wheelbase':2.71,'rim':(.45,.47,.49),'spokes':8,'profiles':[(-2.25,.84,.52,.51),(-2.02,.94,.61,.56),(-1.55,1.00,.72,.65),(-.95,.98,.71,.67),(-.50,.96,.68,.64),(.15,.98,.71,.66),(.65,1.02,.80,.73),(1.40,1.03,.80,.69),(1.95,.99,.68,.64),(2.25,.87,.57,.55)]}}
CONFIGS.update({
 'rally':{'name':'Rally sedan','color':(.60,.34,.028),'roof':1.48,'wheelbase':2.67,'rim':(.62,.018,.028),'spokes':5,'profiles':[(-2.27,.76,.81,.79),(-2.05,.91,.78,.76),(-1.40,.94,.86,.81),(-.82,.91,.81,.79),(-.30,.89,.77,.76),(.45,.90,.78,.76),(1.30,.94,.86,.83),(1.95,.91,.79,.77),(2.27,.81,.69,.68)]},
 'muscle':{'name':'Muscle coupe','color':(.045,.23,.26),'roof':1.34,'wheelbase':2.82,'rim':(.29,.31,.33),'spokes':5,'profiles':[(-2.27,.85,.72,.70),(-2.05,.95,.80,.78),(-1.45,1.00,.87,.82),(-.76,.96,.85,.81),(-.12,.95,.81,.78),(.65,.98,.84,.79),(1.45,1.02,.90,.84),(2.04,.98,.81,.77),(2.27,.90,.71,.69)]}
})
def interpolate(rows,y,col):
 if y<=rows[0][0]:return rows[0][col]
 if y>=rows[-1][0]:return rows[-1][col]
 for i in range(len(rows)-1):
  if rows[i][0]<=y<=rows[i+1][0]:
   t=(y-rows[i][0])/(rows[i+1][0]-rows[i][0]);a=rows[max(0,i-1)][col];b=rows[i][col];c=rows[i+1][col];d=rows[min(len(rows)-1,i+2)][col]
   return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)
def build(kind,cfg):
 if kind in ['rally','muscle']:return build_tourer(kind,cfg)
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
 integrated_splitter(rows,carbon)
 for side in [-1,1]:
  curve('Hood shut line',[(side*(.45+.09*i/32),-2.16+1.14*i/32,deck(side*(.45+.09*i/32),-2.16+1.14*i/32)+.003) for i in range(33)],carbon,.0025)
  for j in range(6):
   y=1.15+j*.075;curve('Rear engine cover louvre',[(side*x,y,deck(side*x,y)+.007) for x in [.14,.22,.30,.38,.46]],carbon,.010)
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
 front_details(kind,rows,deck,body,carbon,chrome,head,paint)
 # Rear details preserve the accepted chase view.
 for side in [-1,1]:
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
 return finish_car(kind,cfg,make_wheels(centers,cfg,rubber,metal,disc,caliper,chrome,carbon),[[side*.755,deck(side*.755,-1.97)+.057,1.97] for side in [-1,1]])

def make_wheels(centers,cfg,rubber,metal,disc,caliper,chrome,carbon):
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
 return wheelmeta

def finish_car(kind,cfg,wheelmeta,headlights):
 # Consolidate objects without changing surface assignments or wheel pivots.
 bpy.ops.object.select_all(action='DESELECT');parts={}
 for o in bpy.context.scene.objects:
  if o.type=='MESH':parts.setdefault(o.parent.name if o.parent else 'Body',[]).append(o)
 for name,items in parts.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in items:o.select_set(True)
  bpy.context.view_layer.objects.active=items[0];bpy.ops.object.join();bpy.context.object.name=name+' surfaces'
 meta={'headlights':headlights,'lampSurfaceClearance':.016 if kind not in ['rally','muscle'] else None,'id':kind,'name':cfg['name'],'originalGeometry':True,'authoring':'Blender '+bpy.app.version_string,'frontAxis':'+Z','wheelRadius':.345,'wheels':wheelmeta,**measurements()}
 export(OUT/(kind+'.glb'));bpy.ops.wm.save_as_mainfile(filepath=str(SRC/(kind+'.blend')),compress=True);(OUT/(kind+'.json')).write_text(json.dumps(meta,indent=2));print('ORIGINAL_CAR_EXPORTED',meta,flush=True)
 if '--render' in sys.argv:
  folder=SRC/kind;folder.mkdir(exist_ok=True);render_views(folder)
 return meta

def integrated_splitter(rows,carbon):
 # A closed lip follows the curved nose and overlaps the lower bumper, not a detached tube.
 lo=rows[0][0];w=rows[0][1]*1.015;vv=[];ff=[]
 for i in range(49):
  u=-1+2*i/48;x=w*u;y=lo+.12*abs(u)**2
  for dy,z in [(-.022,.205),(.17,.215),(.17,.17),(-.022,.17)]:vv.append((x,y+dy,z))
 for i in range(48):
  for j in range(4):ff.append((i*4+j,(i+1)*4+j,(i+1)*4+(j+1)%4,i*4+(j+1)%4))
 ff.extend([(3,2,1,0),tuple(48*4+j for j in range(4))]);mesh('Integrated sculpted splitter',vv,ff,carbon)

def surface_lamp(side,deck,carbon,chrome,head,kind):
 housing=material('Headlamp housing',(.012,.020,.025),.20,.38,.45)
 cx=.755;cy=-1.78;rx=.136 if kind!='interceptor' else .153;ry=.345
 # Dense radial surface follows the SAME hood equation. The old flat n-gon intersected it.
 vv=[(side*cx,cy,deck(side*cx,cy)+.016)];ff=[];n=64;nr=12
 for k in range(1,nr+1):
  for j in range(n):
   a=j*math.tau/n;r=k/nr;x=cx+rx*r*math.cos(a);y=cy+ry*r*math.sin(a);vv.append((side*x,y,deck(side*x,y)+.016))
 for j in range(n):ff.append((0,1+j,1+(j+1)%n))
 for k in range(nr-1):
  for j in range(n):a=1+k*n+j;b=1+k*n+(j+1)%n;ff.append((a,b,b+n,a+n))
 if side<0:ff=[tuple(reversed(f)) for f in ff]
 mesh('Conforming headlamp recess',vv,ff,housing)
 edge=[]
 for j in range(96):
  a=j*math.tau/96;x=cx+rx*math.cos(a);y=cy+ry*math.sin(a);edge.append((side*x,y,deck(side*x,y)+.019))
 curve('Black lamp gasket',edge,carbon,.008,True)
 # Machined projector cups and a continuous DRL, separate from the dark lens housing.
 for y,r in [(cy-.19,.044),(cy,.051),(cy+.18,.039)]:
  x=side*cx;z=deck(x,y)+.043;v=Vector((0,-.54,.84))
  cylinder('Projector bezel',Vector((x,y,z))-v*.01,Vector((x,y,z))+v*.007,r+.009,chrome,32)
  cylinder('Projector optical lens',Vector((x,y,z))+v*.008,Vector((x,y,z))+v*.013,r,head,32)
  torus('Projector inner optic',(x,y-.009,z+.016),r*.63,.0035,carbon,'Z',32)
 drl=[]
 for j in range(41):
  a=math.pi*.64+math.pi*1.17*j/40;x=cx+rx*.86*math.cos(a);y=cy+ry*.92*math.sin(a);drl.append((side*x,y,deck(side*x,y)+.025))
 curve('Front LED running lamp',drl,head,.006)

def front_details(kind,rows,deck,body,carbon,chrome,head,paint):
 lo=rows[0][0]
 def opening(name,cx,z,width,height):
  cutter=cube('Bumper aperture tooling',(cx,lo+.015,z),(width,.38,height),carbon,.045)
  bpy.context.view_layer.objects.active=body;mod=body.modifiers.new('Recessed bumper opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
  cube(name+' dark depth',(cx,lo+.18,z),(width*.97,.025,height*.95),carbon,.035)
  for i in range(7):
   x=cx-width*.44+width*.88*i/6;cylinder(name+' grille vane',(x,lo+.11,z-height*.41),(x,lo+.11,z+height*.41),.005,chrome,12)
 if kind=='interceptor':
  opening('Center cooling',0,.385,.36,.30)
  # A horseshoe has a flat base and rounded crown, rather than a circular badge.
  points=[(-.19,lo-.008,.245),(-.19,lo-.008,.40)]+[(.19*math.cos(a),lo-.008,.40+.15*math.sin(a)) for a in [math.pi-j*math.pi/32 for j in range(33)]]+[(.19,lo-.008,.245),(-.19,lo-.008,.245)]
  curve('Horseshoe surround',points,chrome,.012)
  for side in [-1,1]:opening('Outer cooling',side*.56,.355,.31,.17)
 else:
  opening('Central cooling',0,.31,1.04,.18)
  for side in [-1,1]:opening('Corner brake cooling',side*.66,.32,.19,.16)
 for side in [-1,1]:surface_lamp(side,deck,carbon,chrome,head,kind)
 # Nose emblem is original and sits on the hood, away from the lamps.
 x=0;y=-2.02;mesh('Original nose crest',[(-.025,y-.03,deck(-.025,y-.03)+.008),(.025,y-.03,deck(.025,y-.03)+.008),(0,y+.032,deck(0,y+.032)+.008)],[(0,1,2)],chrome,False)

def build_tourer(kind,cfg):
 reset();paint=material('Paint Pearl',cfg['color'],.25,.48,.85);carbon=material('Carbon aero',(.009,.015,.019),.35,.2);rubber=material('Tire rubber',(.014,.019,.024),.86);metal=material('Forged alloy',cfg['rim'],.25,.88);disc=material('Brake disc',(.23,.24,.25),.5,.75);caliper=material('Fixed caliper',(.58,.07,.008),.36,.2);glass=material('Glass glazing',(.045,.075,.10),.13,.2,.5,.46);head=material('Projector light',(.78,.89,1),.17,.3,.4,emission=.8);brake=material('Brakelight red',(.5,.003,.006),.22,.25,.7,emission=.35);chrome=material('Polished trim',(.4,.44,.49),.15,.94);cabin=material('Cabin leather',(.024,.028,.033),.82);vinyl=material('Original racing stripe',(.12,.022,.026),.38,.1)
 rows=cfg['profiles'];lo,hi=rows[0][0],rows[-1][0]
 def deck(x,y):
  w=interpolate(rows,y,1);return interpolate(rows,y,3)+(interpolate(rows,y,2)-interpolate(rows,y,3))*min(1,abs(x/w))**2
 vv=[];ff=[];n=46
 for i in range(141):
  y=lo+(hi-lo)*i/140;w=interpolate(rows,y,1);top=[(w*(-1+2*j/36),deck(w*(-1+2*j/36),y)) for j in range(37)];z=interpolate(rows,y,2)
  top.extend([(w*.996,z*.68),(w*.95,.27),(w*.78,.19),(w*.35,.19),(0,.19),(-w*.35,.19),(-w*.78,.19),(-w*.95,.27),(-w*.996,z*.68)])
  vv.extend((x,y,z) for x,z in top)
 for i in range(140):
  for j in range(n):k=(j+1)%n;ff.append((i*n+j,(i+1)*n+j,(i+1)*n+k,i*n+k))
 ff.extend([tuple(range(n-1,-1,-1)),tuple(140*n+j for j in range(n))]);body=mesh('Sculpted '+kind+' body',vv,[tuple(reversed(f)) for f in ff],paint)
 centers=[(side*.83,y,.345) for y in [-cfg['wheelbase']/2,cfg['wheelbase']/2] for side in [-1,1]]
 for x,y,z in centers:
  side=1 if x>0 else -1;cutter=cylinder('Arch tooling',(x-side*.15,y,z),(x+side*.43,y,z),.367,carbon,64);bpy.context.view_layer.objects.active=body;mod=body.modifiers.new('Open wheel arch','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
 cutter=cube('Cabin tooling',(0,.24,1.06),(1.36,1.8,1.08),carbon,.04);bpy.context.view_layer.objects.active=body;mod=body.modifiers.new('Actual cabin cavity','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
 integrated_splitter(rows,carbon)
 # Taller sedan greenhouse and a separate long-hood coupe greenhouse.
 if kind=='rally':basefront=-.78;roofstart=-.22;roofend=.69;baserear=1.33;roofwidth=.66
 else:basefront=-.45;roofstart=.12;roofend=.73;baserear=1.40;roofwidth=.67
 top=[(basefront,.76,.80),(roofstart,roofwidth,cfg['roof']-.028),(roofend,roofwidth,cfg['roof']-.015),(baserear,.77,.83)]
 for i in range(3):
  a,b=top[i],top[i+1];vv=[];ff=[]
  for k in range(17):
   t=k/16;y=a[0]+(b[0]-a[0])*t;w=a[1]+(b[1]-a[1])*t;z=a[2]+(b[2]-a[2])*t
   for j in range(33):u=-1+2*j/32;vv.append((w*u,y,z+.025*(1-u*u)))
  for k in range(16):
   for j in range(32):a0=k*33+j;ff.append((a0,a0+1,a0+34,a0+33))
  o=mesh(['Raked front windscreen','Defined painted roof','Rear windscreen'][i],vv,ff,paint if i==1 else glass)
  if i==1:
   bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Solid painted roof edge','SOLIDIFY');mod.thickness=.027;bpy.ops.object.modifier_apply(modifier=mod.name)
 for side in [-1,1]:
  def side_point(u,v):
   y0=basefront+(baserear-basefront)*u;y1=roofstart+(roofend-roofstart)*u;z0=.80+.03*u;z1=cfg['roof']-.028+.013*u
   return Vector((side*(.85*(1-v)+roofwidth*v),y0*(1-v)+y1*v,z0*(1-v)+z1*v))
  outer=[side_point(u,v) for u,v in [(0,0),(0,1),(1,1),(1,0)]];inner=[side_point(u,v) for u,v in [(.065,.11),(.065,.91),(.93,.91),(.93,.11)]]
  vv=outer+inner;ff=[(j,(j+1)%4,(j+1)%4+4,j+4) for j in range(4)]
  if side>0:ff=[tuple(reversed(f)) for f in ff]
  mesh('Painted A and C pillars',vv,ff,paint,False)
  mesh('Inset side windows',inner,[(3,2,1,0)] if side>0 else [(0,1,2,3)],glass,False)
  curve('Black window seal',inner+[inner[0]],carbon,.006)
  u=.53 if kind=='rally' else .62;pillar=[side_point(uu,v) for uu,v in [(u-.019,.11),(u-.019,.91),(u+.019,.91),(u+.019,.11)]]
  for v in pillar:v.x+=side*.004
  mesh('Flat B pillar',pillar,[(3,2,1,0)] if side>0 else [(0,1,2,3)],carbon,False)
  curve('Window sill trim',[side_point(0,.065),side_point(.5,.065),side_point(1,.065)],chrome,.005)
  for yy in ([-.74,.30,1.31] if kind=='rally' else [-.40,1.25]):
   curve('Door shut line',[(side*(interpolate(rows,y,1)+.003),y,z) for y,z in [(yy,.78),(yy,.61),(yy+.03,.32)]],carbon,.003)
  curve('Lower door seam',[(side*(interpolate(rows,y,1)+.002),y,.32) for y in [basefront+(baserear-basefront)*j/48 for j in range(49)]],carbon,.003)
  for yy in ([.06,.98] if kind=='rally' else [.94]):cube('Flush door handle',(side*(interpolate(rows,yy,1)+.006),yy,.73),(.022,.13,.026),chrome,.009)
  cube('Deep body sill',(side*.92,.26,.29),(.045,1.72,.075),paint,.024)
  cylinder('Mirror stalk',(side*.76,basefront+.10,.84),(side*.98,basefront+.10,.86),.018,carbon);cube('Mirror',(side*1.005,basefront+.04,.89),(.20,.19,.09),paint,.043)
  if kind=='rally':
   for stripe in range(3):
    pts=[]
    for y,z in [(-.50,.55+stripe*.044),(.30,.58+stripe*.046),(1.02,.62+stripe*.045),(1.46,.54+stripe*.04)]:pts.append((side*(interpolate(rows,y,1)+.008),y,z))
    curve('Original rally side stripe',pts,vinyl,.013)
   text('Rally number','07',(side*.917,-.10,.58),(math.pi/2,0,side*math.pi/2),carbon,.18)
 cube('Cabin floor',(0,.27,.56),(1.29,1.62,.08),cabin,.04);cube('Dashboard',(0,basefront+.12,.77),(1.33,.25,.19),cabin,.045)
 for side in [-1,1]:
  cube('Front seat',(side*.35,.15,.70),(.43,.42,.17),cabin,.08);cube('Front seat back',(side*.35,.40,.94),(.43,.13,.48),cabin,.07);cube('Headrest',(side*.35,.40,1.15),(.25,.13,.15),cabin,.055)
 if kind=='rally':cube('Rear bench',(0,.91,.77),(1.14,.36,.20),cabin,.065)
 torus('Steering wheel',(-.35,basefront+.31,.93),.14,.017,cabin,'Y',48)
 # Angular front housings for the sedan, a wide dark grille and circular optics for the coupe.
 grilleWidth=.79 if kind=='rally' else 1.55;grilleHeight=.21 if kind=='rally' else .25
 def recess(cx,z,width,height):
  cutter=cube('Front aperture tooling',(cx,lo+.02,z),(width,.38,height),carbon,.032);bpy.context.view_layer.objects.active=body;mod=body.modifiers.new('Bumper opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
  cube('Recessed grille backing',(cx,lo+.185,z),(width,.025,height),carbon,.025)
  for j in range(10):x=cx-width*.45+width*.9*j/9;cylinder('Grille vertical fin',(x,lo+.11,z-height*.43),(x,lo+.11,z+height*.43),.006,chrome,12)
 recess(0,.56 if kind=='rally' else .565,grilleWidth,grilleHeight);recess(0,.315,1.06,.20)
 for side in [-1,1]:
  if kind=='rally':
   cx=side*.565;yy=lo-.012;pts=[(side*x,yy,z) for x,z in [(.38,.625),(.72,.625),(.71,.805),(.44,.805)]];mesh('Angular headlight housing',pts,[(0,1,2,3)] if side>0 else [(3,2,1,0)],carbon,False)
   for dx in [-.077,.066]:
    x=cx+dx;cylinder('Headlamp cup',(x,yy,.705),(x,yy-.016,.705),.060,chrome,48);cylinder('Front optical lamp',(x,yy-.018,.705),(x,yy-.026,.705),.048,head,48)
   curve('Sedan daytime light',[(side*.40,yy-.027,.636),(side*.69,yy-.027,.636)],head,.008)
   recess(side*.69,.31,.17,.16);cylinder('Front fog optic',(side*.69,lo+.14,.31),(side*.69,lo+.095,.31),.045,head,32)
  else:
   for x in [side*.53,side*.73]:
    cylinder('Classic lamp backing',(x,lo-.012,.585),(x,lo-.025,.585),.094,carbon,48);torus('Classic lamp bezel',(x,lo-.026,.585),.075,.009,chrome,'Y',48);cylinder('Round forward optic',(x,lo-.028,.585),(x,lo-.035,.585),.067,head,48)
  # Chunky rear lamps and defined trunk differ from the exotic lamp rings.
  yy=hi+.012;cube('Rear lamp housing',(side*.60,yy,.655),(.42,.027,.19),carbon,.04)
  for row in [0,1]:cube('Rear LED lens',(side*.60,yy+.017,.62+row*.065),(.35,.012,.038),brake,.015)
  cylinder('Tailpipe bore',(side*.60,hi+.013,.29),(side*.60,hi+.06,.29),.065,carbon,32);torus('Tailpipe trim',(side*.60,hi+.064,.29),.065,.009,chrome,'Y',48)
  curve('Hood shut line',[(side*.51,y,deck(side*.51,y)+.004) for y in [-2.16+(-.80+2.16)*j/40 for j in range(41)]],carbon,.003)
  if kind=='muscle':
   vv=[];ff=[]
   for j in range(41):
    y=-2.12+1.6*j/40
    for x in [side*.12,side*.255]:vv.append((x,y,deck(x,y)+.008))
   for j in range(40):ff.append((j*2,j*2+1,j*2+3,j*2+2))
   mesh('Original twin hood stripe',vv,ff,carbon)
  else:
   for j in range(5):y=-1.18+j*.065;curve('Hood vent slat',[(side*.24,y,deck(side*.24,y)+.008),(side*.45,y,deck(side*.45,y)+.008)],carbon,.013)
 cube('Rear registration recess',(0,hi+.01,.55),(.35,.025,.12),carbon,.016);text('Registration','HR 07' if kind=='rally' else 'HR 08',(0,hi+.028,.55),(math.pi/2,0,math.pi),chrome,.055)
 if kind=='rally':
  for side in [-1,1]:cube('High wing support',(side*.55,1.85,.99),(.05,.19,.38),carbon,.017)
  cube('Sedan aero wing',(0,1.86,1.185),(1.89,.27,.052),carbon,.025)
  for side in [-1,1]:cube('Wing end plate',(side*.94,1.86,1.19),(.025,.29,.10),carbon,.012)
 else:cube('Ducktail spoiler',(0,2.09,.845),(1.76,.19,.12),paint,.046)
 return finish_car(kind,cfg,make_wheels(centers,cfg,rubber,metal,disc,caliper,chrome,carbon),[[side*.57,.705 if kind=='rally' else .585,-lo+.025] for side in [-1,1]])

if __name__=='__main__':
 chosen=next((v for v in sys.argv if v in CONFIGS),None);catalog=[]
 for kind,cfg in CONFIGS.items():
  if not chosen or chosen==kind:catalog.append(build(kind,cfg))
 if not chosen:(OUT/'manifest.json').write_text(json.dumps({'originalGeometry':True,'vehicles':catalog},indent=2))
