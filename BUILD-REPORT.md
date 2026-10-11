# Harbor Run 1.4.0 verification report

Date: 2026-10-11.

## Result and reference alignment

The earlier city and licensed sedan followed a different visual reference. This release replaces them with three original Blender vehicles and thirteen original scenery/road prototypes, using the supplied Hot Pursuit MP4 as the active direction. Forest and alpine settings now provide conifers, rock banks, layered mountain terrain, shoulders, guardrails, utility poles/cables, wet highway surfaces and a forest waterfall feature. Garage selectors choose body and setting, and validate/persist both choices.

All current car and world GLB geometry is built from original Blender surface sections and primitives. No downloaded geometry or game-extracted assets are read by the builders. The preview script appends only the resulting original `.blend` files. Existing credited asphalt/daylight maps remain. The retired sedan/FBX and city geometry are absent from this source snapshot and recoverable through earlier Git versions.

The video was decoded locally: 1280 × 720, approximately 59.94 FPS, 965.293 seconds. Ninety-seven samples across its full duration were inspected, including blue hypercar forest driving, red open-roadster mountain driving and police-car forest driving. This is sampled visual analysis, not review of every frame. Hidden geometry, exact vehicle identity and unseen road sections cannot be established from that footage.

## Geometry and scene validation

| Runtime vehicle | Dimensions, width × height × length (m) | Triangles | Wheels |
| --- | --- | --- | --- |
| Mid-engine hypercar | 2.271 × 1.160 × 4.600 | 74,726 | 4 |
| Open road spyder | 2.251 × 1.170 × 4.600 | 73,460 | 4 |
| Road interceptor | 2.290 × 1.323 × 4.600 | 80,790 | 4 |

Widths include mirrors. Length is normalized to the existing 4.6 metre game contract. Tires meet the ground within 3 mm. Lamp bounds verify +Z front and −Z rear. Open wheel arches, separate stationary calipers, round tires, cabin detail, front projectors, rear LED rings, exhausts and aero parts survive export and preparation. Paint and brake materials belong to individual instances.

| Setting | Scenery placements | Kit draw batches, including terrain/road | Instanced triangles |
| --- | --- | --- | --- |
| Forest | 1,073 | 19 | 3,293,736 |
| Alpine | 1,072 | 14 | 3,269,096 |

These figures exclude cars, dynamic skids, signs and HUD. Placements are deterministic. Bounds at corners, edge midpoints and centers remain beyond the driving corridor. Terrain stays below every track sample. Both settings use the unchanged original two-lap circuit and checkpoints.

## Completed checks

- `npm test`: 12 driving tests pass for acceleration, reverse, resources, collisions, ordered checkpoints, reset, pause, records and complete legal races.
- `npm run check:model`: 9 asset/actual-scene tests pass plus all three GLB assertions. Coverage includes selected body, diverse rivals, pivots/steering/spin, paint isolation, brake lamps, boost, contact shadows, cameras, skids, restart disposal and a complete race. GPU render calls are replaced.
- `npm run check:world`: thirteen GLBs load with finite geometry, expected bounds and triangle totals. Both placement sets leave the road clear. Original cutout foliage retains opacity maps. Three actual theme switches release old roots and preserve shared geometry/materials. Legacy paint/records survive, defaults are valid, and unknown body/setting values are rejected.
- `npm run check`: ten runtime modules parse; local imports, UI IDs, all referenced exports and hosting configuration resolve.
- `scripts/check-images.py` with Pillow decodes 11 external and 29 embedded runtime images. The original needle maps are 512 × 256 RGBA, cover 45.5 percent of the atlas and retain transparent gaps.
- Eighteen Blender Cycles vehicle views and two composed circuit views were inspected. Body face winding/arch cuts and mirrored police text were corrected. Sparse foliage, uniform bough placement and per-face terrain material seams were corrected before release.
- `git diff --check` passes. Editable scenes, source scripts, measured manifests and Windows rebuild entry point are included. The shipped static directory is approximately 31 MB; transfer and GPU memory depend on loaded/cached assets.

## Editable deliverables

Three vehicle `.blend` files, thirteen scenery/road `.blend` prototypes and two composed circuit `.blend` files are packed with their textures. Vehicle scripts use no external meshes. The included track/placement inputs make Blender rebuilding independent of Node. `Rebuild-Blender-Assets.ps1` locates an existing Windows Blender installation or accepts an explicit path. Blender 4.5.3 CLI generation/rendering was executed here; the Windows wrapper was reviewed but not run on a Windows machine.

Previews are in `assets-src/vehicles/vehicle-catalog.jpg`, individual car view directories and `assets-src/wilderness/forest-scene.png` / `alpine-scene.png`. They are authoring renders, not browser screenshots. Blender uses path-traced lighting, while the browser uses Three.js environment reflections and shadows.

## Verification limits

The managed workspace lacks the supported browser-control capability required for Sites preview. Browser GPU rendering, texture upload, transparency sorting, FPS, physical gamepads and the final responsive layout were not exercised. Node bitmap metadata and render stubs do not establish those outcomes. Static UI bindings/styles were reviewed; publication verifies delivery, not rendered quality.

This is an original approximation of the visible car families and forest/alpine atmosphere, not an exact commercial model/map clone or verified AAA result. Wet-road reflections use the daylight environment; dynamic reflection of nearby cars/trees is absent. Police pursuit AI, career, tuning and touch driving remain outside this circuit.

On the target PC, reload the game, select each vehicle/setting, inspect front/side/rear and glazing, drive both laps, and compare high/reduced graphics. Check the actual GPU frame rate and gamepad behavior there.
