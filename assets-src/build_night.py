"""Original road lamp and night environment texture. No external mesh input.
blender -b --factory-startup --python assets-src/build_night.py
"""
import sys,json,math,random
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from asset_tools import *
from build_wilderness import finish,OUT,SRC

def street_lamp():
 reset();steel=material('Night lamp steel',(.15,.19,.23),.38,.76);black=material('Night lamp housing',(.026,.034,.043),.32,.52);lens=material('Night lamp luminous glass',(1,.65,.29),.23,.12,emission=4)
 cylinder('Tapered lamp foot',(0,0,.0),(0,0,.42),.18,steel,32);cylinder('Tall galvanized lamp post',(0,0,.35),(0,0,8.15),.09,steel,32)
 curve('Curved outreach arm',[(0,0,7.58),(-.18,0,8.09),(-.62,0,8.37),(-1.37,0,8.42),(-2.82,0,8.38)],steel,.062)
 cube('Weatherproof lamp housing',(-2.95,0,8.32),(.74,.34,.13),black,.075);cube('Warm lower lamp lens',(-2.95,0,8.248),(.61,.25,.026),lens,.029)
 for z in [2.0,3.4,5.2]:torus('Pole joint band',(0,0,z),.095,.006,steel,'Z',32)
 cube('Access plate',(0,-.086,.78),(.13,.013,.33),black,.028)
 return finish('street-lamp','night-prop')

def sky():
 # A reproducible equirectangular image, with faint clouds, stars and moon light.
 import numpy as np
 w,h=1024,512;y,x=np.mgrid[0:h,0:w];v=y/(h-1);u=x/w
 t=np.maximum(0,(v-.4)/.6);r=.018+.008*(1-t);g=.028+.022*(1-t);b=.060+.050*(1-t)
 haze=np.exp(-((v-.54)/.14)**2);cloud=(np.sin(u*math.tau*4+v*15)+np.cos(u*math.tau*7-v*19))*.003*haze
 pixels=np.empty((h,w,4),dtype=np.float32);pixels[:,:,0]=r+cloud;pixels[:,:,1]=g+cloud;pixels[:,:,2]=b+cloud*2;pixels[:,:,3]=1
 rng=random.Random(62814)
 for _ in range(220):
  px=rng.randrange(w);py=rng.randrange(int(h*.65),h-2);brightness=rng.uniform(.20,.68);pixels[py,px,:3]=[brightness*.8,brightness*.87,brightness]
 moon=((u-.73)**2+((v-.79)*.5)**2)**.5;glow=np.exp(-moon*100)*.12;disk=moon<.0075
 for k,c in enumerate([.76,.84,1.0]):pixels[:,:,k]+=glow*c;pixels[:,:,k][disk]=c
 img=bpy.data.images.new('Original Harbor midnight sky',width=w,height=h);img.pixels=pixels.ravel();img.filepath_raw=str(ROOT/'dist/assets/night-sky.png');img.file_format='PNG';img.save();print('ORIGINAL_NIGHT_SKY_EXPORTED',flush=True)

if __name__=='__main__':
 meta=street_lamp();p=OUT/'manifest.json';data=json.loads(p.read_text());data['assets']=[a for a in data['assets'] if a['name']!='street-lamp']+[meta];p.write_text(json.dumps(data,separators=(',',':')));sky()
