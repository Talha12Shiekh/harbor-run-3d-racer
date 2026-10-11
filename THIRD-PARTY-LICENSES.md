# Third party assets and licenses

## Mitsubishi Lancer Evolution IX

Base geometry by Benit Kibabu, originally authored in Autodesk Maya.
Source: https://sketchfab.com/3d-models/mitsubishi-lancer-evolution-ix-ee88ad9414884bdabaf0658943ac339b
License: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/ . No endorsement is implied.

Files: assets-src/upstream/lancer-evolution-ix.fbx, assets-src/tuner-sedan.blend, dist/assets/tuner-sedan.glb and tuner-sedan.json.

Adaptations: scale and upper-body proportions, interior simplification, new PBR materials, red five-spoke wheel faces, stationary caliper accents, wheel pivots and original skull/claw vinyl. Full provenance, source checksum and retained license metadata are in assets-src/upstream. The source author describes some deviations from the real car.

## Poly Haven textures

Files: dist/assets/asphalt.jpg, asphalt-normal.jpg, brick.jpg and brick-normal.jpg.

Sources: https://polyhaven.com/a/asphalt_01 and https://polyhaven.com/a/brick_wall_001

License: CC0, https://polyhaven.com/license . Photo texture color and normal maps at 1K resolution. Asphalt and brick repeat and material adjustment happen in the renderer. Credit is included voluntarily.

## Three.js 0.180.0

Files: dist/vendor/build and dist/vendor/examples.

Source: https://github.com/mrdoob/three.js

License: MIT, complete text retained in dist/vendor/LICENSE.

## Original work

Harbor Run game logic, circuit design, Blender authored city geometry, generated material and foliage textures, interface, generated signs and synthesized sound were created for this project. No Need for Speed extracted code, music, vehicle models, textures, tracks or video footage are bundled. The independently authored vehicle base above is included under its stated license. Car photographs and the supplied screenshot informed proportions; their pixels and logos are not textures in the game. The supplied video was available only through a partial automated scene analysis, not full playback.

## Poly Haven daylight environment

File: dist/assets/daylight.hdr.

Source: https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky

License: CC0, https://polyhaven.com/license . The 2K HDR image supplies the sky and material reflections. Original asphalt and brick maps are also embedded in the Blender GLB exports. road-worn.jpg is a modified version of Asphalt 01 with generated cracks and pockmarks.

Blender is an authoring tool and is not distributed in this source package. Editable scene and generated models are included.

## Original vehicle vinyl

assets-src/textures/sedan-vinyl.png is an original AI-generated transparent skull/claw graphic created for Harbor Run, not extracted game artwork. The authoring prompt is retained in assets-src/textures/sedan-vinyl-prompt.txt. The PNG is embedded in the runtime GLB and packed into the Blender scene.
