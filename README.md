# Harbor Run 1.6.0

An original 3D arcade racer with five Blender authored vehicles, daylight forest/alpine scenery and a night forest setting inspired by the supplied Hot Pursuit footage. Circuit racing and police pursuits, four traffic cars, distinct handling, nitrous, Speedbreaker, keyboard and standard gamepad controls. All current vehicle and scenery geometry is authored for this project; the earlier downloaded sedan and city assets have been retired.

## Play

Use the published game, or serve `dist` on your own computer:

```sh
cd dist
python3 -m http.server 8080
```

Open http://localhost:8080 in a desktop browser with WebGL and hardware acceleration. File URLs cannot load the module/asset workflow. All assets are local; there are no runtime CDN requests. The shipped runtime is approximately 36 MB; cache and unused textures affect actual transfer.

Enter the garage from the cinematic title. The optional first visit briefing can be skipped or reopened later. Choose Apex H1 (hypercar), Strada S2 (open spyder), Sentinel I3 (interceptor), Kestrel R4 (rally sedan) or Vanguard M5 (muscle coupe). Thumbnail buttons and labelled dropdowns choose the same body. Scene cards choose Redwood Ridge, Summit Pass or Midnight Run. Choose paint, inspect front/rear/both sides/angled/orbit camera views and start. Car changes apply that body's default finish; subsequent paint choices are independent. Existing valid settings and best times survive.

Midnight Run adds a procedural night sky, cool moonlight, 32 original roadside lamps, four nearby warm light pools, two player headlights and brighter rear lamps. Selecting daytime restores daytime lighting and sky. Each car now has its own arcade acceleration, braking, steering, grip, drift, mass and speed limits. The garage describes the actual driving character. These are original game balance values, not real manufacturer specifications.

Choose Circuit or Pursuit above the garage car choices. Circuit keeps the two lap race. Pursuit adds actual interceptor patrols, reinforcements, contact distance, escape and bust timers, flashing lights and a synthesized siren.

Auto graphics responds to sustained frame rate by changing resolution within a .65 to 1.5 pixel ratio cap, and can disable shadows when resolution reaches .8. High keeps full configured quality; Reduced stays .8 with shadows off. Settings can show live FPS, draw calls, triangles and resolution during play. These are measured in your browser. Spatial scenery batches retain all original placements and let the camera cull distant/outside batches.

Car, event, scenery, paint, briefing completion, graphics, sound, stats display and valid records persist in browser localStorage when available.

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
| Hold rear view | C | RB |
| Pause / resume | Escape | Start |
| Advance title/briefing or start race | Enter or menu button | Start |

Complete eight ordered forward checkpoints per lap, twice. Reverse crossings and skipped checkpoints do not count. Reset does not grant progress. Car contacts and road edges reduce speed. Records update only after completing the race. Changing tabs or disconnecting a controller pauses it. Nitrous recharges while driving; Speedbreaker slows the simulation to 40 percent while improving steering response.

Pursuit starts with one officer. Reinforcements arrive at 20 and 45 simulation seconds, up to heat three. Active police drive physically and do not teleport. After the first 20 seconds, maintain more than 120 metres of separation from every active patrol while moving above 21.6 km/h for eight uninterrupted seconds to escape. Staying below 18 km/h within 10 metres of a patrol for four seconds causes a bust. Separation resets escape progress; leaving low speed contact drains the bust timer. Speedbreaker slows all event timers along with the simulation.

Circuit recovery returns to the last checkpoint without progress. Pursuit recovery stays at the current road segment, clears escape progress, retains bust progress and leaves officers untouched. Escaped pursuits update only the separate best escape record; busted pursuits do not set a record. Circuit lap/race times remain.

All three scenery settings use the same original legal circuit. The steering direction is corrected for the actual chase camera. Collision impulses now exchange closing momentum instead of applying a repeated speed penalty to cars already touching.

## Open and edit in Blender

Extract the entire source ZIP before opening files. Blender 4.5.3 LTS authored the included scenes. Textures are packed into the editable files.

| Editable file | Contents |
| --- | --- |
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
blender --background --factory-startup --python assets-src/build_wilderness.py
blender --background --factory-startup --python assets-src/build_night.py
blender --background --factory-startup --python assets-src/render_wilderness.py
blender --background --factory-startup --python assets-src/render_ui.py
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

## Reference and limits

This is an original approximation of the footage's visible silhouettes and day/night forest and alpine atmosphere, not an exact recreation of its commercial models or map. Ninety-seven samples across the full 16:05 MP4 were inspected, rather than every video frame. Hidden geometry is reconstructed. The circuit, interface and sound remain original.

Blender previews verify authored geometry and materials; they are not screenshots of the browser game. GPU appearance, transparency sorting, physical gamepads and FPS have not been verified in a browser in this environment. Wet-road reflections use the selected environment; dynamic nearby-car/tree reflections are not implemented. Career, upgrades, player tuning, additional routes and touch driving remain future work. The included benchmark measures Node CPU and geometric camera visibility, not browser GPU FPS. See BUILD-REPORT.md for before/after results and limits.

The hosting configuration identifies the existing Site. Change or remove it before publishing to a different project.
