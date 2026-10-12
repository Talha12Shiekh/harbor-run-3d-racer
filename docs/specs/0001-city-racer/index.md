# 0001 City racer

**Status**: Implemented, 1.7.1; browser checks remain open in BUILD-REPORT.md
**Date**: 2026-10-11
**Authorized by**: User, Accept and build, then proceed with all remaining steps.

This restores the previously agreed spec after local workspace loss. It records the same accepted decisions.

## Requirements
AC-1: Browser based detailed 3D daylight city circuit with an imported sports car, photo textures, lighting and chase camera.
AC-2: Responsive arcade acceleration, brake, reverse, steering and handbrake with bounded road and car collisions.
AC-3: A real two lap race against three rivals with traffic, ordered checkpoints, elapsed time, lap times and finishing position.
AC-4: Usable nitrous and Speedbreaker meters, keyboard and standard gamepad controls, reset, rear view and pause.
AC-5: Menu, loading, error, HUD and results. Local best times and validated settings survive reload.
AC-6: Editable source, asset credits, verification report and playable deployment.

## Decision
Three.js 0.180.0 with imported detailed GLB car and photo asphalt and brick textures. Buildless static JavaScript, no backend. Physics uses a fixed 120Hz timestep and a spline track shared with rendered road geometry. Assets are freely reusable with attribution where required. Ordinary laptop performance is the target, with reduced graphics available, measured FPS remains to be verified.

## Feature design
Entities: track samples and eight checkpoint distances; cars with x, z, heading, speed, steer, slip, nitrous, breaker, checkpoint and lap progress; race state menu, countdown, racing, paused, finished; profile version 1 with paint, quality, volume and best lap/race.

Value sources: speed from physical car velocity; gear from speed bands; position from completed gates and distance toward next gate; clock from race simulation elapsed time; lap from legal checkpoint crossings; nitrous and breaker from car resource state; records from completed races only; paint, quality and volume from validated localStorage.

No remote runtime requests, no account data in the game. Optional localStorage failure falls back to memory. Finishing requires sixteen ordered forward gate crossings. Reset returns to the last legal checkpoint without increasing progress. Pausing stops clocks and meters.

Menu composition, HUD and visuals follow design.md. Audio is synthesized engine, wind and skid sound. Control mappings are documented in README.md.

## Build plan
- [x] AC-1: Restore detailed model, photo textures, road and street detail.
- [x] AC-2, AC-3: Restore driving, collisions and race rules.
- [x] AC-4, AC-5: Restore controls, meters, menus and profile.
- [x] AC-2, AC-3, AC-5: Run simulation and model geometry checks.
- [x] AC-6: Publish and package editable source with credits.

## Consequences
This first release is a circuit. Police pursuits, career, vehicle upgrades, additional cars and touch driving remain later work. It contains an independently authored, licensed sedan model. It does not bundle original game code, music or extracted game assets. GPU rendering, controller hardware and frame rate need real browser verification when supported tooling is available.


## Visual upgrade, authorized 2026-10-11

AC-7: Replace repeated runtime building and solid canopy geometry with detailed Blender exported scenery. Provide editable Blender sources and a reproducible export script.
AC-8: Match the supplied reference direction through varied architecture, textured foliage with visible gaps, weathered road and sidewalk surfaces, daylight sky, stronger light and shade and grounded car contact.
AC-9: Preserve circuit rules and controls, validate exported meshes and materials, republish the existing private Site and replace the editable source package.

### Decision
Use portable Blender to create a reusable city asset kit (several building styles, leafy trees, industrial pipe bridge and street props), export GLB files with UV mapped textures, then instance these assets along the existing route. Three.js remains the renderer. Building material roughness is set explicitly, and normal detail comes from exported maps. Direct shadows and contact textures establish ground contact. Surface wear is baked into reusable texture atlases. A daylight environment supplies the sky and reflections. Geometry creation in Blender alone cannot guarantee realism, so the upgrade includes materials, arrangement and light.

### Value sourcing
Asset dimensions and geometry come from assets-src/build_city.py and exported GLB metadata. District and placement come from route distance and fixed deterministic seed. Ground height and road alignment come from the unchanged track samples. Photo brick and asphalt maps remain the credited Poly Haven assets; additional generated material atlases and foliage texture come from the included authoring scripts. Light and camera parameters are explicit in world.js. No race or profile schema changes are required.

### Build plan
- [x] AC-7: Install Blender, author asset kit and export editable source plus GLB.
- [x] AC-8: Retire old building and canopy generation, integrate asset instances, street wear and daylight environment.
- [x] AC-7, AC-9: Validate GLB structure, UVs, texture images, dimensions and deterministic route placement; rerun driving checks.
AC-9 delivery: publish this source to the existing private Site and replace the existing source package. Publication and file delivery are confirmed from the returned operation results. Browser reference similarity remains open for manual verification.

### Constraints
Reuse the existing detailed car and gameplay. Keep assets local, reusable and license compatible. Use shared geometry and materials instead of unique high detail objects per instance. The reduced graphics option remains. Browser GPU performance and final reference similarity require real browser review; asset renders can verify authoring but do not prove the game render.

### Rationale
See rationale.md for screenshot evidence and alternatives.


## Sedan correction, authorized by screenshot feedback 2026-10-11

### Summary
Replace the incorrectly chosen low coupe with a detailed four-door rally sedan. Use the latest gold sedan attachment for the car silhouette and front, side and rear photographs for panel and lamp detail. Retain the working city circuit and wheel contract.

### Requirements
AC-10: A smooth Blender body with open wheel arches, glazing, interior, headlights, red rear lamps, five spoke wheels, bumper vents, seams, skirts, rear diffuser and wing replaces the concept car.
AC-11: Existing paint choices remain. Original black and red vinyl, controlled paint reflections, translucent glass and separate rubber, metal and carbon materials distinguish surfaces. Wing and rear lamps are readable from the chase camera.
AC-12: Four grounded wheel groups spin and steer correctly. Front points toward positive Z. Braking changes rear lamp intensity. Race state, collision dimensions, circuit and controls remain unchanged.
AC-13: Deliver editable Blender scene, script, GLB metadata, asset renders and updated source through the same Site and source file identity. Record geometry and image checks separately from GPU playtesting.
AC-14: The vehicle has four doors, a taller sedan cabin, angular front lamp housings and defined trunk. Projected side and hood vinyl retain nonzero texture coordinates through export and game preparation. Provide direct front, direct rear, both sides and two three-quarter authoring renders.

### Decision and value sources
Adapt Benit Kibabu's independently authored Mitsubishi Lancer Evolution IX base under CC BY 4.0. Retain the source FBX, attribution and source checksum. assets-src/build_car.py prepares the mesh in Blender 4.5.3, assigns PBR materials (physical surface properties), simplifies hidden interior, creates red five-spoke wheel faces and projects original skull/claw art. dist/assets/tuner-sedan.glb is the runtime model; tuner-sedan.json records dimensions and pivots.

The original Maya UV layer is renamed UVMap before joining decals. Material face indices are retained when slots are replaced. Without these steps the decal samples transparent pixels and front doors take a trim material. Test the actual exported GLB with prepareCar, including UV preservation.

Target dimensions are 4.6 metres long, approximately 2.03 metres wide including mirrors and 1.46 metres tall. Tire radius comes from source tire bounds, approximately 0.346 metres. WheelFrontL, WheelFrontR, WheelRearL and WheelRearR remain the runtime contract. Ground comes from tire vertices. Paint and brake state come from sim.js; original vinyl remains untinted. Rally gold becomes the new-profile default; existing validated paint choices and records remain intact.

Camera and lighting parameters are explicit in world.js. Lower the chase camera to 2.4 metres, use a 7.1 to 8.1 metre following distance and reduce speed FOV growth. Reduce direct and ambient fill while retaining the daylight environment, soft shadows and neutral distance fog. Add a periodic original scalar roughness map and modest road clearcoat for varied damp-surface sheen; reflections come from the existing daylight environment. The supplied video is a different game and setting; its camera and lighting inform this city presentation without replacing the route.

### Build plan
- [x] AC-10, AC-14: Select the sedan base from the latest screenshot and front, side and rear references; retain author credit and license.
- [x] AC-10, AC-11, AC-14: Adapt Blender geometry, materials, red wheels and original vinyl; review six views.
- [x] AC-4, AC-12, AC-14: Integrate the new asset; verify wheel motion, material and UV preservation, camera behavior and legal race progress.
- [x] AC-13: Prepare checked source, publish the existing private Site and replace the existing source ZIP. The delivery operations record their exact version and deployment identities.

### Consequences
All racers and traffic share one detailed model. More triangles improve panel and cabin detail but add rendering cost; browser FPS must be measured. Blender renders verify the authored asset and exported geometry, not the game GPU. Subjective similarity, transparency sorting and controller hardware remain manual checks. Reverting this release commit restores the old asset path and source. Profiles require no migration.

Reasoning and sources: see rationale.md.

## Video world and original assets, authorized 2026-10-11

### Summary
The video now defines the scenery and car direction. Replace the city presentation and downloaded sedan base with original Blender geometry: a blue mid-engine hypercar, an open spyder and a rounded interceptor, plus forest and alpine scenery. Deliver editable scenes and portable rebuild scripts for the user's installed Blender.

### Requirements
AC-15: All new vehicle and scenery geometry is authored for this project without importing downloaded meshes. Cars have distinct silhouettes, curved panels, grounded wheels, interior, front/rear lamps, intakes, exhausts and aero parts. Existing game controls and legal race rules remain.
AC-16: Forest and alpine presentation replace city repetition. Detailed conifers, rocky banks, layered mountains, road shoulders, guardrails, power poles, roadside signs, water and original terrain establish the setting visible in the footage. The road remains unobstructed and grounded.
AC-17: Garage selectors choose the three car bodies and forest/alpine scenery. Choices persist with validated settings. Body changes reuse the wheel/material contract. Reduced graphics remains available. Different bodies appear among rivals/traffic.
AC-18: Export runtime GLBs, original editable Blender scenes, measurements, multi-view renders, a Windows Blender rebuild script, source credit records and validation results. Publish to the same Site and replace the same source ZIP.

### Decision and sources
Use Blender 4.5.3 for original surface and asset authoring, Three.js for local rendering. Vehicle profiles and measured control points come from the blue hypercar, red spyder and police car visible in the attached MP4, supplemented by manufacturer dimension references. The footage provides composition and visible surface evidence, not CAD dimensions or hidden geometry. Exact commercial asset identity and pixel-perfect match are not promised.

Create assets-src/build_video_cars.py and assets-src/build_wilderness.py. The vehicle script uses curved surface sections, wheel arch cuts and separate lamp/intake/cabin geometry, not imported meshes. The scenery script exports original reusable GLBs, editable prototypes and composed circuit scenes. dist/wilderness.js instances the kit with deterministic placement and terrain derived from track samples, rejecting props intersecting the driving corridor. Forest and alpine use the same legal loop with different vegetation, terrain materials, distant peaks, atmosphere and surface presentation. This does not recreate unknown unseen sections of the original game's map.

Keep current track samples, width, checkpoints and elevation while changing their presentation. Race collision and car placement use the existing simulation. Car meshes normalize to the established 4.6 metre runtime contract; wheel centers and radius come from each export. Profile fields vehicle and environment accept only hypercar/spyder/interceptor and forest/alpine, with defaults hypercar and forest. Existing valid paint/volume/quality/records survive. Selector changes are allowed in the garage and rebuild only owned scene instances, preserving shared assets.

Use original Blender materials and existing credited daylight/asphalt maps where appropriate. No downloaded geometry or extracted game textures are used by the new kit. Playback evidence remains the 97 directly inspected samples across the attached 16:05 video, with additional close views inspected for vehicle detail. Weather and light are explicit per environment. PBR environment reflections remain distinct from real-time planar reflections.

### Build plan
- [x] AC-15, AC-18: Author three original car bodies, details and wheel pivots; inspect multi-view renders and exported geometry.
- [x] AC-16, AC-18: Author scenery kit, original terrain and two visual settings; inspect a Blender road preview and placement bounds.
- [x] AC-15, AC-17: Integrate asset catalog and garage choices with validated persistence; preserve wheel/brake/paint ownership and race rules.
- [x] AC-16, AC-18: Run driving, geometry, texture and scene checks and prepare publication/source replacement. Native delivery results record the deployed version and source ZIP version.

### Consequences
This is an original reconstruction of visible forms and atmosphere. Authoring rather than downloading gives editable control but does not itself guarantee AAA quality. Full browser appearance and FPS remain unverified until supported preview tools are available. The downloaded sedan and city kit can be recovered from previous Git versions. No remote access to the user's PC is implied; the included .blend files and Windows script run in the user's Blender.

### Implemented assets and evidence
Three original vehicles and thirteen scenery/road exports replace the prior imported sedan and city. Original terrain and road/shoulder geometry are authored in Blender against the unchanged legal circuit. Garage selectors persist validated choices; rivals/traffic use different bodies. BUILD-REPORT.md records measurements, 12 driving tests, 9 vehicle scene tests, both clear placement sets, image decoding and 18 vehicle/2 world authoring renders. README.md records local Blender/Windows rebuilding. Exact model/map matching and GPU FPS remain explicit limits.

## Front geometry, midnight and garage, authorized 2026-10-11

### Requirements
AC-19: Correct hidden lamp housings and the detached front splitter. Each of the five original Blender cars has visible front/rear lamps, integrated bumper detail, proper glass, panel seams and grounded wheels. Provide front, rear, both sides and two angled renders.
AC-20: Add Midnight Run to the setting selector. Use forest geometry with a dark blue sky, cool moonlight, warm roadside lamp pools, player headlights, luminous rear lamps and visible lane markings. Returning to daytime restores daytime lights and sky.
AC-21: Add a four door rally sedan and a long hood muscle coupe, with different body, cabin, grille, lamp, wing and wheel designs. All five cars can be chosen and repainted; selection persists. Rivals and traffic use varied bodies.
AC-22: Upgrade title, first visit driving briefing, garage, pause and results presentation. Use local licensed display/body fonts and imagery rendered from the actual original Blender assets. The garage has car thumbnails, scene cards, description, type information and camera angle buttons. All existing race controls, settings and records remain accessible.
AC-23: Verify geometry, night switching, lamps, selections, onboarding state and race regressions. Publish the same private Site and replace the same source ZIP, including the Blender scenes and rebuild scripts. Separate authoring render checks from browser GPU verification.

### Decision and value sources
Fix in place, retaining the simulation, original Blender surface workflow and shared renderer. Direct replacement of the game engine or downloaded car meshes would add risk without addressing the measured lamp problem. The existing headlight housing triangles sink up to 40 mm beneath the curved deck. New housings subdivide and sample the same deck function; lens and LED detail is placed above that surface. A solid shaped splitter follows the body nose. The accepted rear proportions remain while adding seams, grille depth and lamp detail.

The supplied gold sedan image defines the rally silhouette, four doors, red wheels and rear wing. Original contrasting stripe graphics replace the pictured decals. Official Koenigsegg front/rear/side photos guide the existing hypercar. EA Heat media, manual and the supplied MP4 at 03:30 guide the night atmosphere and garage hierarchy. Official EA car listings establish the variety of sedan, muscle, open and exotic car families. These are visual references, not copied meshes, branding or menu assets.

Vehicle names, descriptions, body classes and default paints come from dist/catalog.js. The five IDs are hypercar, spyder, interceptor, rally and muscle. Profile validation uses that catalog and allows forest, alpine and night. Existing records and finishes are preserved. Car physics remains common to all models; no invented performance ratings are displayed.

Night reuses the forest terrain and road with explicit theme mapping. A new original Blender lamp prototype is instanced beside the road. A fixed small pool of nearby spotlights supplies actual warm light without one shadow map per roadside lamp. Two car attached player headlights point forward and toward the road, using each car's exported headlight positions. Night sky/reflections use an original procedural equirectangular texture and PMREM. Lighting and fog values live in world.js. Lamp intensity is derived from selected theme; brake intensity from the unchanged braking state. Owned lights and cloned materials are released when switching cars.

Title uses an original Blender midnight road render as its background, Harbor Run branding and one Enter Garage action. A first visit optional briefing shows accelerate, corner/brake, nitrous and checkpoint instructions; Continue and Skip enter the same garage and save onboardingVersion 1. Returning profiles skip the briefing; a garage briefing button reopens it. Title appears at startup. Enter and gamepad Start advance the active onboarding screen before they start a race. Native focus and dialog controls remain.

Garage uses the existing amber/cyan palette, local Barlow Condensed display font and Barlow body font under OFL. A left briefing panel has race facts, labelled body/setting selects, thumbnail car choices, three scene cards, paint row and Start Circuit. The actual 3D car occupies the right. Six camera controls use front, rear, left, right, angled front and automatic orbit presets. Scene card images and five car thumbnails are generated from the included Blender assets; they depict real selectable content. Pause/results use an image header, updated typography and the real recorded times. No career or upgrade mechanics are implied.

### Build plan
- [x] AC-19, AC-21: Correct existing fronts, author two distinct bodies and inspect six views per car.
- [x] AC-20: Author roadside lamp and original sky, integrate headlights and reversible night lighting.
- [x] AC-21, AC-22: Integrate catalog, persistent choices, cinematic title/briefing and garage camera controls.
- [x] AC-19, AC-20, AC-23: Run geometry, surface clearance, scene ownership, profile and driving checks, publish and replace the source package.

### Verification limits
Blender renders show authored geometry and composition. They do not prove browser shading, performance or controller hardware behavior. Use supported browser preview if available; otherwise record that limit and publish after the available checks.

## Steering, handling, pursuit and performance, authorized 2026-10-11

### Summary
Correct the reversed driver controls, give each existing car its own driving character, and add a selectable police pursuit. Retain the Circuit event and existing scenery. Measure the available CPU and camera workload before tuning, and provide real frame measurements in the browser for the remaining hardware check.

### Requirements
AC-24: Left arrows, A and left gamepad input turn toward the left of the normal chase view. Right inputs turn right. Opposed keys cancel, the stick dead zone remains, focus loss clears input, and reversing behaves like steered wheels. The existing rear view is a view behind the driver, not a different steering mode.
AC-25: All five selectable cars have distinct acceleration, speed limits, braking, steering response, grip and handbrake behavior. The selected model and physical setup agree on restart. The garage describes the actual setup without suggesting licensed manufacturer specifications.
AC-26: A garage event selector offers Circuit and Pursuit. Pursuit has traffic and up to three actual interceptor opponents with road following, player interception, collisions, flashing lights and a synthesized siren. Officers physically drive; only a newly activated reinforcement is spawned. Active officers do not teleport to catch the player.
AC-27: Pursuit can end in escape or bust. Show heat, active patrol count, contact distance, escape progress and bust progress from the real state. Pause freezes the event. Restart resets it. Recovering the player stays at their current route segment and clears escape progress without moving police. Pursuit results and best escape times are separate from Circuit records.
AC-28: Measure the scenery submitted by camera frustums (the visible camera volume) and scene CPU cost before and after. Divide scenery instances into spatial batches while retaining every authored placement and shared asset ownership. Add Auto graphics with bounded adaptive resolution and an optional FPS/draw/triangle overlay based on actual browser frames and renderer counters. Keep High and Reduced options.
AC-29: Check controls, all car setups, three environments, event selection, pursuit outcomes, persistence, ownership and Circuit regressions. Publish the same Site with its current audience and replace the same checked source ZIP. Record unavailable browser appearance, hardware controller and GPU FPS checks explicitly.

### Decision
Fix in place using the existing Three.js scene and fixed 120 Hz simulation. Keep Circuit as the default event and add Pursuit alongside it. No new packages, remote game services or commercial assets are required. Extend the existing approved spec in place. The build approach is an end to end slice from controls and simulation through the garage/HUD, followed by measured scene tuning and delivery.

### Feature design and value sources
Driver controls translate screen directions into the established world heading convention. The car faces +Z with Y up. A chase camera behind it has screen right toward local negative X, so left driver input increases heading and right decreases it. AI continues to use geometric heading differences. Front wheel steering uses the same steering angle as the simulation.

`dist/handling.js` owns frozen arcade setups. Speeds are metres per second and accelerations metres per second squared. Setup order below is acceleration, top speed, boosted limit, brake force, steering low/high angles in radians, steering response, grip recovery, handbrake slip and collision mass in kilograms:

| Vehicle | Setup |
| --- | --- |
| hypercar | 17.8, 67, 83, 30, .46/.14, 9, 8, .23, 1250 |
| spyder | 16.3, 62, 78, 28, .52/.17, 11, 6.6, .34, 1370 |
| interceptor | 15.6, 65, 81, 31, .45/.135, 8, 8.5, .22, 1550 |
| rally | 18.2, 55, 70, 29, .57/.19, 13, 11, .18, 1400 |
| muscle | 19.4, 63, 80, 24, .43/.12, 7, 4.5, .40, 1670 |

Coast drag, squared speed drag, wheelbase, power slip and boost acceleration are named constants in each setup, tuned against the actual route before release. Collision separation is weighted by those masses. A closing contact exchanges speed through an impulse with restitution .15 along the contact normal; parallel cars already touching do not suffer a new speed penalty every timestep. This prevents the old repeated .3 m/s penalty from trapping cars together. These are game balance values, not specifications for a real car. Garage character text comes from the same setup catalog. Car state gains a validated `vehicle` ID. Simulation uses its setup; the renderer uses the same ID. Default rival/traffic bodies retain the existing five body cycle.

Race state gains `mode` (`circuit` or `pursuit`), `outcome` (`escaped`, `busted`, or null), three police car states and a pursuit object with heat, peakHeat, nearestDistance, escape and bust seconds. Pursuit begins with one officer 35 metres behind the player, starting from rest like the player. At 20 and 45 simulation seconds, one reinforcement is activated 65/85 metres behind on the same route, using an initial speed bounded by 18 to 40 m/s. Maximum heat and patrol count is three. Each officer follows a lookahead point with a lane near the player's offset, targets up to eight m/s above player speed when behind, slows for bends and uses its own bounded interceptor setup. Desired patrol speed is capped at 76/85/93 percent of the interceptor limit by heat; the bend allowance subtracts 75 times the heading change over the lookahead. Nitrous is reserved for heat three with a gap above 70 metres. A nearby stopped player makes the officer slow to approach instead of circling past. No active police position is assigned by the pursuit controller.

Escape requires at least 20 seconds elapsed, absolute speed above 6 m/s, no active officer within 120 metres Euclidean distance, and eight uninterrupted seconds of that separation. Otherwise escape progress resets. Bust requires absolute speed below 5 m/s and an officer within 10 metres for four seconds; leaving that condition drains bust progress at twice real time. Bust wins if both terminal checks occur. Timers use the simulation timestep, including Speedbreaker, and stop on pause/results. Pursuit recovery centers the player on their current segment, stops them and clears escape progress. It retains bust progress and active officer positions. Inactive reinforcements neither collide nor render.

| Action | Produced or displayed value | Source |
| --- | --- | --- |
| Read driver input | steer/throttle/brake/actions | Held keyboard keys, standard gamepad axes/buttons and the explicit chase direction mapping |
| Select or restart car | mesh, physics, descriptive character | Validated vehicle ID, existing Blender template and handling setup |
| Select or restart event | Circuit/Pursuit, cars, timers | Validated profile mode, existing Circuit setup or the pursuit constants above |
| Police drive | steer, desired speed, boost | Track lookahead/curvature, player route offset/speed, relative route distance and interceptor setup |
| Pursuit HUD/map | heat/count/distance/progress, police dots | Simulation elapsed, active police states, actual X/Z distance, escape/bust timers and map projection |
| Pursuit result | outcome/time/peak heat/best escape | Terminal pursuit state, simulation elapsed, measured peakHeat, validated records.escape |
| Circuit result | lap/race/standings | Unchanged ordered checkpoint rules and existing records.lap/race |
| Recover player | current segment pose, speed, escape reset | Current projected route distance and track center, never a pursuit starting checkpoint |
| Performance overlay | FPS, draws, triangles, resolution | Raw requestAnimationFrame intervals, renderer.info.render and current pixel ratio |
| Auto quality | pixel ratio and shadow setting | Three one second windows below 45 FPS lower resolution .15; eight windows above 58 FPS raise it .10; bounds .65 to max(.65,min(devicePixelRatio,1.5)); shadows disabled at/below .8 and restored at/above 1.0 |
| Spatial batch | geometry, poses, bounds | Unchanged deterministic placements grouped into 96 metre X/Z cells; actual per batch bounding spheres |

The garage adds two event buttons above the car selectors and event rules beneath them. Circuit retains two lap/four racer facts. Pursuit shows up to three patrols and escape/bust conditions. The selected car caption gains a brief handling description and simulated speed cap. HUD replaces position/lap with a compact heat/contact panel during Pursuit, hides lap lines and uses red/blue police map dots. Pause/results use event specific labels and real outcomes. Existing fonts, images, amber/cyan tokens, focus indicators and responsive scrolling govern these small additions.

Profile retains version 1 and the same storage key. Add `mode` default circuit, `showPerformance` default false, allow quality auto/high/low, and accept optional positive `records.escape`. Preserve prior valid paint, car, scene, volume, onboarding and Circuit records. Pursuit records update only for a real escaped terminal state. Auto starts with the normal capped pixel ratio and shadows; High is fixed at the normal cap, Reduced stays .8 with shadows disabled. Measurement windows reset across inactive screens and focus changes; no hidden tab intervals tune graphics.

### Build plan
- [x] AC-24: Reproduce driver direction through actual app handlers and chase projection, correct the mapping and verify reverse/dead zone/focus behavior.
- [x] AC-25, AC-26, AC-27: Implement setup catalog and a complete selectable pursuit from garage through simulation, scene, audio, HUD and results.
- [x] AC-28: Capture baseline workload, cluster unchanged placements, reduce repeated night light work and integrate real frame measurements/Auto settings.
- [x] AC-24, AC-25, AC-26, AC-27, AC-28, AC-29: Run the available behavioral/asset checks, document measured limits and prepare the checked source for publication and replacement. Confirm delivery from native operation results.

### Consequences and rationale
This keeps the existing original Blender assets and local game architecture. Direct engine replacement would require rewriting working gameplay and scenes. A separate racing physics library could add tire realism but would make tuning and coordinate migration much broader than this task. Spatial batching permits culling without removing scenery or changing original asset files, but increases visible draw calls; GPU benefit must be checked on actual hardware. Auto graphics responds to frame time rather than guessing a device's performance. Pursuit is an original arcade event and does not include a career, weapons or recreated commercial pursuit systems.

The baseline benchmark uses actual exported scenery and 48 camera poses per theme. Mean submitted scenery triangles are 3,281,149 forest, 3,269,096 alpine and 3,371,133 night. Whole circuit bounding spheres keep nearly every instance in the visible batch. Node CPU scene timing is separate from GPU FPS. The managed browser skill is unavailable in this session, so supported browser QA remains explicitly blocked while simulation, scene math, ownership and file checks continue.

## Driving cameras and onboarding, 2026-10-11

### Summary and requirements
You can change the driving view during either event. A front three quarter tracking view follows the supplied red car image. A Blender cabin puts the camera behind a detailed wheel and dashboard. Brighter artwork and a compact garage keep the choices readable together.

AC-30: Offer Chase, Wide chase, Tracking, Hood and Cockpit during Circuit and Pursuit. V, gamepad LB and a HUD button cycle views. Tracking starts at a front three quarter angle; brackets or HUD angle buttons rotate it. C or RB temporarily looks behind and returns to the chosen view. Camera changes preserve driving controls and event state.
AC-31: Cockpit includes original Blender wheel, instrument cluster, vents and console. Wheel and gauge needles follow the real car state. Every body has its own seat/hood position. The road remains clear of opaque glazing and old cabin meshes. Interior/exterior changes snap without passing through the body. All five cars and day/night work, with extra corner look disabled under reduced motion.
AC-32: Use a bright original car background and restrained text scrim. Keep local Barlow fonts and readable copy. Show driving, power, camera and recovery controls together in the desktop briefing.
AC-33: At desktop sizes of at least 1100 by 600, show event, car, setting, paint, inspection and Start choices without scrolling. Explicit compact image heights override the stretched HTML image heights observed in the screenshot. Smaller screens retain scrolling with every choice reachable.
AC-34: Up/Down move between garage choice groups. Left/Right select with visible focus and the same behavior as clicking. Enter activates the focused action. Gamepad D pad or left stick navigates on direction edges; A confirms. Title, briefing, pause and results also support arrows. Dialog fields keep native behavior. Menu navigation never becomes held driving input.
AC-35: Validate and persist camera ID and finite wrapped tracking yaw in the existing profile. Preserve records and earlier settings. Verify real camera projections, rig animation, restart ownership and actual app handlers. Publish the existing Site and replace the same complete source ZIP. Document browser/GPU/layout limits separately from asset renders and fixtures.

### Decision and feature design
Extend the working renderer and menus in place with a small camera module and one reusable Blender cockpit kit. Replacing the engine would discard accepted assets and gameplay. A flat dashboard overlay would be simpler but would not provide the requested 3D cabin. Use end to end slices, the existing project approach, and no new dependencies.

Chase retains its accepted rear pose. Wide uses an 11.5 metre rear distance and 3.8 metre height. Tracking circles at 7.5 metres and 1.45 metre height, looking at the car, with initial yaw -.72 radians. Brackets change yaw at .9 radians per second; HUD angle buttons step .18 radians. Yaw wraps within plus or minus pi. Cockpit uses a 76 degree field of view and .035 metre near plane. Corner look is bounded to .12 radians. Other field of view values live in the camera catalog. These are original game camera choices.

| Body | Driver eye, local X/Y/Z metres | Cabin lift | Hood eye Y |
| --- | --- | --- | --- |
| hypercar | -.35, 1.015, -.24 | 0 | .84 |
| spyder | -.35, 1.015, -.20 | 0 | .84 |
| interceptor | -.35, 1.11, -.22 | .07 | .95 |
| rally | -.35, 1.24, -.32 | .19 | 1.04 |
| muscle | -.35, 1.13, -.25 | .10 | 1.01 |

Seat positions may be tuned against the real exported surfaces and authored previews to eliminate obstruction. The kit shares geometry/materials and only appears on the player in cabin mode. Original cabin leather, glazing and a separate painted roof triangle group temporarily hide, then restore in exterior/rear views. The roof split was required by actual forward ray checks; exterior GLBs, silhouette and triangle totals are unchanged. Close windshield trim follows the seat eye, and the open spyder omits its header. Wheel rotation derives from actual steering angle, with reversed Z sign for the forward-facing driver camera. Its projected top marker must move toward the same screen side as the steering input. Speed/RPM needle rotation derives from speed and gear. This adds no extra render pass or reflected mirror camera.

| Action | Produced value | Source |
| --- | --- | --- |
| Cycle camera | Selected view and label | Ordered validated camera catalog, V/LB edge or HUD click |
| Tracking angle | Wrapped yaw and pose | Stored yaw plus bracket hold or HUD step |
| Camera pose | Eye, target, field of view, near plane | Preset, seat table, car position/heading/speed/steer, reduced motion |
| Cabin animation | Wheel/gauge transforms and visibility | Current rig, steering angle, speed, derived gear/RPM, effective view |
| Rear hold | Temporary exterior camera | C/RB hold; selected preset retained |
| Navigate menu | Focus and active choice | Actual enabled controls on current screen and direction edges |
| Save camera | Camera ID and yaw | Catalog membership and finite wrapped value; prior profile fields retained |
| Title artwork | Local bright background | Imagegen using authored Apex reference; exact prompt included in source |

### Build plan
- [x] AC-30, AC-31, AC-35: Wire camera selection through input, scene and HUD; add presets and the Blender cabin.
- [x] AC-32, AC-33: Integrate bright artwork, compact briefing and explicit thumbnail sizes.
- [x] AC-34, AC-35: Add focus navigation and validated persistence with actual handler checks.
- [x] AC-30, AC-31, AC-32, AC-33, AC-34, AC-35: Check projections, geometry, inputs, assets and regressions; document limits and prepare the release/source.

### Consequences and references
Front tracking is a cinematic view of the car and road behind it. Chase, hood and cockpit show the next turn. The shared dashboard has different seat placement by body; mirrors and driver arms are not included. Generated title art is a marketing image, not a browser screenshot. Browser appearance and physical controllers remain open when supported preview is unavailable.

The four supplied screenshots are the direct visual references. EA's Heat guide documents separate camera toggle and look controls: https://www.ea.com/able/resources/need-for-speed/need-for-speed-heat/pc/control-settings . EA's SHIFT manual describes outside and in helmet perspectives: https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/24870/manuals/NFSSHpcMAN(US).pdf?t=1759355309 . These inform independent choices; no commercial reference imagery or geometry is shipped.

## Text and control readability, 2026-10-12

### Summary and requirements
Driving controls must stay clear over snow, bright asphalt and night scenery. Your supplied HUD image shows small grey labels against a bright road. The pause image shows weak secondary action labels. This enhancement increases text size and gives the information its own dark surfaces.

AC-36: Group the camera selector, tracking angle controls, reset hint, rear view hint and pause action into one dark control dock. Keep every button at least 44 pixels high. Use visible keyboard badges and 14 pixel action labels on desktop, with 13 pixel labels on smaller displays. The selected camera name still comes from the validated camera catalog.
AC-37: Give Circuit status, event time, map, speed/resources and Pursuit status dark backing surfaces. HUD labels are at least 12 pixels before any viewport adjustment, with no whole panel scaling that also shrinks text. Countdown and wrong way text have backing surfaces only while displayed. Layout adapts around the dock rather than overlapping its controls.
AC-38: Pause, results, error and details dialogs use explicit bright foregrounds, 16 pixel body copy and 16 pixel action labels. Secondary and return actions have visible filled button surfaces. Controls references use at least 14 pixel text. Native labels, focus indicators and scrolling remain available.
AC-39: Title, briefing and garage retain the existing artwork and typefaces while increasing supporting copy and selection labels. Keep the desktop garage compact at 1100 by 600 and larger. Smaller screens may scroll instead of shrinking essential text. Aim for at least 4.5 contrast between normal text and its backing surface, including a translucent HUD surface composited over white.
AC-40: Preserve the existing input, camera, event and storage behavior. Confirm the actual menu handlers and source/asset checks. Publish the existing public Site and replace the same complete source ZIP. Document browser limits separately from numerical color checks.

### Decision and value sources
Fix the existing HTML and CSS in place. Shared readable foregrounds and dark backing surfaces solve the observed problem without replacing the accepted scene or UI. Replacing the whole HUD would need much broader layout and input changes. Increasing text alone would still leave labels exposed to bright scenery.

The existing local Barlow font is used for action and body text. Barlow Condensed remains the display face for headings and large instruments. Main text is #f6faff, supporting text #d2dfe9, and the key/accent color #ffd166. HUD backing is #08121ef5, dialog backing #0d1c29, and button backing #1d3448. These values and component sizes live in dist/style.css. The contrast check reads those actual tokens and compares their computed lightness, including the HUD over a white background.

| Value displayed | Source |
| --- | --- |
| Camera name and shortcut | Existing camera catalog and V input mapping |
| Reset, rear and pause badges | Existing R, C and Escape input mapping |
| Race and pursuit numbers | Existing real HUD simulation values |
| Dialog and scene copy | Existing labelled HTML content |
| Font, size, foreground and backing | The readability tokens and component rules in dist/style.css |

No new provider, dependency, artwork, saved preference or data migration is needed. Keep existing element IDs and action handlers. Dark surfaces cover more of the scenery at the screen edges, which is the necessary tradeoff for reliable text contrast. Use the current end to end build approach, one HUD slice followed by the remaining screens.

### Build plan
- [x] AC-36, AC-37: Integrate the readable control dock and backed HUD instruments.
- [x] AC-38, AC-39: Apply readable text and action styling to the remaining screens while retaining compact layout rules.
- [x] AC-39, AC-40: Measure token contrast, check interactions and assets, document evidence, then deliver the published build and matching source.

### Verification limits
The current cloud browser reported GL_VENDOR and GL_RENDERER as Disabled during the preceding check, so it could not initialize WebGL. Numerical contrast and DOM fixture tests do not prove rendered layout, GPU appearance, physical controller response or audible quality. These browser checks remain open.
