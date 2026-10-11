# Harbor Run build report

Date: 2026-10-11, vehicle upgrade 1.2.1.

The user played the first published circuit and reported that it was playable, but the environment looked too simple. The supplied comparisons guided this upgrade. This report distinguishes the new asset and simulation checks from live GPU validation.

## Passed

`npm test`: 12 tests passed, zero failures. Coverage includes route continuity, driving bounds, nitrous and Speedbreaker, road boundaries, car separation, legal checkpoint crossings, reset, pause, validated records and a complete race with three rivals plus four traffic cars.

`npm run check`: ten JavaScript modules parse, local imports and static UI bindings resolve, required assets exist and static hosting points at dist.

`npm run check:model`: the new Harbor Coupe GLB parses with the game's preparation code. It contains 32 merged meshes, 111,824 triangles and four wheel groups, with finite coordinates. Dimensions are 2.202 metres wide including mirrors, 1.362 metres tall and 4.6 metres long. The body is approximately 1.93 metres wide. Tire bottoms are within 3 mm of the ground plane. Wheel spin preserves pivot centers, axle direction is correct, calipers stay fixed, paint is isolated between cars, vinyl remains untinted and rear lamps stay red. The front lamps face positive Z and the rear lamps face negative Z. Glazing opacity is 0.36 and the authored material settings survive preparation.

`npm run check:city`: all ten Blender GLBs parse with finite positions, normals and UVs, expected mesh and triangle counts, and bounds matching their exported metadata. Deterministic placement produces 295 scenery instances using 63 material batches and 1,084,340 instanced triangles. Nearby building bounds, including façade overhangs, remain at least 13.61 metres from the road center. The playable road is 19 metres wide. Cutout foliage uses matching alpha tested shadow materials. The HDR loader decodes the 2048 by 1024 daylight environment.

Pillow decoded 25 source and runtime texture files and 60 embedded GLB images. The foliage atlas contains 85.3 percent transparent pixels and 14.7 percent opaque leaf pixels. Model tests use a bitmap metadata stub in Node, so the separate Pillow checks validate image decoding; neither proves GPU upload.

Actual Blender 4.5.3 LTS authored and exported the kit and saved its editable scene. A 1280 by 720 Cycles verification render was inspected. A preview placement rotation error was corrected, and the revised render has no floating roof equipment. This image is an asset authoring render, not a game screenshot. Its camera and lighting differ from the game.

## Not exercised

Updated browser rendering, GPU texture upload, measured FPS and actual controller hardware were not tested. The managed environment lacks the browser control skill required by the Sites preview workflow. No substitute browser was started. The user playtested the first release; that does not verify this upgrade. Successful deployment proves publication, not reference similarity or photorealism.

## Manual verification

Reload the published game and inspect the five architecture styles, leafy trees, industrial pipe bridges, daylight sky, worn surfaces, car reflections and tire contact. Compare high and reduced graphics on the intended laptop and measure frame rate. Drive both laps, check controls, pause and resume, reset, rear view, finish and retained records. Confirm that foliage shadows have gaps and there are no missing textures or street obstructions.

Police pursuits, career, upgrades, more cars and touch driving remain outside this circuit upgrade. Editable Blender sources, deterministic texture generation, export scripts and asset credits are included.

## Vehicle authoring verification

Blender 4.5.3 LTS exported the new coupe and saved the editable scene. Two 1200 by 800 Cycles renders were inspected. The first pass exposed opaque glass and lenses; the Blender Alpha input and exported blend mode were corrected. Rear wing supports were grounded on the trunk and the interior was finished with dark trim and seats. Both embedded images (64 by 64 carbon weave and 2048 by 512 RGBA vinyl) decode with Pillow. Glass, lamp lenses and vinyl have exported BLEND alpha modes. The source textures and render images also decode.

These renders verify the authored asset, not its appearance in the running game. Updated browser rendering, transparency sorting, subjective reference similarity and FPS remain manual checks. Inspect rear lamp visibility, paint choices, vinyl, cabin, wheel rotation and front steering after reloading the published game. Existing 12 simulation tests and city checks passed again. One vehicle model is used for all cars; distinct traffic bodies and selectable cars are later work.

## Vehicle runtime verification

Eight additional checks call the real World scene methods with the authored GLB and real Race simulation. Only the GPU render call is replaced. The checks cover steering across wheel spin phases, paint isolation, brake lamp activation and release, positions and contact shadows, boost visibility, repeated race restarts, chase and rear cameras, reduced motion garage camera, skid transforms and a complete legal race.

Two checks initially failed. The default XYZ rotation order tilted a steered front wheel axle as the wheel spun. The wheel now uses YXZ so steering turns the axle while spin leaves it level. Restarting previously removed scene objects without disposing the resources unique to each car. It now releases cloned paint and brake materials, flame geometry and material, and contact shadow geometry and material. Each restart releases 48 old resources exactly once and preserves shared car geometry, materials and textures. Four repeated restarts retain eight cars and eight shadows with no old scene objects.

All eight runtime checks pass after these corrections. The existing twelve driving tests, static source check, model geometry checks and city asset checks also pass. Browser appearance, GPU memory measurements and FPS remain unverified. The restart checks validate disposal events and ownership, not a GPU memory profile.
