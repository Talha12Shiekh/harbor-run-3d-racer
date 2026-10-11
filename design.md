# Harbor Run

Current direction: the user-authorized 1.4.0 video world and original assets section in docs/specs/0001-city-racer/index.md. Earlier city/sedan choices remain historical rationale.

## Character

Forest highway and snowy mountain racing: detailed conifers, rock banks, layered terrain, wet asphalt, guardrails and utility lines. Original Blender vehicles follow the footage's blue hypercar, red open roadster and police interceptor families. Chase camera is low and close. Paint, glass, metal, tires and lamps use distinct physical surfaces and daylight reflections.

## Composition

Keep the amber Harbor Run wordmark, restrained instruments and dark garage panel over the real 3D scene. Top to bottom: route context, two-line heading, concise race copy, lap/racer/length facts, two labelled vehicle/setting selectors, paint row, primary start action, controls/settings/credits, records footer. The right-hand vehicle caption follows the selected body. Compact spacing on short viewports and scrolling prevent controls being cut off.

Racing fills the viewport. Position/lap are top left, time top right, map bottom left, speed and resource meters bottom right. Loading, error, pause and results retain complete existing overlays. Selectors apply in the garage and persist with validated settings.

## Tokens and accessibility

Authoritative values are in dist/style.css. Existing amber, cyan, dark surfaces, system sans typography, focus indicators and reduced-motion support remain. The new choice surface derives from the existing settings control color. Use native labelled selects and clear focus states. Paint controls retain accessible names and selection state. Selecting options must not accidentally start a race through Enter key handling.

## 3D assets

All current model geometry is authored from scratch in Blender. Runtime geometry is exported GLB, reusable scenery is instanced, original terrain follows the unchanged circuit, and placements reject the driving corridor. Include original editable car scenes, scenery prototypes and composed forest/alpine scenes. Front is +Z at runtime; wheels rotate around centered X axles with front steering about Y. Only cloned paint and brake materials belong to individual cars. Switching scenery releases owned instances and surfaces while retaining shared geometry/maps.

## Responsive behavior and evidence

HUD contracts below 800px. Garage controls remain usable on narrow/short screens. Driving requires keyboard or standard gamepad. Reduced motion holds the garage camera still; reduced graphics disables shadows and lowers resolution. Blender renders show the authored kit, not browser GPU output. Exact commercial asset or map matching and AAA quality are not claimed.
