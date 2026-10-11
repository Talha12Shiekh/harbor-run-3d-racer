# Third party assets and original geometry

## Original Blender models

The five vehicles in `dist/assets/vehicles` and fourteen scenery/road/lamp prototypes in `dist/assets/wilderness` were authored for Harbor Run from original Blender surface sections and primitives. Editable scenes and authoring scripts are in `assets-src`. No downloaded vehicle or scenery geometry is used by this release. The previous independently licensed sedan and city presentation can be recovered from earlier Git versions.

The supplied Hot Pursuit footage informed visible proportions and scene composition. No extracted Need for Speed code, music, models, textures, tracks or video frames are distributed. Original police lettering and signs contain no copied game livery or manufacturer emblems. The reconstruction does not imply endorsement.

Original work includes driving, circuit, UI, procedural sound, night sky, rendered menu imagery, vehicle/scenery geometry, conifer needle opacity/color maps, blended mountain biome maps, bark/concrete maps, debris, paint wear and contact shadows. Procedural material scripts are included. The preview renderer appends only this project's own Blender files.

## Poly Haven maps and daylight

Sources: https://polyhaven.com/a/asphalt_01 and https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky

License: CC0, https://polyhaven.com/license . Credit is voluntary.

Files: `dist/assets/asphalt.jpg`, `asphalt-normal.jpg`, `daylight.hdr`. `road-worn.jpg` modifies Asphalt 01 with original cracks and pockmarks. The 2K HDR supplies sky and material reflections. These maps are also packed into composed Blender previews where used.

The retained `brick.jpg` and `brick-normal.jpg` came from https://polyhaven.com/a/brick_wall_001 under the same CC0 license. They are unused by the current wilderness runtime.

## Three.js 0.180.0

Source: https://github.com/mrdoob/three.js

Files: `dist/vendor/build` and `dist/vendor/examples`.

License: MIT; complete text is retained in `dist/vendor/LICENSE`.

Blender is an authoring tool and is not redistributed. The source package contains editable scenes and exports, not a Blender installation.

## Barlow and Barlow Condensed

Designed by Jeremy Tribby. Source distribution: Google Fonts, `ofl/barlow` and `ofl/barlowcondensed` in https://github.com/google/fonts.

Files in `dist/assets/fonts`: Barlow Regular and SemiBold, Barlow Condensed Bold and ExtraBold Italic. SIL Open Font License 1.1. The complete license texts are retained beside the font files as `barlow-OFL.txt` and `barlowcondensed-OFL.txt`. Fonts are served locally.
