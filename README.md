# Harbor Run 1.9.0

An original 3D arcade racer with five Blender authored vehicles, daylight forest/alpine scenery and a night forest setting inspired by the supplied Hot Pursuit footage. Circuit racing and police pursuits, four traffic cars, distinct handling, five driving cameras, an animated Blender cabin, contact sparks/debris/dust, impact recoil and layered collision audio, persistent body damage, breakable roadside barriers, falling and tumbling wrecks, nitrous, Speedbreaker, keyboard and standard gamepad controls. All current vehicle and scenery geometry is authored for this project; the earlier downloaded sedan and city assets have been retired.

## Play

Use the published game, or serve `dist` on your own computer:

```sh
cd dist
python3 -m http.server 8080
```

Open http://localhost:8080 in a desktop browser with WebGL and hardware acceleration. File URLs cannot load the module/asset workflow. All assets are local; there are no runtime CDN requests. The shipped runtime is approximately 42 MB; cache and unused textures affect actual transfer.

Enter the garage from the cinematic title. The optional first visit briefing can be skipped or reopened later. Choose Apex H1 (hypercar), Strada S2 (open spyder), Sentinel I3 (interceptor), Kestrel R4 (rally sedan) or Vanguard M5 (muscle coupe). Labelled thumbnail buttons choose the body. Up/Down move between groups; Left/Right choose within the group; Enter activates the focused action. All desktop choices fit together at 1100 × 600 and larger. Smaller screens retain scrolling. Scene cards choose Redwood Ridge, Summit Pass or Midnight Run. Choose paint, inspect front/rear/both sides/angled/orbit camera views and start. Car changes apply that body's default finish; subsequent paint choices are independent. Existing valid settings and best times survive.

Midnight Run adds a procedural night sky, cool moonlight, 32 original roadside lamps, four nearby warm light pools, two player headlights and brighter rear lamps. Selecting daytime restores daytime lighting and sky. Each car now has its own arcade acceleration, braking, steering, grip, drift, mass and speed limits. The garage describes the actual driving character. These are original game balance values, not real manufacturer specifications.

Choose Circuit or Pursuit above the garage car choices. Circuit keeps the two lap race. Pursuit adds actual interceptor patrols, reinforcements, contact distance, escape and bust timers, flashing lights and a synthesized siren.

Auto graphics responds to sustained frame rate by changing resolution within a .65 to 1.5 pixel ratio cap, and can disable shadows when resolution reaches .8. High keeps full configured quality; Reduced stays .8 with shadows off. Settings can show live FPS, draw calls, triangles and resolution during play. These are measured in your browser. Spatial scenery batches retain all original placements and let the camera cull distant/outside batches.

During either event, V, gamepad LB or the VIEW button cycles Chase, Wide chase, Tracking, Hood and Cockpit. Tracking starts at a front three quarter angle; hold brackets or use its angle buttons to circle the car. Cockpit shows a real 3D wheel, stitched dash, vents, console and moving instrument needles. The open spyder omits the roof header. C/RB temporarily looks behind, then restores the selected camera.

Car, event, scenery, paint, driving view, tracking angle, briefing completion, graphics, sound, stats display and valid records persist in browser localStorage when available.

The title places its wordmark and primary action directly beside the car artwork with a smooth scene fade. Race instruments sit around the perimeter, with a smaller speed arc, a brighter map route and thin resource meters. Camera, reset, rear view and pause use a lightweight prompt row and outlined key badges. Larger labels and readable dialogs remain. Existing keyboard/gamepad actions and saved profiles are retained.

Car contact follows a rounded, oriented body footprint. A hard hit emits sparks, small spinning fragments, dust and a brief local light at the contact point, with a short body and camera recoil. Light bumps are smaller; sliding car and roadside contact produces sparks and a gritty scrape. Original synthesized collision sounds combine body thump, crunch, metal resonance and fragment transients. They follow impact strength, distance, camera stereo position and the existing sound volume. Particle pools and audio voices are capped and reused. Pause freezes visual effects and mutes transient audio; reset and restart clear them. Reduced graphics lowers emissions; reduced motion disables impact camera movement and flash. Strong hits now leave independent front, rear and side damage. Real body panels crumple, glazing cracks and shatters into smaller pieces, and bumpers, hoods and side panels detach with the selected car finish. Hard side hits impart lateral and angular motion. A wreck loses powered driving; front damage reduces acceleration before that point.

Selected stretches use original brick and stone barriers. Both these and steel guardrails accumulate damage and can break, leaving actual openings. A car can continue through the gap, fall down the rendered bank and tumble onto the terrain. Broken barriers remain after R recovery; starting another event or choosing scenery restores them. R, or gamepad Y, recovers and repairs the car without giving checkpoints. A compact prompt appears for a wreck or offroad car. The existing camera selection remains: Cockpit and Hood follow body rotation, while exterior views follow the wreck. Actual detached parts and barrier debris expire after eight simulation seconds, capped at 24 car pieces and 64 barrier pieces. Pause freezes them; new events, garage exit and scenery changes release them. Broken masonry has its own original crunch and rubble sound.

## Controls and rules

| Action | Keyboard | Standard gamepad |
| --- | --- | --- |
| Accelerate | W or up | RT |
| Brake / reverse | S or down | LT |
| Steer left / right | A/D or left/right | Left stick or D pad |
| Handbrake | Space | A |
| Nitrous | Shift | B |
| Speedbreaker | Q | X |
| Recover car on road | R | Y |
| Cycle driving view | V or VIEW button | LB |
| Rotate tracking view | Hold [ / ] or angle buttons | Angle buttons |
| Hold rear view | C | RB |
| Pause / resume | Escape | Start |
| Navigate menu groups / choices | Up/Down / Left/Right | D pad or left stick |
| Confirm focused menu action | Enter | A |
| Advance title/briefing or start race | Focus action then Enter | Start |

Complete eight ordered forward checkpoints per lap, twice. Reverse crossings and skipped checkpoints do not count. Reset does not grant progress. Car contacts transfer motion and damage; intact roadside barriers deflect the car. Wrecked, airborne and offroad travel cannot award checkpoints. Records update only after completing the race. Changing tabs or disconnecting a controller pauses it. Nitrous recharges while driving; Speedbreaker slows the simulation to 40 percent while improving steering response.

Pursuit starts with one officer. Reinforcements arrive at 20 and 45 simulation seconds, up to heat three. Active police drive physically and do not teleport. After the first 20 seconds, maintain more than 120 metres of separation from every active patrol while moving above 21.6 km/h for eight uninterrupted seconds to escape. Staying below 18 km/h within 10 metres of a patrol for four seconds causes a bust. Separation resets escape progress; leaving low speed contact drains the bust timer. Speedbreaker slows all event timers along with the simulation.

Circuit recovery returns to the last checkpoint without progress. Pursuit recovery stays at the current road segment, clears escape progress, retains bust progress and leaves officers untouched. Escaped pursuits update only the separate best escape record; busted pursuits do not set a record. Circuit lap/race times remain.

All three scenery settings use the same original legal circuit. The steering direction is corrected for the actual chase camera. Collision impulses now exchange closing momentum instead of applying a repeated speed penalty to cars already touching.

## Open and edit in Blender

Extract the entire source ZIP before opening files. Blender 4.5.3 LTS authored the included scenes. Textures are packed into the editable files.

| Editable file | Contents |
| --- | --- |
| assets-src/cockpit/cockpit.blend | Original stitched dashboard, wheel, windshield trim, console, vents and animated needles |
| assets-src/vehicles/hypercar.blend | Curved blue hypercar, canopy, interior, aero, lamps and wheels |
| assets-src/vehicles/spyder.blend | Red open cockpit spyder with windscreen and roll hoops |
| assets-src/vehicles/interceptor.blend | Rounded police car, original lettering and lightbar |
| assets-src/vehicles/rally.blend | Original four door sedan, red wheels, angular lamps and high wing |
| assets-src/vehicles/muscle.blend | Original long hood coupe, round lamps, twin stripe and ducktail |
| assets-src/wilderness/night-circuit.blend | Composed night circuit, lamp/headlight lighting and rally sedan |
| assets-src/wilderness/forest-circuit.blend | Composed forest circuit with car and scenery |
| assets-src/wilderness/alpine-circuit.blend | Composed snowy circuit with roadster and scenery |
| assets-src/wilderness/*.blend | Fourteen independently editable scenery/road/lamp prototypes |

Vehicle GLBs and measurements are in `dist/assets/vehicles`. Scenery GLBs, measurements and the authored height map are in `dist/assets/wilderness`. Front is positive Z in the game, and Blender uses negative Y for vehicle forward. Runtime cars normalize to 4.6 metres long. Four separate wheel parents retain centered spin and steering; calipers remain fixed.

The Python scripts build geometry from original surface sections and primitives. They do not read downloaded car or environment meshes. The optional circuit renderer appends this project's own `.blend` files. Car panels and detail groups are consolidated for efficient export; the authoring scripts retain the reproducible surface parameters.

## Rebuild with your installed Blender

On Windows, open PowerShell in the extracted project folder:

```powershell
.\Rebuild-Blender-Assets.ps1 -RenderVehicles -RenderScenes
```

The script finds Blender on PATH or under Program Files. If necessary, supply your installed executable:

```powershell
.\Rebuild-Blender-Assets.ps1 -BlenderPath "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"
```

This uses the existing Blender installation. It does not install software or control your computer. Omitting the render switches builds the editable scenes and runtime GLBs without the optional previews.

Equivalent Blender commands on any platform:

```sh
blender --background --factory-startup --python assets-src/build_video_cars.py
blender --background --factory-startup --python assets-src/build_cockpit.py
blender --background --factory-startup --python assets-src/build_wilderness.py
blender --background --factory-startup --python assets-src/build_night.py
blender --background --factory-startup --python assets-src/build_destruction_assets.py
blender --background --factory-startup --python assets-src/render_wilderness.py
blender --background --factory-startup --python assets-src/render_ui.py
blender --background --factory-startup --python assets-src/render_cockpit.py
```

Add `-- --render` to the vehicle command for six views per car. The saved circuit and placement inputs are included, so these commands do not require Node or additional Python packages. If you change the circuit, run `node --loader ./tests/three-resolver.mjs assets-src/prepare_preview.mjs` before rebuilding its scenery/render. Optional `make_textures.py` regeneration requires Pillow and NumPy; all needed maps are already included.

## Source and verification

| File | Role |
| --- | --- |
| dist/catalog.js | Five car descriptions/default paints, three setting labels and onboarding validation |
| dist/sim.js | Driving, route, ordered checkpoints, Circuit/Pursuit and profile validation |
| dist/handling.js | Five original arcade vehicle setups and shared wheel steering |
| dist/performance.js | Actual frame interval measurement and bounded Auto graphics |
| dist/world.js | Vehicle preparation, road, materials, camera and rendering |
| dist/wilderness.js | Original kit loading, clear placements and theme lifecycle |
| dist/app.js | Input, selectors, menus, HUD, records and fixed steps |
| dist/destruction.js / dist/damage-visuals.js | Persistent damage, mesh deformation, barrier breaches, wreck motion and owned debris |
| dist/collisions.js | Vehicle contact geometry and bounded impact/scrape events |
| dist/impacts.js / dist/impact-effects.js | Shared particle simulation, scene draws and body/camera recoil |
| dist/impact-audio.js / dist/audio.js | Original collision waveforms, sound distance/pan and transient lifecycle |
| assets-src | Editable Blender scenes, original authoring scripts and previews |
| tests | Driving, exported geometry and scene integration checks |
| BUILD-REPORT.md | Actual checks, measured bounds and remaining verification limits |
| THIRD-PARTY-LICENSES.md | Texture and renderer credits |

Node.js 22 or later; no npm installation is required:

```sh
npm test
npm run check
npm run check:model
npm run check:world
node --loader ./tests/three-resolver.mjs scripts/benchmark.mjs
```

The source contains 26 editable Blender scenes, including new masonry barrier/chunk and exposed chassis prototypes. Cockpit renders are in `assets-src/cockpit/previews`; they use the actual shipped GLBs and driver poses, on a simple road for placement inspection. Accepted exterior car GLBs retain their complete intact geometry; the scenery kit gains three original exports. Runtime separates painted roof triangles for interior visibility, then restores them in every outside view. The player cabin shares geometry and materials across restarts.

The brighter title background, `dist/assets/ui/title-v2.jpg`, was generated with builtin Imagegen using the original Apex thumbnail as its reference. The exact prompt is in `assets-src/title-art-prompt.txt`. It is marketing artwork; garage thumbnails and scenery panels remain renders of the authored models.

## Reference and limits

This is an original approximation of the footage's visible silhouettes and day/night forest and alpine atmosphere, not an exact recreation of its commercial models or map. Ninety-seven samples across the full 16:05 MP4 were inspected, rather than every video frame. Hidden geometry is reconstructed. The circuit, interface and sound remain original.

Blender previews verify authored geometry and materials; they are not screenshots of the browser game. GPU appearance, transparency sorting, physical gamepads and FPS have not been verified in a browser in this environment. Wet-road reflections use the selected environment; dynamic nearby-car/tree reflections are not implemented. Career, upgrades, player tuning, additional routes and touch driving remain future work. The included benchmark measures Node CPU and geometric camera visibility, not browser GPU FPS. See BUILD-REPORT.md for before/after results and limits.

The hosting configuration identifies the existing Site. Change or remove it before publishing to a different project.


Optional damage visual checks use the actual runtime meshes:

```sh
node --loader ./tests/three-resolver.mjs assets-src/prepare_destruction_preview.mjs /tmp/harbor-damage
blender --background --factory-startup --python assets-src/render_destruction.py -- /tmp/harbor-damage
```

`assets-src/wilderness/destruction-preview.jpg` compares intact, dented and detached front/side geometry. It is a Blender CPU render, not a browser screenshot. Damage is an arcade deformation/fracture layer; a full soft body chassis, debris-to-car collisions and tire detachment are not implemented. Browser GPU appearance, audible balance and actual FPS remain hardware checks.
