"""Optional decoded-image QA; requires Pillow, no GPU is exercised."""
from pathlib import Path
from io import BytesIO
import json,struct
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
external=embedded=0
for path in (ROOT/'dist/assets').rglob('*'):
 if path.suffix.lower() in ['.jpg','.png']:
  with Image.open(path) as image:image.load();assert min(image.size)>0
  external+=1
 if path.suffix=='.glb':
  data=path.read_bytes();assert data[:4]==b'glTF';length,kind=struct.unpack_from('<II',data,12);document=json.loads(data[20:20+length]);offset=20+length;bin_length,bin_kind=struct.unpack_from('<II',data,offset);binary=data[offset+8:offset+8+bin_length]
  for description in document.get('images',[]):
   view=document['bufferViews'][description['bufferView']];start=view.get('byteOffset',0)
   with Image.open(BytesIO(binary[start:start+view['byteLength']])) as image:image.load();assert min(image.size)>0
   embedded+=1
atlas=[]
for file in ['needles.png','needles-snow.png']:
 with Image.open(ROOT/'assets-src/wilderness'/file) as image:
  alpha=image.getchannel('A');assert alpha.getextrema()==(0,255);coverage=sum(v>0 for v in alpha.getdata())/(image.width*image.height);assert .15<coverage<.9;atlas.append({'file':file,'dimensions':image.size,'coverage':round(coverage,3)})
print(json.dumps({'externalDecoded':external,'embeddedDecoded':embedded,'originalNeedleMaps':atlas,'gpuTextureUpload':'not exercised'},indent=2))
