"""Original forest/alpine scenery. Rebuild with Blender, no mesh imports.
The authored landscape follows the existing legal circuit in track.json.
"""
import sys,math,json,random
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from asset_tools import *
OUT=ROOT/'dist/assets/wilderness';SRC=ROOT/'assets-src/wilderness'
OUT.mkdir(parents=True,exist_ok=True);SRC.mkdir(parents=True,exist_ok=True)
TRACK=json.loads((ROOT/'assets-src/track.json').read_text());R=random.Random(44581)

def textured(name,file,color=(1,1,1),rough=.9,normal=None,cutout=False):
 m=material(name,color,rough);nt=m.node_tree;bs=nt.nodes.get('Principled BSDF');t=nt.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(file),check_existing=True);nt.links.new(t.outputs['Color'],bs.inputs['Base Color'])
 if cutout:nt.links.new(t.outputs['Alpha'],bs.inputs['Alpha']);m.surface_render_method='DITHERED';m.use_backface_culling=False
 if normal:
  t=nt.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(normal),check_existing=True);t.image.colorspace_settings.name='Non-Color';n=nt.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.6;nt.links.new(t.outputs['Color'],n.inputs['Color']);nt.links.new(n.outputs['Normal'],bs.inputs['Normal'])
 return m

def needle_atlas(snow=False):
 """Procedural opacity/color data for original needle geometry cards."""
 w,h=512,256;pixels=[0.]*(w*h*4);r=random.Random(624)
 def line(a,b,color,width=1):
  steps=int(math.hypot(b[0]-a[0],b[1]-a[1])*2)+1
  for i in range(steps):
   q=i/max(1,steps-1);x=round(a[0]+(b[0]-a[0])*q);y=round(a[1]+(b[1]-a[1])*q)
   for dx in range(-width,width+1):
    for dy in range(-width,width+1):
     xx,yy=x+dx,y+dy
     if 0<=xx<w and 0<=yy<h:
      k=(yy*w+xx)*4;pixels[k:k+4]=[*color,1]
 line((12,128),(499,128),(.18,.21,.10),2)
 for j in range(40):
  x=24+j*11.7
  for side in [-1,1]:
   yy=128+side*(82*(1-x/570)+r.uniform(-8,12));end=(x+35,yy);line((x,128),end,(.16,.23,.10))
   for k in range(20):
    t=k/20;bx=x+(end[0]-x)*t;by=128+(yy-128)*t;green=(r.uniform(.14,.22),r.uniform(.32,.47),r.uniform(.08,.16));color=(.77,.83,.86) if snow and side==1 and k%3 else green
    for direction in [-1,1]:line((bx,by),(bx-18+r.uniform(-4,5),by+direction*r.uniform(10,21)),color,1)
 img=bpy.data.images.new('Original snow needles' if snow else 'Original conifer needles',width=w,height=h,alpha=True);img.pixels=pixels;img.filepath_raw=str(SRC/('needles-snow.png' if snow else 'needles.png'));img.file_format='PNG';img.save();return Path(img.filepath_raw)

def consolidate():
 bpy.ops.object.select_all(action='DESELECT');groups={}
 for o in bpy.context.scene.objects:
  if o.type=='MESH':groups.setdefault(o.data.materials[0].name,[]).append(o)
 for name,items in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in items:o.select_set(True)
  bpy.context.view_layer.objects.active=items[0];bpy.ops.object.join();bpy.context.object.name=name

def finish(name,kind,extra=None):
 consolidate();meta={'name':name,'file':name+'.glb','kind':kind,'originalGeometry':True,**measurements(),**(extra or {})};export(OUT/meta['file']);bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(SRC/(name+'.blend')),compress=True);print('SCENERY_EXPORTED',name,meta['triangles'],flush=True);return meta

def conifer(name,height,wide,snow=False,redwood=False):
 reset();bark=textured('Bark ridges',ROOT/'assets-src/textures/bark.jpg',normal=ROOT/'assets-src/textures/bark-normal.jpg');leaves=textured('Leaf needle cutouts',needle_atlas(snow),cutout=True)
 vv=[];ff=[];n=24;levels=9
 for j in range(levels+1):
  z=height*j/levels;radius=(.52 if redwood else .27)*(1-j/(levels+1))+.06
  for i in range(n):a=i*math.tau/n;rr=radius*(1+.10*math.sin(i*7+j));vv.append((rr*math.cos(a),rr*math.sin(a),z))
 for j in range(levels):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;ff.append((a,b,b+n,a+n))
 trunk=mesh('Tapered grooved trunk',vv,ff,bark);uv=trunk.data.uv_layers.new()
 for p in trunk.data.polygons:
  for li in p.loop_indices:
   co=trunk.data.vertices[trunk.data.loops[li].vertex_index].co;uv.data[li].uv=((math.atan2(co.y,co.x)/math.tau)%1,co.z/3)
 cv=[];cf=[];uvdata=[]
 for tier in range(15):
  z=height*(.29+.66*tier/14)+R.uniform(-.42,.42);spread=wide*(1-tier/16)**.85;branches=7 if tier<10 else 5
  for j in range(branches):
   a=j*math.tau/branches+tier*1.83+R.uniform(-.24,.24);u=Vector((math.cos(a),math.sin(a),0));v=Vector((-math.sin(a),math.cos(a),0));reach=spread*R.uniform(.75,1.18);end=u*reach+Vector((0,0,z+.12))
   cylinder('Woody branch',(0,0,z-.24),end,.035*(1-tier/19),bark,8)
   for q in [.48,.80,1.0]:
    center=u*(reach*q)+Vector((0,0,z+.10*q+R.uniform(-.30,.30)));length=reach*R.uniform(.60,.83);width=(.65+(1-tier/17)*.70)*R.uniform(.8,1.15)
    for roll in [-.85,0,.85]:
     roll+=R.uniform(-.20,.20);base=len(cv);axis=v*math.cos(roll)+Vector((0,0,math.sin(roll)))
     for t,side,lift in [(-.55,-1,0),(-.55,0,.13),(-.55,1,0),(.55,-1,0),(.55,0,.13),(.55,1,0)]:cv.append(center+u*(t*length)+axis*(side*width/2)+Vector((0,0,lift)))
     cf.extend([(base,base+3,base+4,base+1),(base+1,base+4,base+5,base+2)]);uvdata.extend([((0,0),(1,0),(1,.5),(0,.5)),((0,.5),(1,.5),(1,1),(0,1))])
 card=mesh('Individual folded needle boughs',cv,cf,leaves,False);uv=card.data.uv_layers.new()
 for p,coords in zip(card.data.polygons,uvdata):
  for li,co in zip(p.loop_indices,coords):uv.data[li].uv=co
 return finish(name,'tree')

def rock(name,size,count=1):
 reset();m=textured('Weathered granite',ROOT/'assets-src/textures/concrete.jpg',normal=ROOT/'assets-src/textures/concrete-normal.jpg')
 for j in range(count):
  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=1,location=((j-(count-1)/2)*size[0]*.58,0,size[2]*.38));o=bpy.context.object;o.name='Eroded boulder';o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  for v in o.data.vertices:
   c=v.co;factor=1+.10*math.sin(c.x*4.1+c.z*2.7)+.055*math.cos(c.y*6.3-c.z*3.7);v.co*=factor
   v.co.z=max(v.co.z,-size[2]*.38)
  o.data.materials.append(m)
  for p in o.data.polygons:p.use_smooth=True
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.2,island_margin=.01);bpy.ops.object.mode_set(mode='OBJECT')
 return finish(name,'rock')

def rail():
 reset();steel=material('Galvanized guardrail',(.40,.46,.48),.44,.7);v=[];f=[]
 profile=[(-.055,.57),(.075,.66),(.10,.76),(-.015,.85),(.10,.94),(.07,1.04),(-.055,1.12)]
 for j in range(13):
  y=-3+j*.5
  for x,z in profile:v.append((x,y,z))
 for j in range(12):
  for k in range(6):a=j*7+k;f.append((a,a+7,a+8,a+1))
 mesh('Corrugated W beam',v,f,steel)
 for y in [-2.5,0,2.5]:
  cube('Steel channel post',(-.10,y,.51),(.10,.13,1.06),steel,.008)
  for z in [.70,.99]:cylinder('Guardrail bolt',(.08,y,z),(.12,y,z),.025,steel,12)
 return finish('guardrail','prop')

def utility():
 reset();wood=material('Utility weathered timber',(.17,.13,.09),.94);steel=material('Utility hardware',(.25,.30,.32),.55,.5);ceramic=material('Ceramic insulators',(.48,.55,.51),.3)
 cylinder('Utility pole',(0,0,0),(0,0,10),.15,wood,16);cube('Crossarm',(0,0,9.4),(3.1,.16,.17),wood,.025)
 for x in [-1.25,0,1.25]:
  cylinder('Insulator',(x,0,9.4),(x,0,9.75),.073,ceramic,16)
  for z in [9.49,9.56,9.63]:torus('Insulator flange',(x,0,z),.08,.014,ceramic,'Z',24)
 cylinder('Crossarm brace',(-1.3,0,9.35),(0,0,8.55),.018,steel,8);cylinder('Crossarm brace',(1.3,0,9.35),(0,0,8.55),.018,steel,8);pole=finish('power-pole','prop')
 reset();wire=material('Power cable',(.035,.046,.051),.85)
 for x in [-1.25,0,1.25]:curve('Sagging cable',[(x,-72*i/48,9.75-1.65*math.sin(math.pi*i/48)) for i in range(49)],wire,.013)
 return [pole,finish('power-line','wire')]

def waterfall():
 reset();stone=textured('Falls granite',ROOT/'assets-src/textures/concrete.jpg',normal=ROOT/'assets-src/textures/concrete-normal.jpg');water=material('Waterfall white water',(.50,.69,.73),.2,.08,alpha=.72);foam=material('Foam streaks',(.8,.92,.94),.38,alpha=.8)
 for side in [-1,1]:
  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=1,location=(side*5,1,8));o=bpy.context.object;o.scale=(3,2,10);o.data.materials.append(stone)
 for j in range(12):
  x=-3.6+j*.65;curve('Broken falling water',[(x+.13*math.sin(i+j),-.18,18-i*.45) for i in range(41)],water,.22+R.random()*.08)
  curve('White foam filaments',[(x+.16*math.sin(i*1.3+j),-.48,17-i*.45) for i in range(37)],foam,.025)
 return finish('waterfall','feature')

def landscape(snow):
 reset();n=140;nx=n+1;extent=1700;origin=(-680,-850);samples=TRACK['samples'];v=[];f=[];heights=[];distance=[]
 for j in range(nx):
  z=origin[1]+extent*j/n
  for i in range(nx):
   x=origin[0]+extent*i/n;d=math.sqrt(min((x-p['x'])**2+(z-p['z'])**2 for p in samples));distance.append(d)
   factor=min(1,max(0,(d-42)/140));noise=28+20*math.sin(x*.018+z*.009)+17*math.cos(z*.013-x*.008)+11*math.sin(z*.034)*math.sin(x*.025)
   peaks=sum(h*math.exp(-((x-a)**2+(z-b)**2)/(r*r)) for a,b,h,r in [(-350,-560,180,200),(620,-610,225,210),(710,370,170,170),(-450,400,160,180),(140,760,205,250)])
   height=-.8+factor*(max(3,noise)+peaks);heights.append(round(height,3));v.append((x,-z,height))
 for j in range(n):
  for i in range(n):a=j*nx+i;f.append((a,a+nx,a+nx+1,a+1))
 # Original continuous biome map, blended by elevation/slope instead of per-face patches.
 w=512;pixels=[]
 for j in range(w):
  vv=j/(w-1)*n;jj=min(n-1,int(vv));b=vv-jj
  for i in range(w):
   uu=i/(w-1)*n;ii=min(n-1,int(uu));a=uu-ii;h00=heights[jj*nx+ii];h10=heights[jj*nx+ii+1];h01=heights[(jj+1)*nx+ii];h11=heights[(jj+1)*nx+ii+1];height=(h00*(1-a)+h10*a)*(1-b)+(h01*(1-a)+h11*a)*b;slope=math.hypot(h10-h00,h01-h00)/(extent/n);x=origin[0]+extent*i/(w-1);z=origin[1]+extent*j/(w-1);grain=.035*math.sin(x*.27)*math.cos(z*.31)+.024*math.sin(x*.085+z*.092)
   steep=max(0,min(1,(slope-.24)*1.35));summit=max(0,min(1,(height-(110 if snow else 178))/45))*(1-steep*.65);green=(.10+grain*.4,.17+grain*.5,.065+grain*.25);rock=(.24+grain,.26+grain,.24+grain);white=(.73+grain,.79+grain,.82+grain);base=white if snow else green;color=[base[k]*(1-steep)+rock[k]*steep for k in range(3)];pixels.extend([color[k]*(1-summit)+white[k]*summit for k in range(3)]+[1])
 img=bpy.data.images.new('Original blended mountain biome',width=w,height=w);img.pixels=pixels;file=SRC/('biome-alpine.png' if snow else 'biome-forest.png');img.filepath_raw=str(file);img.file_format='PNG';img.save();ground=textured('Alpine biome' if snow else 'Forest biome',file,rough=.95)
 o=mesh('Sculpted circuit landscape',v,f,ground);uv=o.data.uv_layers.new()
 for p in o.data.polygons:
  for li in p.loop_indices:
   co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=((co.x-origin[0])/extent,(-co.y-origin[1])/extent)
 meta=finish('terrain-alpine' if snow else 'terrain-forest','terrain')
 return meta,{'size':nx,'extent':extent,'origin':origin,'heights':heights}

def authored_road(theme):
 reset();alpine=theme=='alpine';road=textured('Alpine asphalt' if alpine else 'Forest asphalt',ROOT/'dist/assets/road-worn.jpg',rough=.7 if alpine else .48,normal=ROOT/'dist/assets/asphalt-normal.jpg');bs=road.node_tree.nodes.get('Principled BSDF');bs.inputs['Coat Weight'].default_value=.35 if alpine else .68;bs.inputs['Coat Roughness'].default_value=.14;r=road.node_tree.nodes.new('ShaderNodeTexImage');r.image=bpy.data.images.load(str(ROOT/'dist/assets/road-roughness.jpg'),check_existing=True);r.image.colorspace_settings.name='Non-Color';road.node_tree.links.new(r.outputs['Color'],bs.inputs['Roughness']);
 gravel=textured('Alpine gravel' if alpine else 'Forest gravel',ROOT/'dist/assets/pavement.jpg',normal=ROOT/'dist/assets/pavement-normal.jpg',rough=.96);white=textured('Road paint white',ROOT/'dist/assets/paint-worn.png',cutout=True);yellow=textured('Road paint yellow',ROOT/'dist/assets/paint-worn.png',cutout=True)
 def ribbon(name,width,offset,mat,slope=False):
  v=[];f=[]
  for p in TRACK['samples']:
   for side in [-1,1]:
    o=offset+side*width/2;z=-.8 if slope and abs(o)>20 else p['y']+.015;v.append((p['x']+p['tz']*o,-(p['z']-p['tx']*o),z))
  for i in range(len(TRACK['samples'])-1):a=i*2;f.append((a,a+2,a+3,a+1))
  o=mesh(name,v,f,mat);uv=o.data.uv_layers.new()
  for p in o.data.polygons:
   for li in p.loop_indices:
    idx=o.data.loops[li].vertex_index;uv.data[li].uv=(idx%2*width/8,TRACK['samples'][idx//2]['s']/8)
 ribbon('Authored highway surface',19,0,road)
 for side in [-1,1]:ribbon('Authored gravel shoulder',4.5,side*11.75,gravel);ribbon('Authored shoulder bank',7,side*17.5,gravel,True)
 vv={white:[],yellow:[]};ff={white:[],yellow:[]};coords={white:[],yellow:[]}
 for index,p in enumerate(TRACK['samples']):
  if index%2:continue
  # The original circuit samples carry tangent/elevation data shared with physics.
  for offset in [-9.05,-4.65,-.13,.13,4.65,9.05]:
   if abs(offset)==4.65 and p['s']%9>4.6:continue
   m=yellow if abs(offset)<.2 else white;w=.09 if m==yellow else .12;length=TRACK['length']/780*2+.04;start=len(vv[m])
   for x,z in [(-w/2,-length/2),(w/2,-length/2),(w/2,length/2),(-w/2,length/2)]:vv[m].append((p['x']+p['tz']*(offset+x)+p['tx']*z,-(p['z']-p['tx']*(offset+x)+p['tz']*z),p['y']+.042))
   ff[m].append((start,start+1,start+2,start+3));coords[m].append([(0,0),(1,0),(1,1),(0,1)])
 for m in vv:
  # Clockwise game X/Z corners become outward Blender +Z normals.
  o=mesh('Authored lane paint',vv[m],[tuple(reversed(f)) for f in ff[m]],m,False);uv=o.data.uv_layers.new()
  for p,c in zip(o.data.polygons,coords[m]):
   for li,co in zip(p.loop_indices,reversed(c)):uv.data[li].uv=co
 return finish('road-'+theme,'road')

def main():
 assets=[conifer('redwood',28,4.2,redwood=True),conifer('spruce',18,3.7),conifer('spruce-snow',18,3.7,snow=True),rock('rock-face',(5,3.6,4.2),3),rock('boulder',(1.9,1.5,1.5)),rail(),*utility(),waterfall()];forest,heightmap=landscape(False);alpine,_=landscape(True);assets.extend([forest,alpine,authored_road('forest'),authored_road('alpine')]);(OUT/'manifest.json').write_text(json.dumps({'originalGeometry':True,'assets':assets,'heightmap':heightmap},separators=(',',':')))
 print('ORIGINAL_WILDERNESS_COMPLETE',len(assets),flush=True)
if __name__=='__main__':main()
