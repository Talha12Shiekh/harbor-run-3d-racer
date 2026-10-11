"""Generate a periodic scalar roughness map; no reference image pixels are used."""
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parents[1]
n=512
x,y=np.meshgrid(np.arange(n)/n,np.arange(n)/n)
field=np.zeros((n,n))
rng=np.random.default_rng(1710)
for frequency,weight in [(1,.35),(2,.28),(4,.2),(8,.1),(16,.07)]:
    for _ in range(3):
        ax,ay=rng.integers(1,4,size=2)*frequency
        field+=weight/3*np.sin(2*np.pi*(ax*x+ay*y)+rng.uniform(0,2*np.pi))
field=(field-field.min())/(field.max()-field.min())
values=np.uint8(94+field*143)
image=Image.fromarray(np.repeat(values[:,:,None],3,axis=2))
image.save(root/'dist/assets/road-roughness.jpg',quality=94)
print('Periodic road roughness range:',int(values.min()),int(values.max()))
