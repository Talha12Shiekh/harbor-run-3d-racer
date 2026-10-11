# Harbor Run 1.3.0 verification report

Date: 2026-10-11.

## Outcome and root cause

The earlier upgrade chose a low coupe, while the latest reference is a four-door tuned sedan. This was an incorrect geometry choice. The new release adapts Benit Kibabu's independently authored Lancer Evolution IX under CC BY 4.0, retaining its source FBX, attribution, license metadata and checksum. No extracted Need for Speed assets are included.

The adaptation preserves sculpted panels, handles, window frames and interior. It adds physical materials, red five-spoke wheel faces, stationary caliper accents and original skull/claw vinyl. Rally gold is the new-profile default; existing validated paint choices and records remain.

Two authoring failures were reproduced and fixed: replacing material slots reset face assignments, and joining differently named UV layers put decals at the transparent texture origin. Face indices are now retained and UV layer names unified. A regression check validates meaningful decal coordinates and exact preservation through the game preparation function.

## Completed checks

- `npm test`: 12 driving tests pass, covering checkpoints, reset, pause, collisions, resources, records and complete legal races.
- `npm run check:model`: 9 asset and actual scene tests pass, plus model assertions. Coverage includes UV preservation, pivots, wheel steering/spin, calipers, paint isolation, brake lamps, boost, contact shadows, restart disposal, cameras, skids and complete race updates. The GPU render call is replaced.
- Prepared sedan: 24 meshes, 239,849 triangles, dimensions 2.030 by 1.463 by 4.600 metres, glazing opacity 0.44. Tires meet the ground within 3 mm. Front is positive Z. Four restarts release owned resources once while preserving shared assets.
- `npm run check`: ten modules parse, imports and UI bindings resolve, assets exist and hosting is configured.
- `npm run check:city`: ten city GLBs parse with finite geometry and UVs. Placement remains 295 instances, 63 batches and 1,084,340 instanced triangles. Minimum building-corner distance to road center is 13.61 metres, beyond the 9.5 metre half-width. The 2048 by 1024 HDR decodes.
- Pillow decodes 29 external textures and 47 embedded runtime GLB images. Original vinyl is 2172 by 724 RGBA with alpha range 0 to 255.
- Six Blender 4.5.3 Cycles renders are inspected: direct front/rear, both sides and two three-quarter views. They verify authoring, not game GPU rendering. See assets-src/sedan-six-views.jpg.

## Video and scene presentation

The earlier supplied MP4 was decoded locally: 1280 by 720, approximately 59.94 FPS, duration 965.293 seconds. 97 frames sampled across its full duration were inspected in seven contact sheets. This is not a claim of manually reviewing every frame. The new duplicate ending in (1).mp4 did not reach the workspace and was not used.

The footage shows forest free drive, a mountainous interception event and a police pursuit, with menus and results. Its low chase viewpoint, readable lamps, coherent reflections and worn surfaces inform this city presentation. The latest sedan screenshot defines the car; the video's supercars do not replace it.

The camera is lower and closer with gentler speed-dependent FOV. Ambient/direct fill is reduced, shadow bias tightened and fog neutralized. An original periodic roughness map and modest road clearcoat vary surface sheen. Road reflections come from the daylight environment; planar or screen-space reflection of nearby cars/buildings is not implemented. City layouts and driving rules remain.

## Limits and manual checks

The managed workspace lacks the browser-control capability required by Sites preview. Updated browser visuals, GPU texture upload, transparency sorting, FPS and physical gamepads were not tested. Node uses a bitmap metadata stub. Decoded images and Blender renders do not prove GPU appearance. Publication proves delivery, not exact reference similarity or AAA quality.

Reload, select Rally gold, inspect front/rear/side presentation, glass, wing, lamps and vinyl, then drive both laps. Check rear view, wheel motion, braking, boost, pause/restart and saved records. Compare high/reduced graphics and measure FPS on the target computer. Police modes, career, more bodies, terrain routes and touch driving remain outside this correction.
