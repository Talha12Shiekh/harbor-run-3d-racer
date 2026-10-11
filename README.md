# Harbor Run

An original detailed 3D city circuit racer inspired by early arcade street racing. Two laps, three rivals, four traffic cars, nitrous, Speedbreaker, keyboard and standard gamepad input. Detailed car geometry, photo asphalt and brick textures, reflections, shadows, Blender authored architecture, leafy trees, industrial bridges and street props are included locally.

## Play locally

Python 3 can serve the game without installation or compilation:

```sh
cd dist
python3 -m http.server 8080
```

Open http://localhost:8080 in a desktop browser with WebGL and hardware acceleration. Opening index.html directly with a file URL does not support the module and asset loading workflow. The first load is approximately 27 MB. There are no runtime CDN requests.

Use the game menu to start, choose paint, change graphics or sound, and view credits. Reduced graphics lowers resolution and disables shadows. No online account or backend is used. Best race, best lap, paint, graphics and sound volume are saved in browser localStorage when it is available.

## Controls

| Action | Keyboard | Standard gamepad |
| --- | --- | --- |
| Accelerate | W or up | RT |
| Brake, then reverse | S or down | LT |
| Steer | A/D or left/right | Left stick |
| Handbrake | Space | A |
| Nitrous | Shift | B |
| Speedbreaker | Q | X |
| Reset at last checkpoint | R | Y |
| Hold rear view | C | RB |
| Pause and resume | Escape | Start |
| Start race | Enter or menu button | Start |

Brake before sharp corners. Handbrake adds controlled slip. Nitrous recharges while driving. Speedbreaker slows the simulation to 40 percent while improving steering response. Resources do not change while paused. Changing tabs or disconnecting a controller pauses the race.

## Rules

Complete eight ordered forward checkpoints per lap, twice. Reverse crossings and skipped checkpoints do not count. Reset does not award checkpoint or lap progress. Car contacts and track edges reduce speed. The race finishes when the player completes two legal laps. Rivals still on course are marked On circuit in results. Records are updated only after a completed race.

## Source map

| File | Role |
| --- | --- |
| dist/sim.js | Pure driving, route, checkpoint, race and profile logic |
| dist/world.js | Car preparation, road surfaces, daylight, camera and rendering |
| dist/city.js | Blender asset loading and deterministic instance placement |
| assets-src | Editable Blender kit, texture generation and export scripts |
| dist/app.js | Input, menus, HUD, storage and fixed step orchestration |
| dist/audio.js | Procedural engine, wind and skid sound |
| dist/index.html and style.css | Interface and responsive styling |
| dist/assets | Detailed GLB model and photo textures |
| dist/vendor | Three.js 0.180.0 and required loaders |
| tests | Driving and model geometry verification |
| docs/specs/0001-city-racer | Restored accepted design and build progress |

## Validate

Node.js 22 or later is recommended. No npm installation is required.

```sh
npm test
npm run check
npm run check:model
npm run check:city
```

The model check includes eight scene integration tests for wheel steering and spin, paint, brake lamps, boost, cameras, skid transforms, restarts and a complete race. It stubs image bitmap metadata and the GPU render call for Node. It does not test GPU texture upload or browser visuals. See BUILD-REPORT.md for exact verification and remaining limits.

## Scope and limitations

This updated release contains one original circuit and one Blender authored street coupe reused with different paint for racers and traffic. It is not a full commercial game recreation. Police pursuits, career, additional vehicle models, upgrades and touch driving remain later work. GPU visual quality, actual gamepad hardware and frame rate have not been verified in a real browser in this environment. Geometry and simulation checks passed.

All editable code and required assets are included. See THIRD-PARTY-LICENSES.md and upstream license files before redistribution. The hosting configuration identifies the existing private Site; change or remove it before publishing under a different project.

## Blender asset authoring

The editable `assets-src/city-kit.blend` contains ten model sets arranged as a gallery. The game loads their GLB exports from `dist/assets/city`. Building façades face local positive Z after GLB export. Dimensions use metres.

Blender 4.5.3 LTS generated these assets. To regenerate, install Blender and Python with Pillow and NumPy, then run from the project root:

```sh
python3 assets-src/make_textures.py
blender --background --factory-startup --python assets-src/build_city.py
```

Add `-- --render` to the Blender command to render the verification street. `assets-src/scene-preview.png` is a Blender render of the asset kit, not a screenshot from the running game. The authoring scripts generate textured masonry, limestone, offices, towers, warehouses, two trees, a pipe bridge, a bus shelter and a hydrant. Asset instances share geometry and materials. The route, race rules and input mappings are unchanged.

## Vehicle authoring

The live game loads `dist/assets/tuner-coupe.glb`. Its editable Blender source is `assets-src/tuner-coupe.blend`. The model has curved body panels and wheel arches, separate glass and interior, five spoke wheels with tire detail, projector lamps, red rear lamps, grille fins, side skirts, a rear diffuser, twin exhausts and a rear wing. Original red and black vinyl remains distinct from selectable paint. Calipers stay fixed while wheels rotate.

```sh
python3 assets-src/make_car_vinyl.py
blender --background --factory-startup --python assets-src/build_car.py
```

Add `-- --render` for the front and rear asset renders. These use Blender Cycles, not the game renderer. Vehicle measurements and wheel naming are included in `dist/assets/tuner-coupe.json`. All racers and traffic share this model; there is no vehicle selection catalog. The earlier Concept Car GLB is retained as a credited baseline asset, but the game no longer loads it.
