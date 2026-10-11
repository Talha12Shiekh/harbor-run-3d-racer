# Harbor Run build report

Date: 2026-10-11, visual upgrade 1.1.0.

The user played the first published circuit and reported that it was playable, but the environment looked too simple. The supplied comparisons guided this upgrade. This report distinguishes the new asset and simulation checks from live GPU validation.

## Passed

`npm test`: 12 tests passed, zero failures. Coverage includes route continuity, driving bounds, nitrous and Speedbreaker, road boundaries, car separation, legal checkpoint crossings, reset, pause, validated records and a complete race with three rivals plus four traffic cars.

`npm run check`: ten JavaScript modules parse, local imports and static UI bindings resolve, required assets exist and static hosting points at dist.

`npm run check:model`: the actual car GLB parses with the game's preparation code. It contains 41 merged meshes, 213,229 triangles, four wheel groups and finite coordinates. Dimensions are 2.684 metres wide, 1.213 metres tall and 4.6 metres long. Tire geometry now determines the ground plane, and all four wheel bottoms are within 3 mm of it. This fixes the gap caused by using transformed bounding boxes for ground height.

`npm run check:city`: all ten Blender GLBs parse with finite positions, normals and UVs, expected mesh and triangle counts, and bounds matching their exported metadata. Deterministic placement produces 295 scenery instances using 63 material batches and 1,084,340 instanced triangles. Nearby building bounds, including façade overhangs, remain at least 13.61 metres from the road center. The playable road is 19 metres wide. Cutout foliage uses matching alpha tested shadow materials. The HDR loader decodes the 2048 by 1024 daylight environment.

Pillow decoded 25 source and runtime texture files and 60 embedded GLB images. The foliage atlas contains 85.3 percent transparent pixels and 14.7 percent opaque leaf pixels. Model tests use a bitmap metadata stub in Node, so the separate Pillow checks validate image decoding; neither proves GPU upload.

Actual Blender 4.5.3 LTS authored and exported the kit and saved its editable scene. A 1280 by 720 Cycles verification render was inspected. A preview placement rotation error was corrected, and the revised render has no floating roof equipment. This image is an asset authoring render, not a game screenshot. Its camera and lighting differ from the game.

## Not exercised

Updated browser rendering, GPU texture upload, measured FPS and actual controller hardware were not tested. The managed environment lacks the browser control skill required by the Sites preview workflow. No substitute browser was started. The user playtested the first release; that does not verify this upgrade. Successful deployment proves publication, not reference similarity or photorealism.

## Manual verification

Reload the published game and inspect the five architecture styles, leafy trees, industrial pipe bridges, daylight sky, worn surfaces, car reflections and tire contact. Compare high and reduced graphics on the intended laptop and measure frame rate. Drive both laps, check controls, pause and resume, reset, rear view, finish and retained records. Confirm that foliage shadows have gaps and there are no missing textures or street obstructions.

Police pursuits, career, upgrades, more cars and touch driving remain outside this circuit upgrade. Editable Blender sources, deterministic texture generation, export scripts and asset credits are included.
