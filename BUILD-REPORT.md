# Harbor Run 1.5.0 verification report

Date: 2026-10-11.

## Result

The front view screenshot exposed lamp housings that intersected the painted hood. Two triangle probes were 37.7 and 39.9 mm beneath the surface. Original Blender lamp housings now subdivide and follow the hood, with projector cups, dark gaskets, continuous running lights and recessed bumper apertures. A closed lip connects the splitter to the nose. Accepted rear proportions remain, with added hood/engine cover seams and louvres.

The five original cars are Apex H1, Strada S2, Sentinel I3, Kestrel R4 and Vanguard M5. Kestrel is a taller four door rally sedan with red five spoke wheels, contrasting stripes and a high wing. Vanguard has a long hood, two door cabin, round lamps, wide grille, twin hood stripes and ducktail. Every current mesh is authored for this project in Blender, without downloaded geometry.

Midnight Run is a third presentation of the unchanged forest circuit. Original roadside lamp geometry, procedural night sky, cool moonlight, two attached player headlights, four nearby warm road spotlights and stronger tail lamps create its night presentation. Day/night switching restores the correct sky, reflection texture, fog and light values. The light pool stays fixed in size rather than creating a light for every pole. Player headlights do not cast extra shadow maps.

Menus now have a cinematic title, optional first visit briefing, five thumbnail choices, three scene cards, labelled dropdowns, a detailed selected car caption, six camera choices and image headers on pause/results. Local Barlow and Barlow Condensed fonts use OFL licenses. Artwork is rendered from the actual original Blender models, not copied game screenshots. Enter and gamepad Start respect the visible onboarding screen.

## Exported geometry

| Vehicle | Runtime width × height × length, metres | Triangles |
| --- | --- | --- |
| Apex H1 | 2.284 × 1.167 × 4.600 | 92,129 |
| Strada S2 | 2.264 × 1.177 × 4.600 | 90,863 |
| Sentinel I3 | 2.304 × 1.331 × 4.600 | 97,509 |
| Kestrel R4 | 2.182 × 1.471 × 4.600 | 78,444 |
| Vanguard M5 | 2.187 × 1.336 × 4.600 | 78,776 |

Widths include mirrors. Every body has four grounded wheel pivots, stationary calipers, front/rear lamps, glazing, separate paint/brake material ownership and finite positions/normals. Body styles share the unchanged arcade physics. No differing performance rating is advertised.

| Setting | Clear scenery placements | Kit batches including road/terrain | Instanced triangles |
| --- | --- | --- | --- |
| Redwood Ridge | 1,073 | 19 | 3,293,736 |
| Summit Pass | 1,072 | 14 | 3,269,096 |
| Midnight Run | 1,105 | 22 | 3,383,720 |

These figures exclude cars, lights, signs, skids and UI. Night includes 32 lamp instances. All placements are deterministic and leave the driving corridor clear at corners, edge midpoints and center bounds probes. Terrain remains below every legal track sample. All settings preserve the same checkpoints and two lap race.

## Completed verification

* `npm test`: 18 tests pass. Twelve cover the existing driving/race rules. Three cover valid choices, legacy records and onboarding persistence. Three execute the actual app event handlers in a DOM fixture through title, skip/continue briefing, car/scene selection, returning drivers, camera choices and Enter/gamepad Start into the real countdown. The fixture is not a browser layout or physical gamepad test.
* `npm run check:model`: 12 scene tests pass plus assertions against all five GLBs. A ray test compares the exported headlamp housing points with the actual painted hood, requiring over 10 mm of clearance. Other checks cover grounded wheels, spin/steering, paint/brake isolation, selected geometry, five rival/traffic bodies, restarts, cameras, night headlight direction/intensity and a complete legal race. GPU rendering is stubbed.
* `npm run check:world`: all fourteen GLBs load with finite geometry, expected bounds/materials and triangle totals. Three complete placement sets stay clear. Five real environment switches restore sky/reflections/light settings, release old roots and preserve shared assets. Invalid saved choices fall back safely without erasing valid paint or records.
* `npm run check`: eleven runtime modules parse; local imports, UI IDs, vehicle/setting imagery, font URLs, GLBs and hosting configuration resolve.
* `scripts/check-images.py`: 21 external and 29 embedded runtime images decode. Both original needle opacity maps retain transparent gaps and 45.5 percent coverage.
* Thirty Blender vehicle views were reviewed in a six angle catalog. New sedan/coupe cabins gained inset windows and substantial painted pillars after the first render review. Night emitters were moved outside their housings and broad cool preview fill was added after lighting review. Forest/alpine/night previews, five thumbnails and title artwork were rendered from the actual original scenes.
* `git diff --check` passes. Runtime static assets are approximately 36 MB. Transfer and GPU memory depend on which assets are loaded and cached.

## Editable sources

Five vehicle scenes, fourteen scenery/road/lamp prototypes and three composed circuits make 22 editable `.blend` files. Original vehicle and scenery scripts, the new night asset script, original sky generation, three placement inputs, multi angle views and menu rendering scripts are included. Textures are packed where applicable. No reference gameplay frames or manufacturer photos are shipped as game artwork.

`Rebuild-Blender-Assets.ps1` finds the user's installed Blender or accepts an explicit path. RenderVehicles generates all six views and the garage thumbnails. RenderScenes generates scene cards/title and composed circuits. Blender 4.5.3 CLI builds/renders were run here; the Windows wrapper was reviewed but not executed on Windows.

## Limits

Supported browser preview control is unavailable in this managed workspace. Browser GPU appearance, texture upload, transparency sorting, final responsive layout, physical controllers and FPS remain unverified. CPU scene and DOM fixtures cannot establish those outcomes. Blender previews use path tracing and broad fill; they show authored models and composition, not the browser render.

References are the supplied screenshots/MP4, official manufacturer photos and EA media/manuals. This is an original approximation of those forms and atmosphere. Commercial model/map identity and exact visual matching are not claimed. Reflections come from the selected environment; dynamic nearby car/tree reflections are absent. Police pursuit AI, career, tuning and touch driving remain outside this circuit.
