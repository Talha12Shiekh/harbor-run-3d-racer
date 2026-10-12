# Harbor Run 1.9.0 verification report

Date: 2026-10-12.

## Vehicle destruction and roadside breaches, 1.9.0

Strong impacts now accumulate independent front/rear/left/right damage using actual contact energy and mass. The original body meshes are partitioned without dropping or adding intact triangles. Each car owns its deformed geometry and material state; templates and other cars remain unchanged. Panels crumple locally, trim and lamp housings follow, glazing cracks and shatters into smaller actual mesh pieces, and bumpers, hoods and side panels detach. An exposed chassis/radiator appears after front panels are removed. Wrecked driving cuts powered acceleration and engine sound; lesser front damage reduces acceleration.

Original Blender masonry sections and chipped blocks join the instanced scenery. Masonry and steel rails use stable placement IDs shared by physics and rendering. Distinct low energy hits accumulate damage and deflect the car. Strong hits remove the matching instances, emit actual masonry/steel pieces, and preserve enough motion to pass through the gap. Openings persist after R recovery. Hard car contacts apply bounded lateral and angular motion, including a tested side impact that pushes a recipient through a masonry section.

The active race uses placed barriers rather than the old road clamp. Beyond the verge, body height follows gravity and the authored bank/height map, with roll/pitch support, landing rebound and drag. Ground landings emit the existing impact feedback. Cockpit and Hood inherit body rotation and up vectors; exterior view selection remains stable. Airborne, offroad and wrecked travel cannot grant gates or pursuit escape. R repairs and recovers the car while retaining openings and progress. A new event restores the barriers. NPC wrecks recover through the existing stuck interval. The existing unboxed HUD shows a compact recovery hint.

Actual detached pieces expire after eight simulation seconds, capped at 24 car pieces and 64 barrier chunks. Pause freezes them, and eviction, expiry, garage, scenery change and new events release owned geometry/materials. Shared templates, maps and effect resources survive. Broken masonry selects a new original crunch/rubble waveform under the existing ten-voice sound budget.

### Verification for 1.9.0

* `npm test`: 68 behavior checks pass, including ten new destruction physics checks, actual recovery HUD handling, wreck engine muting and masonry audio dispatch. All five cars still complete legal Circuit races and physically escape Pursuit; a stopped driver is caught and busted.
* `npm run check:model`: 25 real scene/geometry checks pass. All five complete intact triangle counts match their asset manifests. Local crumpling, template/rival isolation, actual panel detachment, glass shards, repair, body/camera transforms, debris caps and exactly-once resource disposal are checked. The GPU render call is replaced; this does not establish browser visuals or FPS.
* `npm run check:world`: all 17 scenery exports, deterministic placements, clear driving corridor and five actual theme switches pass. Section coordinates match physics. Breaking hides the real matching instances and reset restores their original transforms. The three themes contain 1073/1072/1105 placements and 400/303/466 scenery draw batches respectively; visibility culling affects actual rendered draws.
* `npm run check`: 22 runtime JavaScript modules parse; local imports, assets, UI bindings and hosting resolve. `git diff --check` is clean.
* Three original prototypes were authored and exported with Blender 4.5.3's Python runtime: masonry barrier, chipped block and exposed crash frame. All 26 editable Blender scenes are included. The five accepted exterior car GLBs retain their original bytes and intact shape.
* Eight Blender CPU renders use the actual prepared/deformed runtime meshes, comparing intact, front dent, front wreck and side wreck from two angles. The inspected contact sheet is `assets-src/wilderness/destruction-preview.jpg`. This caught and corrected radiator visibility after side damage and prompted smaller glazing shards. These are authored mesh visual checks, not browser screenshots.
* Internet research inspected two vehicle/barrier crash images and eighteen samples across the first 54 seconds of a publisher BeamNG trailer, alongside primary mesh-splitting and physics guidance. This is sampled visual research; no claim of every frame or audible review is made. No reference media or commercial mesh/audio is shipped.

Browser GPU rendering, shader compilation, audible balance, physical controllers and actual FPS remain hardware checks. Supported browser preview is unavailable and the prior cloud browser reported WebGL Disabled. This is bounded arcade deformation and fracture, without a full soft body chassis, tire detachment or gameplay collision with loose debris. Destruction adds temporary draw and memory cost; the caps bound work but do not prove FPS.

## Collision feedback, 1.8.0

The previous small circular car collider detected bumper contacts after substantial visual overlap. Its decaying impact flag only added a little background noise. Contacts now use a 4.56 by 1.96 metre oriented rounded footprint, with the actual point, normal, closing speed and sliding speed sent through a capped, drained event queue. Momentum remains mass weighted with restitution .15. Parallel contact does not repeatedly reduce speed, and stationary overlap is silent.

Short warm spark streaks, small spinning fragments and soft dust spawn at that point and inherit contact motion. Fixed pools hold 192 sparks, 48 fragments and 40 dust particles. Three shared draw objects and one short, shadowless local light survive restarts. Particles fall, bounce and expire. Player body/camera recoil is bounded; cockpit movement is smaller. Reduced graphics halves emission, and reduced motion suppresses camera movement and flash. Simulation elapsed governs visible effect progression, so pause freezes it and Speedbreaker retains its timing.

Original cached sound buffers combine body thump, crunch, damped metallic partials and delayed small fragment transients. A continuous scrape loop responds to recent sliding contact and fades without it. Stereo position uses the actual camera right vector, while volume follows strength, distance and the saved sound level. At most ten impact voices coexist; ended or stopped voices disconnect. Pause, recovery, garage and restart clear transient audio. No commercial sound or reference imagery is shipped.

The first pursuit regression showed the new earlier contact could let a patrol accelerate a stopped player above the bust threshold. Its final approach now slows over the last few metres, preserving the existing stopped bust and driving escape behaviors. The older circle separation and scene object count assertions were updated for the new footprint and one reusable effect group, retaining penetration and ownership checks.

### Verification for 1.8.0

* `npm test`: 55 behavioral tests pass, including 11 contact/particle/audio checks and a new actual frame dispatch/recovery check. All five cars still complete Circuit and escape Pursuit; a stopped player is physically caught and busted.
* `npm run check:model`: 20 actual scene/geometry tests pass, including new particle buffer, pause, ownership and camera recoil checks across all five views and rear hold. Only the GPU render call is replaced; this is scene integration evidence, not rendered screenshots.
* `npm run check:world`: all 14 scenery exports and five real theme switches pass, with the driving corridor clear and ownership preserved.
* `npm run check`: 20 JavaScript modules parse; local imports, assets, UI bindings and hosting configuration resolve. `git diff --check` is clean.
* Original sound buffers at 22050, 44100 and 48000 Hz are deterministic, finite, bounded and fade at their ends. Stereo, volume, voice eviction, natural end cleanup and scrape expiry are checked with an AudioContext fixture. This does not prove audible sound quality.
* Internet research directly inspected two collision images, 17 samples across a decoded 33.2 second publisher trailer, and 12 closer samples from its 25 to 29 second crash sequence. This establishes reference timing/composition only. The YouTube montage could not be retrieved; no claim of hearing its audio is made.

GPU shader compilation, rendered particle appearance, audible impact balance, physical controllers and actual FPS remain browser/hardware checks. The supported browser preview is unavailable here and the previous cloud browser reported WebGL Disabled. Existing exterior/scenery assets and all 23 editable Blender scenes remain unchanged. These are arcade contact effects, without full chassis deformation or rolling wreck physics.

## Title and HUD composition, 1.7.2

The supplied title screenshot showed a nearly opaque rectangular card over the car. The wordmark, copy and primary action now sit directly in the left space, with smooth scene shading and plain frame labels. The title content is narrower, and the existing bright car image remains. On narrow screens the image occupies the upper portion and copy sits lower over a bottom fade.

The supplied gameplay screenshot showed large rectangular backings around position, time, map, speed, countdown and control hints. Those rectangles are removed. Feathered edge shading, text shadows, a smaller speed arc with a soft radial wash, thin resource meters and a brighter outlined map route support the readable labels. The camera/recovery/rear/pause row has a small camera mark, outlined key badges and fine separators. Buttons retain 44 pixel targets and visible focus, hover and pressed states. Tracking angle buttons show directional arrows while retaining bracket shortcuts and existing handlers.

The official EA Hot Pursuit Remastered manual, page 7, informed the perimeter instrument hierarchy. No commercial reference image is shipped. Physics, event state, view presets, settings, the original title artwork, all vehicle/scenery GLBs and 23 editable Blender scenes are retained. No dependencies were added.

### Verification for 1.7.2

* All 11 actual menu/input/camera handler tests pass in the DOM fixture. This verifies behavior, not rendered appearance.
* Source and local asset checks pass. CSS delimiter/custom property checks and `git diff --check` pass.
* Local font measurements put HARBOR at 333.1 pixels at the 118 pixel cap, below the 340 pixel title width. At the short desktop size it is 293.6 pixels, and at the narrow size it is 214.5 pixels. The two 16 pixel body lines are 261.1 and 260.4 pixels, within the narrow 300 pixel content area. These are font metrics, not browser layout measurements.
* The optional performance readout moves below the event timer on smaller screens to avoid the new control row and lower instruments.

The last cloud browser attempt reported its WebGL renderer as Disabled. Actual rendered appearance, including scene contrast and responsive fit, remains a browser check. The numerical contrast evidence for the preceding boxed 1.7.1 design below is historical and does not establish contrast for this new gradient design.

## Readability update

The supplied Alpine HUD screenshot showed 8 to 10 pixel supporting labels directly over bright scenery. Camera, R reset, C rear view and pause now share one dark dock with visible key badges. Circuit/Pursuit status, time, map and speed/resources have their own backing panels. Small displays change the instrument geometry instead of scaling down the whole panel and its text. Action labels are 14 pixels on desktop and 13 pixels on the smallest displays. HUD supporting labels are at least 12 pixels.

The supplied pause screenshot showed small muted secondary actions. Pause, results and error use 16 pixel body/action text and bright foregrounds. Restart and return actions now have filled button surfaces. Controls references use 14 to 15 pixel text; settings labels/selects and credits use 16 pixels. Title copy and edition/footer labels have backing surfaces. Garage labels and captions are larger while retaining compact desktop geometry and smaller-screen scrolling.

The original local fonts, artwork, models, physics, input mappings, camera selection and storage behavior are retained. The HTML preserves existing action IDs; only the HUD grouping and key badge markup change. No dependency, additional image or model was added.

### Verification for 1.7.1

* `node --test tests/menu-flow.test.mjs`: all 11 actual app handler tests pass. This includes menu arrows, gamepad direction edges/neutral release, camera cycling, held rear restoration, angle adjustment, native dialog input and profile restoration. It is a DOM fixture, not a rendered browser.
* `npm run check`: all 16 JavaScript modules parse; UI IDs, local imports, images/fonts/GLBs and hosting configuration resolve.
* Ten color calculations read the actual final CSS tokens. The lowest tested normal-text contrast is 7.77, above this enhancement's 4.5 target. The translucent HUD is tested over white as the brightest backing case. Main dialog text is 16.49; supporting dialog copy is 12.73; button labels are 12.24; HUD supporting text over white is 12.75. These calculations do not certify the whole interface or establish layout.
* CSS delimiter and custom property reference checks pass. The standalone CSS parsers were unavailable, so this is lexical verification, not browser CSS evaluation.
* Local font metrics caught a title wordmark that would exceed the padded card width. The title now uses a capped size with smaller sizes on short/narrow displays. Garage cards reserve space for the larger caption line, rather than clipping it beneath the image. A final sizing calculation also found that the larger briefing text needed tighter spacing on short wide desktops. Its heading/intro now use single lines from 600 to 740 pixels tall, with compact margins and 14 pixel control text. This is a layout estimate; rendered fit remains a browser check.
* `git diff --check`: clean. Existing car/scenery GLBs and all 23 editable Blender scenes are unchanged.

The prior 1.7.0 behavioral and scene evidence below is retained. The following 43 and 18 test totals were last rerun before this typography update; the targeted 11 handler checks above were rerun for this update.

## Driving cameras and onboarding

Five persistent driving presets now work in Circuit and Pursuit: Chase, Wide chase, front three quarter Tracking, Hood and Cockpit. V/LB or the HUD button cycles them. Brackets or angle buttons rotate Tracking. C/RB temporarily looks behind without changing the selected view. View changes do not reset or modify the simulation. Interior changes snap rather than interpolating through the body. Reduced motion suppresses corner look.

The new original Blender cabin has 24,892 triangles: stitched leather, brushed alloy, vents, console, instrument shroud, wheel controls and emissive dials. Real steering animates the wheel; real speed and a speed/gear estimate animate the needles. Per-body driver eyes and lifts keep the controls visible. Close windshield trim follows the eye; the spyder omits its header. No additional render or mirror pass is introduced. A final projected-marker regression found the wheel animation direction was reversed from the driver camera. Its Z rotation is now negated, and the real marker projects toward the matching steering side for both inputs, all five bodies and four headings.

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
* `git diff --check`: clean. The 1.7.0 runtime was 39,310,856 bytes (37.5 MiB), including the local cabin and title artwork. The current readability patch changes HTML/CSS and the version label only. No new dependencies or remote runtime requests were added.

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

Supported control-browser preview is unavailable in this managed workspace. The preceding explicit cloud browser attempt loaded the live game but reported GL_VENDOR and GL_RENDERER as Disabled, and displayed the WebGL startup error. Browser GPU shading, texture upload, transparency sorting, responsive menu appearance, physical gamepads, audible siren balance and FPS remain unverified. Node timings, camera geometry and fixtures cannot establish those outcomes.

For hardware verification, select each car and scene, drive left/right and reverse, try both events, use pause/recovery/restart, and switch High/Reduced/Auto with the FPS overlay enabled. Check all five camera presets, bracket rotation, held rear restoration, front/rear/side garage inspection, night road visibility, arrow-key focus/choices and one-view garage/briefing fit at 1363 × 652, 1100 × 600 and a smaller display. Check native dialogs and held gamepad menu input before accelerating. Compare frame rate on the same route before judging GPU performance.

Reference similarity remains an approximation of the supplied footage/photos. Reflections are environment based; dynamic nearby car/tree reflections are absent. Career, upgrades, player tuning, more routes and touch driving remain future work.
