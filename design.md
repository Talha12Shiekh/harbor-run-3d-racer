# Harbor Run

Current direction: the user authorized 1.6.0 steering, handling, pursuit and performance section in docs/specs/0001-city-racer/index.md. Earlier city/sedan choices remain historical rationale.

## Character

Forest highway and snowy mountain racing: detailed conifers, rock banks, layered terrain, wet asphalt, guardrails and utility lines. Original Blender vehicles follow the footage's blue hypercar, red open roadster and police interceptor families. Chase camera is low and close. Paint, glass, metal, tires and lamps use distinct physical surfaces and daylight reflections.

## Composition

Keep the amber Harbor Run wordmark, restrained instruments and dark garage panel over the real 3D scene. Top to bottom: route context, two-line heading, concise race copy, lap/racer/length facts, two labelled vehicle/setting selectors, paint row, primary start action, controls/settings/credits, records footer. The right-hand vehicle caption follows the selected body. Compact spacing on short viewports and scrolling prevent controls being cut off.

Racing fills the viewport. Position/lap are top left, time top right, map bottom left, speed and resource meters bottom right. Loading, error, pause and results retain complete existing overlays. Selectors apply in the garage and persist with validated settings.

## Tokens and accessibility

Authoritative values are in dist/style.css. Existing amber, cyan, dark surfaces, local Barlow and Barlow Condensed typography, focus indicators and reduced-motion support remain. The new choice surface derives from the existing settings control color. Use native labelled selects and clear focus states. Paint controls retain accessible names and selection state. Selecting options must not accidentally start a race through Enter key handling.

## 3D assets

All current model geometry is authored from scratch in Blender. Runtime geometry is exported GLB, reusable scenery is instanced, original terrain follows the unchanged circuit, and placements reject the driving corridor. Include original editable car scenes, scenery prototypes and composed forest/alpine scenes. Front is +Z at runtime; wheels rotate around centered X axles with front steering about Y. Cloned paint, brake and police emission materials belong to individual cars. The two player spotlights are attached to the player car and released on replacement. Switching scenery releases owned instances and surfaces while retaining shared geometry/maps.

## Responsive behavior and evidence

HUD contracts below 800px. Garage controls remain usable on narrow/short screens. Driving requires keyboard or standard gamepad. Reduced motion holds the garage camera still; reduced graphics disables shadows and lowers resolution. Blender renders show the authored kit, not browser GPU output. Exact commercial asset or map matching and AAA quality are not claimed.

## Midnight and expanded garage

The current enhancement is AC-19 through AC-23. Retain amber branding and cinematic views of the actual scene. Add an image backed title with a large condensed display headline, small edition/route labels, Enter Garage and a first visit optional driving briefing. A detailed garage combines labelled selectors with car thumbnails and three scene cards, selected car name/body description, six angle controls and the real best lap. Keep the car visible to the right; scrolling on short screens and a compact single column on small screens prevent overlap. Pause and results gain an actual road image strip and the same condensed display typography.

Barlow Condensed is the display face, Barlow is the body face, both local and OFL licensed. All imagery is rendered from the project Blender models. Do not use commercial game screenshots in shipped artwork. Dark blue night, warm roadside pools and cool headlights add a third setting while retaining forest and alpine. Night must illuminate the road, not only change the sky color. Vehicle controls display body style and the actual setup character and simulated speed cap, never arbitrary performance bars. Onboarding can always be skipped or revisited, and Enter/gamepad Start respects the visible screen.

## Circuit, Pursuit and performance

Add two image backed event buttons above the machine choices, using the existing original forest/interceptor artwork. Each exposes its selected state. Event facts, rules and Start label derive from the selected event. Keep the existing scrolling garage and selected car composition. The car caption adds the actual handling character.

Pursuit replaces position/lap with a compact heat/contact panel at the top left. Label every escape and bust meter with seconds; color is supporting information. The map plots actual active officers with red/blue dots. Results explicitly say Escaped or Busted and show event time/peak heat, with separate best escape records. Circuit keeps its familiar HUD and standings.

Auto/High/Reduced and an optional live performance checkbox belong in Settings. Stats use a small unobtrusive overlay only during play. The existing local fonts, images, amber/cyan palette, native labels, visible focus and reduced motion remain. Actual rendered responsive layout is a remaining browser check.
