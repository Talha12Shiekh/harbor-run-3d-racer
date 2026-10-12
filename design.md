# Harbor Run

Current direction: the user authorized 1.7.1 text and control readability section in docs/specs/0001-city-racer/index.md. Earlier city/sedan choices remain historical rationale.

## Character

Forest highway and snowy mountain racing: detailed conifers, rock banks, layered terrain, wet asphalt, guardrails and utility lines. Original Blender vehicles follow the footage's blue hypercar, red open roadster and police interceptor families. Chase camera is low and close. Paint, glass, metal, tires and lamps use distinct physical surfaces and daylight reflections.

## Composition

Keep the amber Harbor Run wordmark, restrained instruments and dark garage panel over the real 3D scene. Top to bottom: route context, two-line heading, concise race copy, lap/racer/length facts, compact event, car and setting cards, paint row, primary start action, controls/settings/credits, records footer. The right-hand vehicle caption follows the selected body. Explicit compact car image heights replace the stretched 330 px HTML heights. At 1100 × 600 and larger, the header, choice groups, Start and footer fit one view. Smaller screens retain scrolling.

Racing fills the viewport. Position/lap are top left, time top right, map bottom left, speed and resource meters bottom right. Loading, error, pause and results retain complete existing overlays. Selectors apply in the garage and persist with validated settings.

## Tokens and accessibility

Authoritative values are in dist/style.css. Existing amber, cyan, dark surfaces, local Barlow and Barlow Condensed typography, focus indicators and reduced-motion support remain. The new choice surface derives from the existing settings control color. Use labelled choice buttons and clear focus states. Settings keep native labelled selects; duplicate garage dropdowns are hidden. Arrows navigate the visible choice groups through the real click handlers; Enter confirms the focused action. Paint controls retain accessible names and selection state. Selecting options must not accidentally start a race through Enter key handling.

## 3D assets

All current model geometry is authored from scratch in Blender. Runtime geometry is exported GLB, reusable scenery is instanced, original terrain follows the unchanged circuit, and placements reject the driving corridor. Include original editable car scenes, scenery prototypes and composed forest/alpine scenes. Front is +Z at runtime; wheels rotate around centered X axles with front steering about Y. Cloned paint, brake and police emission materials belong to individual cars. The two player spotlights are attached to the player car and released on replacement. Switching scenery releases owned instances and surfaces while retaining shared geometry/maps.

## Responsive behavior and evidence

HUD contracts below 800px. Garage controls remain usable on narrow/short screens. Driving requires keyboard or standard gamepad. Reduced motion holds the garage camera still; reduced graphics disables shadows and lowers resolution. Blender renders show the authored kit, not browser GPU output. Exact commercial asset or map matching and AAA quality are not claimed.

## Midnight and expanded garage

The current enhancement is AC-19 through AC-23. Retain amber branding and cinematic views of the actual scene. Add an image backed title with a large condensed display headline, small edition/route labels, Enter Garage and a first visit optional driving briefing. A detailed garage combines labelled selectors with car thumbnails and three scene cards, selected car name/body description, six angle controls and the real best lap. Keep the car visible to the right; scrolling on short screens and a compact single column on small screens prevent overlap. Pause and results gain an actual road image strip and the same condensed display typography.

Barlow Condensed is the display face, Barlow is the body face, both local and OFL licensed. Garage and scene imagery is rendered from the project Blender models. The 1.7 title/briefing use original Imagegen artwork referenced from the Apex render, with a bright car on the right and restrained left text scrim. Do not use commercial game screenshots in shipped artwork. Dark blue night, warm roadside pools and cool headlights add a third setting while retaining forest and alpine. Night must illuminate the road, not only change the sky color. Vehicle controls display body style and the actual setup character and simulated speed cap, never arbitrary performance bars. Onboarding can always be skipped or revisited, and Enter/gamepad Start respects the visible screen.

## Circuit, Pursuit and performance

Add two image backed event buttons above the machine choices, using the existing original forest/interceptor artwork. Each exposes its selected state. Event facts, rules and Start label derive from the selected event. Keep the selected car composition and compact the desktop garage into one view. The car caption adds the actual handling character.

Pursuit replaces position/lap with a compact heat/contact panel at the top left. Label every escape and bust meter with seconds; color is supporting information. The map plots actual active officers with red/blue dots. Results explicitly say Escaped or Busted and show event time/peak heat, with separate best escape records. Circuit keeps its familiar HUD and standings.

Auto/High/Reduced and an optional live performance checkbox belong in Settings. Stats use a small unobtrusive overlay only during play. The existing local fonts, images, amber/cyan palette, native labels, visible focus and reduced motion remain. Actual rendered responsive layout is a remaining browser check.

## Driving views and cockpit

Chase, Wide chase, front three quarter Tracking, Hood and Cockpit share the real event state. V/LB or the HUD button cycles them; bracket holds and HUD angle buttons rotate Tracking. C/RB is a temporary rear view. A 3D Blender kit provides a stitched dash, vents, console, wheel and emissive dials. Steering and needle pivots follow real controls and speed. Each body has its own eye and cabin lift; close windshield trim follows that eye, with no header on the open spyder.

The opaque exterior roof crossed the first driver projection. Split its painted triangles into a separately visible group at load time, without changing the original GLBs, total exterior geometry or silhouette. In Cockpit only, hide that group, the old leather cabin and glazing, and show the detailed interior. Restore them on switching away or holding rear view. Snap interior mode changes to avoid travel through the body. Shared cabin resources survive restarts; no mirror pass is added.

The desktop VIEW toolbar sits above the HUD help row. The briefing displays six control cards together. Local condensed display fonts, clear selection state and cyan keyboard focus apply throughout title, briefing, garage, pause and results. Native dialog fields retain native arrow behavior, and focus returns to the opening action. Held menu controls must release before they can drive the car.

## Readable controls and copy

The HUD groups camera, tracking angle, R reset, C rear view and Escape pause in one dark dock with clear key badges. Body and action text use Barlow; condensed type stays on headings and large instruments. Position, time, map, speed/resources and pursuit information have their own dark backing surfaces. Small labels have readable sizes without scaling the whole panel down. Narrow displays wrap the dock and use smaller instrument geometry while retaining text size.

Pause, results, error, controls, settings and credits have explicit bright text. Secondary and return actions are filled buttons, with the existing amber primary action retained. Title copy and its edition/footer labels have local backing surfaces so the bright car art remains visible while text stays clear. Garage captions and help labels are larger; desktop geometry is compact, with scrolling retained on smaller displays. On wide desktops 600 to 740 pixels tall, the briefing heading/intro share single lines and card margins tighten while control text remains 14 pixels.

Token values are authoritative in dist/style.css. The color calculation compares the actual foregrounds and surfaces, including translucent HUD backing over white. It cannot prove rendered geometry or appearance. The last cloud browser attempt reported its graphics renderer as Disabled.
