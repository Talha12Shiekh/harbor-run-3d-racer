# Third party assets and licenses

## Concept Car

File: dist/assets/car.glb.

Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept

Creator: Unity Fan, with optimized glTF sample preparation by Khronos Group.

License: Creative Commons Attribution 4.0 International (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/ . Upstream license is retained at dist/assets/car-license.md. That license excludes logos and associated trademarks. No endorsement is implied.

Changes at render time: normalize to 4.6 metres, merge meshes by material, separate wheel groups, recolor paint, simplify glass material, hide emblem meshes and remove unnamed panel and license plate artwork maps. The bundled GLB is the original upstream binary; render transformations are in dist/world.js.

## Poly Haven textures

Files: dist/assets/asphalt.jpg, asphalt-normal.jpg, brick.jpg and brick-normal.jpg.

Sources: https://polyhaven.com/a/asphalt_01 and https://polyhaven.com/a/brick_wall_001

License: CC0, https://polyhaven.com/license . Photo texture color and normal maps at 1K resolution. Asphalt and brick repeat and material adjustment happen in the renderer. Credit is included voluntarily.

## Three.js 0.180.0

Files: dist/vendor/build and dist/vendor/examples.

Source: https://github.com/mrdoob/three.js

License: MIT, complete text retained in dist/vendor/LICENSE.

## Original work

Harbor Run game logic, circuit design, Blender authored city geometry, generated material and foliage textures, interface, generated signs and synthesized sound were created for this project. No Need for Speed code, music, branded vehicle models, textures, tracks or video footage are bundled. Reference videos and screenshots were studied for camera composition and gameplay context only.

## Poly Haven daylight environment

File: dist/assets/daylight.hdr.

Source: https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky

License: CC0, https://polyhaven.com/license . The 2K HDR image supplies the sky and material reflections. Original asphalt and brick maps are also embedded in the Blender GLB exports. road-worn.jpg is a modified version of Asphalt 01 with generated cracks and pockmarks.

Blender is an authoring tool and is not distributed in this source package. Editable scene and generated models are included.
