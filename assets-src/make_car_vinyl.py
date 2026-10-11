"""Original layered red and black graphic. Python with Pillow."""
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parent/'textures';root.mkdir(exist_ok=True)
im=Image.new('RGBA',(2048,512));d=ImageDraw.Draw(im)
# Broad tapered ribbon with crisp offset pinstripes, no copied artwork or brands.
d.polygon([(0,165),(420,260),(880,130),(1100,295),(1470,100),(1740,210),(2048,24),(1750,340),(1420,265),(1100,467),(860,330),(480,462),(0,365)],fill=(18,23,28,255))
d.line([(0,148),(420,241),(879,111),(1102,274),(1470,80),(1740,190),(2048,6)],fill=(211,216,214,255),width=10)
d.polygon([(0,395),(475,489),(872,363),(1092,499),(1440,304),(1750,382),(2048,120),(1830,460),(1550,409),(1110,512),(700,512),(0,480)],fill=(161,17,25,255))
d.line([(0,385),(475,478),(872,353),(1092,490),(1440,294),(1750,371),(2048,109)],fill=(236,63,47,255),width=8)
im.save(root/'coupe-vinyl.png')
