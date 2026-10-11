# 0001 City racer

**Status**: Implemented, 1.5.0; browser verification limits are in BUILD-REPORT.md
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
