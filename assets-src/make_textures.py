"""Create reproducible material textures and foliage cutouts for the Blender kit."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance,ImageOps
import numpy as np,random,math
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets-src/textures';OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(9206);rnd=random.Random(9206)
def noise(n,grain=10):
 fine=rng.normal(0,grain,(n,n));coarse=Image.fromarray(np.uint8(rng.uniform(0,255,(64,64)))).resize((n,n)).filter(ImageFilter.GaussianBlur(n/80));return fine+(np.asarray(coarse,dtype=float)-128)*.18
N=1024
for name,base in [('limestone',(142,139,123)),('concrete',(122,128,126)),('pavement',(128,127,115)),('rust',(78,80,71)),('bark',(66,59,42))]:
 v=noise(N,7 if name!='bark' else 12);arr=np.clip(np.array(base)[None,None,:]+v[:,:,None],0,255).astype('uint8');im=Image.fromarray(arr);d=ImageDraw.Draw(im)
 if name in ['limestone','pavement']:
  row=256 if name=='limestone' else 512
  for y in range(0,N,row):
   d.line((0,y,N,y),fill=(65,68,62),width=4)
   for x in range(-512 if y//row%2 else 0,N,512):d.line((x,y,x,y+row),fill=(70,73,67),width=3)
 if name=='concrete':
  for _ in range(90):
   x=rnd.randrange(N);y=rnd.randrange(N);d.line((x,y,x+rnd.randrange(-20,20),y+rnd.randrange(8,60)),fill=(98,107,95),width=1)
 if name=='bark':
  for _ in range(110):
   x=rnd.randrange(N);pts=[(x+rnd.randrange(-8,9),y) for y in range(0,N,40)];d.line(pts,fill=(35,38,26),width=rnd.randrange(1,4))
 if name=='rust':
  for _ in range(700):
   x,y=rnd.randrange(N),rnd.randrange(N);r=rnd.randrange(2,12);d.ellipse((x-r,y-r,x+r,y+r),fill=(rnd.randrange(70,105),rnd.randrange(48,64),rnd.randrange(27,43)))
 im.save(OUT/(name+'.jpg'),quality=92)
 h=np.array(ImageOps.grayscale(im),dtype=float)/255;gy,gx=np.gradient(h);normal=np.stack((-gx*1.2,-gy*1.2,np.ones_like(h)),axis=2);normal/=np.linalg.norm(normal,axis=2,keepdims=True);Image.fromarray(np.uint8((normal*.5+.5)*255)).resize((512,512)).save(OUT/(name+'-normal.jpg'),quality=90)
# Worn road texture remains derived from the credited asphalt photo.
asphalt=Image.open(ROOT/'dist/assets/asphalt.jpg').resize((2048,2048));asphalt=ImageOps.colorize(ImageOps.grayscale(asphalt),'#181d1e','#696e70');draw=ImageDraw.Draw(asphalt)
for _ in range(26):
 x,y=rnd.randrange(2048),rnd.randrange(2048);pts=[(x,y)]
 for i in range(rnd.randrange(7,20)):
  x+=rnd.randrange(-45,46);y+=rnd.randrange(15,65);pts.append((x,y))
 draw.line(pts,fill=(31,35,34),width=rnd.randrange(2,5))
 for i in range(1,len(pts),4):
  a=pts[i];draw.line([a,(a[0]+rnd.randrange(-70,71),a[1]+rnd.randrange(10,45))],fill=(34,38,36),width=2)
for _ in range(70):
 x,y=rnd.randrange(2048),rnd.randrange(2048);r=rnd.randrange(2,6);draw.ellipse((x-r,y-r,x+r,y+r),fill=(58,62,60))
asphalt.save(OUT/'road-worn.jpg',quality=94)
# A branch cluster atlas with leaf detail and transparent gaps, never a solid canopy.
N=1024;leaves=Image.new('RGBA',(N,N));d=ImageDraw.Draw(leaves)
for stem in range(11):
 sx,sy=512+rnd.randrange(-50,50),950-rnd.randrange(30,180);ex,ey=rnd.randrange(140,880),rnd.randrange(90,450)
 d.line((sx,sy,ex,ey),fill=(77,72,43,255),width=rnd.randrange(4,7))
 for j in range(16):
  t=(j+1)/18;x=sx+(ex-sx)*t+rnd.randrange(-25,26);y=sy+(ey-sy)*t;ang=math.atan2(ey-sy,ex-sx)+(1 if j%2 else -1)*.65;length=rnd.randrange(38,76);width=length*.36;dx,dy=math.cos(ang),math.sin(ang);nx,ny=-dy,dx
  pts=[(x,y),(x+dx*length*.38+nx*width,y+dy*length*.38+ny*width),(x+dx*length,y+dy*length),(x+dx*length*.42-nx*width,y+dy*length*.42-ny*width)]
  tone=rnd.randrange(-16,18);color=(106+tone,121+tone,65+tone//2,255);d.polygon(pts,fill=color);d.line((x,y,x+dx*length*.9,y+dy*length*.9),fill=(108+tone,115+tone,57,255),width=2)
arr=np.array(leaves);grain=rng.normal(0,4,(N,N,1));arr[:,:,:3]=np.clip(arr[:,:,:3].astype(float)+grain,0,255);arr[arr[:,:,3]==0,:3]=0;Image.fromarray(arr).save(OUT/'foliage.png')
# Modest ground debris, placed sparingly outside the racing line.
debris=Image.new('RGBA',(512,512));d=ImageDraw.Draw(debris)
for _ in range(40):
 x,y=rnd.randrange(30,480),rnd.randrange(30,480);a=rnd.random()*math.tau;l=rnd.randrange(8,20);pts=[(x+math.sin(a)*l,y+math.cos(a)*l),(x+math.cos(a)*l*.4,y-math.sin(a)*l*.4),(x-math.sin(a)*l,y-math.cos(a)*l),(x-math.cos(a)*l*.4,y+math.sin(a)*l*.4)];d.polygon(pts,fill=rnd.choice([(117,82,36,255),(94,93,46,255),(134,100,57,255)]))
debris.save(OUT/'debris.png')
print('Generated textured materials and leaf cutouts')

paint=Image.new('RGBA',(64,256),(191,187,158,255));a=np.array(paint);a[rng.random((256,64))<.15,3]=0;Image.fromarray(a).save(OUT/'paint-worn.png')
x,y=np.meshgrid(np.linspace(-1,1,256),np.linspace(-1,1,256));alpha=np.uint8(np.clip((1-np.sqrt(x*x+y*y))*.37,0,.37)*255);shadow=np.zeros((256,256,4),dtype=np.uint8);shadow[:,:,3]=alpha;Image.fromarray(shadow).save(OUT/'contact-shadow.png')

# Keep generated ground textures synchronized with the browser assets.
import shutil
for name in ['road-worn.jpg','pavement.jpg','pavement-normal.jpg','debris.png','paint-worn.png','contact-shadow.png']:
 shutil.copy2(OUT/name,ROOT/'dist/assets'/name)
