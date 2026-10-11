"""Author the original animated cabin kit. No downloaded meshes.
blender -b --factory-startup --python assets-src/build_cockpit.py
"""
import sys, math, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from asset_tools import *
OUT=ROOT/'dist/assets/vehicles'; SRC=ROOT/'assets-src/cockpit'
OUT.mkdir(exist_ok=True); SRC.mkdir(exist_ok=True)
reset()
def p(x,y,z): return (x,-z,y)
leather=material('Cockpit stitched leather',(.048,.058,.065),.74)
soft=material('Cockpit wheel rubber',(.065,.073,.08),.62)
metal=material('Cockpit brushed alloy',(.30,.34,.38),.31,.82)
dark=material('Cockpit vent recess',(.004,.008,.012),.8)
ink=material('Cockpit instrument ivory',(.76,.89,.92),.48,emission=.75)
cyan=material('Cockpit cyan indicator',(.025,.50,.65),.30,emission=2)
amber=material('Cockpit amber needle',(.95,.34,.045),.32,emission=1.4)
cube('Sculpted dashboard',p(0,.77,.76),(1.36,.44,.17),leather,.055)
cube('Dashboard upper lip',p(0,.85,.82),(1.40,.20,.055),soft,.023)
cube('Instrument shroud',p(-.35,.865,.70),(.56,.20,.22),leather,.025)
for x in [-.59,-.11,.44]:
 cube('Recessed air vent',p(x,.81,.512),(.19,.028,.075),dark,.012)
 for i in range(5):cube('Air vent fin',p(x-.065+i*.032,.81,.490),(.007,.018,.053),metal,.002)
for side in [-1,1]:
 cube('Inner door panel',p(side*.68,.62,-.03),(.035,.83,.22),leather,.026)
 curve('Door stitching',[p(side*.655,.72,z) for z in [-.35,-.1,.15,.35]],ink,.0015)
 cube('Door pull',p(side*.65,.66,-.03),(.035,.16,.022),metal,.006)
# A close roof liner and raked A pillars frame the windshield without the
# exterior canopy crossing the driving camera. The spyder omits the header.
bpy.ops.object.empty_add();frame=bpy.context.object;frame.name='CockpitFrame'
start=set(bpy.context.scene.objects)
for side in [-1,1]:
 curve('Trimmed windshield pillar',[p(side*.73,1.13,-.10),p(side*.80,1.03,.35),p(side*.85,.84,.86)],leather,.021)
bpy.context.view_layer.update()
for o in set(bpy.context.scene.objects)-start:
 world=o.matrix_world.copy();o.parent=frame;o.matrix_world=world
bpy.ops.object.empty_add();header=bpy.context.object;header.name='CockpitHeader'
start=set(bpy.context.scene.objects)
cube('Interior roof liner',p(0,1.15,-.085),(1.60,.060,.040),leather,.012)
bpy.context.view_layer.update()
for o in set(bpy.context.scene.objects)-start:
 world=o.matrix_world.copy();o.parent=header;o.matrix_world=world
cube('Center console',p(.10,.56,.14),(.20,.74,.15),leather,.03)
cube('Display surround',p(.15,.79,.514),(.24,.024,.15),metal,.012)
cube('Display glass',p(.15,.79,.499),(.22,.006,.13),dark,.008)
text('Original dash logo','HARBOR',p(.15,.82,.493),(math.pi/2,0,math.pi),ink,.026)
text('Original dash line','RUN / 01',p(.15,.775,.493),(math.pi/2,0,math.pi),cyan,.020)
for x in [.08,.16,.24]:
 cylinder('Console dial',p(x,.69,.50),p(x,.69,.47),.016,metal,32)
 cube('Dial marker',p(x,.699,.46),(.004,.008,.012),ink,.001)
cylinder('Gear lever',p(.10,.62,.10),p(.10,.71,.11),.012,metal,32)
cube('Gear knob',p(.10,.725,.11),(.047,.045,.045),soft,.016)
for x,name,label,maximum in [(-.49,'SpeedNeedle','KM/H',300),(-.21,'RpmNeedle','RPM',7)]:
 y,z=.867,.594
 cylinder('Dial face',p(x,y,z+.012),p(x,y,z),.094,dark,64)
 torus('Dial bezel',p(x,y,z),.097,.006,metal,'Y',64)
 for i in range(29):
  a=-2.3+4.6*i/28
  r0=.076 if i%4==0 else .082
  cylinder('Dial graduation',p(x-math.sin(a)*r0,y+math.cos(a)*r0,z-.007),p(x-math.sin(a)*.090,y+math.cos(a)*.090,z-.007),.0015,ink,8)
 for i in range(4):
  a=-2.3+4.6*i/3
  text('Dial number',str(round(maximum*i/3)),p(x-math.sin(a)*.061,y+math.cos(a)*.061,z-.009),(math.pi/2,0,math.pi),ink,.016)
 text('Dial unit',label,p(x,y-.026,z-.010),(math.pi/2,0,math.pi),cyan,.013)
 bpy.ops.object.empty_add(location=p(x,y,z-.018));pivot=bpy.context.object;pivot.name=name
 start=set(bpy.context.scene.objects)
 cylinder('Gauge needle',p(x,y-.012,z-.018),p(x,y+.071,z-.018),.0023,amber,12)
 cylinder('Gauge hub',p(x,y,z-.024),p(x,y,z-.017),.008,metal,24)
 bpy.context.view_layer.update()
 for o in set(bpy.context.scene.objects)-start:
  world=o.matrix_world.copy();o.parent=pivot;o.matrix_world=world
# The wheel is a real group with a centered pivot for runtime rotation.
center=p(-.35,.79,.36)
bpy.ops.object.empty_add(location=center);pivot=bpy.context.object;pivot.name='CockpitSteering'
start=set(bpy.context.scene.objects)
torus('Leather steering rim',center,.16,.019,soft,'Y',80)
torus('Inset steering seam',p(-.35,.79,.343),.159,.0018,ink,'Y',80)
for angle in [math.pi/2,math.pi*1.16,math.pi*1.84]:
 endpoint=p(-.35+math.cos(angle)*.145,.79+math.sin(angle)*.145,.36)
 cylinder('Wheel machined spoke',p(-.35,.79,.36),endpoint,.014,metal,32)
cube('Wheel central pad',center,(.13,.05,.095),leather,.018)
text('Wheel monogram','HR',p(-.35,.79,.329),(math.pi/2,0,math.pi),ink,.026)
for x in [-.41,-.29]:cube('Wheel control',p(x,.808,.330),(.012,.012,.014),cyan,.003)
cube('Top center wheel marker',p(-.35,.951,.340),(.024,.012,.013),amber,.003)
bpy.context.view_layer.update()
for o in set(bpy.context.scene.objects)-start:
 world=o.matrix_world.copy();o.parent=pivot;o.matrix_world=world
metadata={'originalGeometry':True,'authoring':'Blender '+bpy.app.version_string,'animatedGroups':['CockpitSteering','SpeedNeedle','RpmNeedle'],**measurements()}
export(OUT/'cockpit.glb')
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'cockpit.blend'),compress=True)
(OUT/'cockpit.json').write_text(json.dumps(metadata,indent=2))
print('ORIGINAL_COCKPIT_EXPORTED',json.dumps(metadata),flush=True)
