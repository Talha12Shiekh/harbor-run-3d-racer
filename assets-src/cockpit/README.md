# Original driver cabin

`cockpit.blend` is the editable Blender 4.5.3 scene. `build_cockpit.py` exports the real dashboard, windshield trim, console, vents, wheel and dials to the shipped `cockpit.glb`. The kit has 24,892 triangles. `CockpitSteering`, `SpeedNeedle` and `RpmNeedle` are independent animation pivots; `CockpitFrame` and `CockpitHeader` adapt the framing to each driver eye. The open spyder has no roof header.

`render_cockpit.py` imports the shipped car/cabin GLBs, normalizes them like the game, and reads the driver positions and roof visibility regions from `dist/cameras.js`. Five daytime views, an illuminated night view and the front three quarter tracking pose are in `previews`. They demonstrate asset placement on a simple road. These are Blender renders, not browser screenshots, layout verification or performance measurements. Night lighting follows the original authoring scene; Cycles and WebGL lighting differ.

Exterior car files are unchanged. The game separates the existing painted roof triangles at load time so they can hide only in the interior view. All exterior triangles and original cabins/glazing restore in exterior and held rear views. Driver trim, wheel and gauges share geometry/materials across restarts.
