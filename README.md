# Harbor Run 1.4.0

An original 3D arcade racer with three Blender authored vehicles and forest/alpine scenery inspired by the supplied Hot Pursuit footage. Two laps, three rivals, four traffic cars, nitrous, Speedbreaker, keyboard and standard gamepad controls. All current vehicle and scenery geometry is authored for this project; the earlier downloaded sedan and city assets have been retired.

## Play

Use the published game, or serve `dist` on your own computer:

```sh
cd dist
python3 -m http.server 8080
```

Open http://localhost:8080 in a desktop browser with WebGL and hardware acceleration. File URLs cannot load the module/asset workflow. All assets are local; there are no runtime CDN requests. The shipped runtime is approximately 31 MB; cache and unused textures affect actual transfer.

In the garage, choose Mid-engine hypercar, Open road spyder or Road interceptor, then Redwood ridge or Summit pass. Choose paint and start. Selecting a car applies its reference-family paint; subsequent paint choices are independent. Existing valid settings and records survive. The interceptor has police lettering and a lightbar, and follows the same circuit rules as other cars.

Reduced graphics lowers resolution and disables shadows. Car, scenery, paint, quality, sound and records persist in browser localStorage when available.

## Controls and rules

| Action | Keyboard | Standard gamepad |
| --- | --- | --- |
| Accelerate | W or up | RT |
| Brake / reverse | S or down | LT |
| Steer | A/D or left/right | Left stick |
| Handbrake | Space | A |
| Nitrous | Shift | B |
| Speedbreaker | Q | X |
| Reset at last checkpoint | R | Y |
| Hold rear view | C | RB |
| Pause / resume | Escape | Start |
| Start race | Enter or menu button | Start |

Complete eight ordered forward checkpoints per lap, twice. Reverse crossings and skipped checkpoints do not count. Reset does not grant progress. Car contacts and road edges reduce speed. Records update only after completing the race. Changing tabs or disconnecting a controller pauses it. Nitrous recharges while driving; Speedbreaker slows the simulation to 40 percent while improving steering response.

Both scenery settings use the same original legal circuit. This update changes its presentation while preserving driving, collisions, checkpoints and best-time compatibility.

## Open and edit in Blender

Extract the entire source ZIP before opening files. Blender 4.5.3 LTS authored the included scenes. Textures are packed into the editable files.

| Editable file | Contents |
| --- | --- |
| assets-src/vehicles/hypercar.blend | Curved blue hypercar, canopy, interior, aero, lamps and wheels |
| assets-src/vehicles/spyder.blend | Red open cockpit spyder with windscreen and roll hoops |
| assets-src/vehicles/interceptor.blend | Rounded police car, original lettering and lightbar |
| assets-src/wilderness/forest-circuit.blend | Composed forest circuit with car and scenery |
| assets-src/wilderness/alpine-circuit.blend | Composed snowy circuit with roadster and scenery |
| assets-src/wilderness/*.blend | Thirteen independently editable scenery/road prototypes |

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
blender --background --factory-startup --python assets-src/render_wilderness.py
```

Add `-- --render` to the vehicle command for six views per car. The saved circuit and placement inputs are included, so these commands do not require Node or additional Python packages. If you change the circuit, run `node --loader ./tests/three-resolver.mjs assets-src/prepare_preview.mjs` before rebuilding its scenery/render. Optional `make_textures.py` regeneration requires Pillow and NumPy; all needed maps are already included.

## Source and verification

| File | Role |
| --- | --- |
| dist/sim.js | Driving, route, ordered checkpoints, race and profile validation |
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
```

## Reference and limits

This is an original approximation of the footage's visible silhouettes and forest/alpine atmosphere, not an exact recreation of its commercial models or map. Ninety-seven samples across the full 16:05 MP4 were inspected, rather than every video frame. Hidden geometry is reconstructed. The circuit, interface and sound remain original.

Blender previews verify authored geometry and materials; they are not screenshots of the browser game. GPU appearance, transparency sorting, physical gamepads and FPS have not been verified in a browser in this environment. Wet-road reflections use the daylight environment; dynamic nearby-car/tree reflections are not implemented. Police pursuit AI, career, tuning and touch driving are outside this circuit update.

The hosting configuration identifies the existing private Site. Change or remove it before publishing to a different project.
