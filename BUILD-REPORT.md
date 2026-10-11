# Harbor Run 1.7.0 verification report

Date: 2026-10-11.

## Driving cameras and onboarding

Five persistent driving presets now work in Circuit and Pursuit: Chase, Wide chase, front three quarter Tracking, Hood and Cockpit. V/LB or the HUD button cycles them. Brackets or angle buttons rotate Tracking. C/RB temporarily looks behind without changing the selected view. View changes do not reset or modify the simulation. Interior changes snap rather than interpolating through the body. Reduced motion suppresses corner look.

The new original Blender cabin has 24,892 triangles: stitched leather, brushed alloy, vents, console, instrument shroud, wheel controls and emissive dials. Real steering animates the wheel; real speed and a speed/gear estimate animate the needles. Per-body driver eyes and lifts keep the controls visible. Close windshield trim follows the eye; the spyder omits its header. No additional render or mirror pass is introduced.

A forward ray check initially failed because the merged hypercar roof covered the driver view. At load time, original painted roof triangles are separated into a visibility group. Cockpit hides that group, the original cabin and opaque-looking exterior glazing. Every outside view restores them. The five accepted exterior GLBs and their exterior triangle totals, bounds and silhouette are unchanged. The split adds one exterior mesh for each closed body; shared cabin geometry/materials survive restarts.

Title and briefing use a brighter original blue car image with a restrained left scrim and local Barlow display fonts. The exact builtin Imagegen prompt and original-car reference are documented in `assets-src/title-art-prompt.txt`; `dist/assets/ui/title-v2.jpg` is marketing artwork. Existing car and setting thumbnails remain Blender renders. The screenshot's 330 px stretched car images now have explicit 44 px heights, 62 px cards and no bottom padding that would crop their labels. Desktop layout has a compact three-row garage at 1100 × 600 and larger; smaller displays keep scrolling. The briefing presents six driving/menu control cards together.

Arrows navigate real choice groups; Left/Right selects through the same handler as clicking. Enter confirms the focused action. Gamepad D pad/stick navigate on direction edges and A confirms. Held menu controls must return to neutral before driving. Native dialog controls retain their arrow behavior, and closing a dialog restores focus to its trigger. Camera ID/yaw validation preserves the existing profile key and records.

## Retained gameplay and performance work

The following steering, handling, pursuit and scenery optimization findings were established for 1.6.0 and retained. Their Node measurements are historical evidence, not newly measured browser FPS.

Driver steering was reversed relative to the real chase camera. Vehicles face positive Z, so the camera behind them has screen right toward negative X. Left/A and the left stick now increase world heading; right/D and the right stick decrease it. A regression first failed against the old actual app handler, then passed after the mapping fix. Actual Three.js camera projections verify both directions at four compass headings. Reverse uses the same wheel steering geometry.

Every body now has its own acceleration, speed limits, braking, wheelbase, steering response, grip, drift and collision mass from dist/handling.js. Vehicle IDs govern both physics and the original Blender mesh, including saved selection and restarts. These are original arcade balance values, not manufacturer specifications. The accepted five exterior body scenes remain unchanged; the new cabin increases the source total to 23 editable Blender scenes.

The garage offers Circuit and Pursuit. Circuit keeps two ordered laps, three rivals and four traffic cars. Pursuit has traffic and an initial interceptor, with reinforcements at 20 and 45 simulation seconds. Active officers follow the road, intercept the player's lane and physically collide; they never teleport. Inactive officers do not render or collide. Police lamps flash during day and night. Synthesized siren level follows contact distance and stops outside active pursuit.

Heat, active patrol count, contact distance, escape and bust meters come from the simulation. Escape requires eight uninterrupted seconds beyond 120 metres after 20 seconds elapsed, with absolute speed over 6 m/s. Bust requires four seconds below 5 m/s within 10 metres of a patrol. Pause freezes the event. Pursuit recovery centers the player on the current segment, clears escape progress, retains bust progress and leaves police unchanged. Escape and bust results show actual event time and peak heat. Best escape is separate from existing lap/race records.

Full driving runs found a repeated contact penalty that could trap touching cars. Collision response now exchanges closing momentum with mass weighted separation and restitution .15. Parallel contact no longer removes .3 m/s every timestep. Patrol pace and corner braking were tuned with full driving runs. All five cars can physically escape without assigning positions or disabling officers. A stopped player can be caught and busted by officers driving to them.

## Measured scene workload

The benchmark loads the actual scenery GLBs, installs all placements and samples 48 chase camera poses per theme using real Three.js frustum math. It measures submitted scenery geometry, not GPU time. Cars, signs, lights, skids, shadow passes and HUD are excluded from this geometric comparison.

| Setting | Mean camera triangles before | Mean camera triangles after | Reduction | Mean camera batches before / after |
| --- | --- | --- | --- | --- |
| Redwood Ridge | 3,281,149 | 1,095,178 | 66.6% | 17.0 / 107.7 |
| Summit Pass | 3,269,096 | 1,116,193 | 65.9% | 14.0 / 81.3 |
| Midnight Run | 3,371,133 | 1,122,090 | 66.7% | 20.0 / 126.3 |

Scenery is grouped into 96 metre spatial cells instead of one circuit wide batch per asset. Every original instance and triangle remains in the installed world. Per cell bounds let the renderer exclude batches outside camera and shadow volumes. More visible draw calls are a tradeoff. GPU frame time benefit must be checked on hardware rather than inferred from triangle reduction alone.

| Setting | Unchanged placements | Spatial batches | Total installed triangles |
| --- | --- | --- | --- |
| Redwood Ridge | 1,073 | 357 | 3,293,736 |
| Summit Pass | 1,072 | 260 | 3,269,096 |
| Midnight Run | 1,105 | 423 | 3,383,720 |

The night pool retains four road spotlights and two player headlights. Nearest roadside lamps are selected every .2 seconds with a bounded nearest four pass rather than sorting/allocating vectors each frame. Repeated Node scene update timing changed from 12.60 to 7.49 microseconds per call after warmup. Host CPU timings vary and exclude GPU rendering. They are not browser FPS.

Auto graphics observes actual animation frame intervals. Three one second windows below 45 FPS reduce pixel ratio .15. Eight windows above 58 FPS restore .10. Ratio stays between .65 and the device cap up to 1.5. Shadows turn off at/below .8 and return at/above 1.0. High and Reduced remain fixed. Inactive screens and long hidden/stall intervals cannot tune quality. Settings can show actual FPS, renderer draw/triangle counters and resolution during play. Old profiles retain their selected graphics mode; new profiles default to Auto.

Baseline and final measurements are in docs/specs/0001-city-racer/performance.json. Reproduce final measurements with `node --loader ./tests/three-resolver.mjs scripts/benchmark.mjs`.

## Verification

* `npm test`: 43 tests cover prior driving/checkpoint/record rules, five distinct setups, five complete Circuit races, five physically completed escapes, an actual police bust, no active patrol teleportation, reinforcements, collision momentum, pursuit pause/recovery/results and profile compatibility. Actual app handlers exercise every car/setting combination into the matching Pursuit countdown. Keyboard directions, opposed inputs, stick dead zone, D pad and focus loss are covered. Auto timing/bounds and siren distance/mute/resource reuse are covered. Four added actual-handler tests cover all menu groups, gamepad direction edges/neutral release, every camera input path, temporary rear view, tracking rotation, saved camera restoration and native dialog input.
* `npm run check:model`: 18 actual scene tests plus all five GLB assertions. Actual chase projection at four headings, wheel steering from physics, active/inactive patrol meshes/lights, Auto shadows/resolution, grounding, finite transforms, hood lamp clearance, paint/brake isolation, restart ownership, night headlights, garage views and a complete legal Circuit are covered. Three added checks cover every driving preset on all five bodies at four headings, clear forward rays and visible controls in all five cabins, actual wheel/needle animation, held rear restoration, reduced motion and shared resources after restart. The GPU render call is replaced.
* `npm run check:world`: fourteen scenery/road/lamp GLBs retain finite geometry and expected materials/bounds/triangle totals. Three placement sets stay clear and grounded. Spatial batches retain every instance and triangle with limited bounds. Five actual theme switches preserve sky/reflections/light restoration and shared assets.
* `npm run check`: 16 modules parse; imports, UI IDs, vehicle/scenery/font/image assets and hosting configuration resolve.
* `git diff --check`: clean. Static runtime is 39,310,855 bytes (37.5 MiB), including the new local cabin and title artwork. No new dependencies or remote runtime requests were added.

The DOM fixture executes actual handlers and simulation but does not render browser layout. Audio fixtures verify parameters and muting, not audible quality.

## Original assets and source

The five Blender vehicles retain their checked shapes, front lamps, connected splitters, glazing, interiors and grounded wheels.

| Vehicle | Metres, width × height × length | Triangles |
| --- | --- | --- |
| Apex H1 | 2.284 × 1.167 × 4.600 | 92,129 |
| Strada S2 | 2.264 × 1.177 × 4.600 | 90,863 |
| Sentinel I3 | 2.304 × 1.331 × 4.600 | 97,509 |
| Kestrel R4 | 2.182 × 1.471 × 4.600 | 78,444 |
| Vanguard M5 | 2.187 × 1.336 × 4.600 | 78,776 |

Widths include mirrors. Five vehicle scenes, fourteen prototypes and three composed circuits plus the driver cabin make 23 editable .blend files. Original scripts, 30 vehicle views, scene previews, menu imagery, local OFL fonts and the Windows rebuild script remain included. This release adds a cabin and camera/menu behavior and does not regenerate accepted exterior models or scenery. Seven new Blender previews inspect all five driver placements, night instrument visibility and the front tracking pose on a simple road. Their lighting and environment are asset evidence, not WebGL gameplay captures. Commercial screenshots, downloaded meshes and gameplay frames are not shipped as assets.

## Browser checks still open

Supported control-browser preview is unavailable in this managed workspace. Browser GPU shading, texture upload, transparency sorting, responsive menu appearance, physical gamepads, audible siren balance and FPS remain unverified. Node timings, camera geometry and fixtures cannot establish those outcomes.

For hardware verification, select each car and scene, drive left/right and reverse, try both events, use pause/recovery/restart, and switch High/Reduced/Auto with the FPS overlay enabled. Check all five camera presets, bracket rotation, held rear restoration, front/rear/side garage inspection, night road visibility, arrow-key focus/choices and one-view garage/briefing fit at 1363 × 652, 1100 × 600 and a smaller display. Check native dialogs and held gamepad menu input before accelerating. Compare frame rate on the same route before judging GPU performance.

Reference similarity remains an approximation of the supplied footage/photos. Reflections are environment based; dynamic nearby car/tree reflections are absent. Career, upgrades, player tuning, more routes and touch driving remain future work.
