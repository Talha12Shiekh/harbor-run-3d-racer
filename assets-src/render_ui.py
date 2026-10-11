"""Render actual authored vehicle thumbnails for the garage.
blender -b --factory-startup --python assets-src/render_ui.py
"""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from asset_tools import *
from render_wilderness import place,CACHE
OUT=ROOT/'dist/assets/ui';OUT.mkdir(exist_ok=True)
for kind in ['hypercar','spyder','interceptor','rally','muscle']:
 reset();CACHE.clear();place(kind,{'x':0,'y':0,'z':0,'heading':0},True);scene,cam=studio();cam.location=(5,-7,2.2);cam.rotation_euler=(Vector((0,0,.70))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.resolution_x=560;scene.render.resolution_y=330;scene.cycles.samples=16;scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=88;scene.render.filepath=str(OUT/(kind+'.jpg'));bpy.ops.render.render(write_still=True)
