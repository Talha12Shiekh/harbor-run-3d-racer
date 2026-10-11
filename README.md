# Harbor Run

An original detailed 3D city circuit racer inspired by early arcade street racing. Two laps, three rivals, four traffic cars, nitrous, Speedbreaker, keyboard and standard gamepad input. Detailed car geometry, photo asphalt and brick textures, reflections, shadows, framed windows and street props are included locally.

## Play locally

Python 3 can serve the game without installation or compilation:

```sh
cd dist
python3 -m http.server 8080
```

Open http://localhost:8080 in a desktop browser with WebGL and hardware acceleration. Opening index.html directly with a file URL does not support the module and asset loading workflow. The first load is approximately 15 MB. There are no runtime CDN requests.

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
| dist/world.js | Detailed model preparation, city geometry, lighting, camera and rendering |
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
```

The model geometry check stubs image bitmap metadata for Node. It does not test GPU texture upload. See BUILD-REPORT.md for exact verification and remaining limits.

## Scope and limitations

This first release contains one original circuit and one detailed car model reused with different paint for racers and traffic. It is not a full commercial game recreation. Police pursuits, career, additional vehicle models, upgrades and touch driving remain later work. GPU visual quality, actual gamepad hardware and frame rate have not been verified in a real browser in this environment. Geometry and simulation checks passed.

All editable code and required assets are included. See THIRD-PARTY-LICENSES.md and upstream license files before redistribution. The hosting configuration identifies the existing private Site; change or remove it before publishing under a different project.
