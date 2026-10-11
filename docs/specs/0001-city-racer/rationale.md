# Visual upgrade rationale

## Context
The user tested the first game and confirmed that it looks playable. Their supplied Harbor Run screenshot shows nearly identical brick facades, thick bright window trims, very clean sidewalks, solid low detail tree canopies and a grey sky. Two reference screenshots show varied stone and glass towers, transparent foliage silhouettes, industrial pipes, weathered concrete and asphalt cracks. These are the concrete gaps addressed by the upgrade.

## Options considered
Small material and light changes alone are inexpensive, but retain repeated architecture and solid canopies. A complete engine replacement would add migration work without supplying better assets. A Blender asset pipeline addresses geometry, UVs, materials and editable sources while keeping the working browser game.

## Rationale
The user explicitly authorized installing Blender and creating scenery assets. The selected pipeline exports a cohesive optimized asset kit and keeps the existing Three.js renderer. Materials, placement and lighting change together because moving the same boxes into a Blender file would not solve the observed visual gap.

## Project sources
The three attached screenshots were inspected directly. Existing world.js, design.md and the first circuit spec provide current geometry, route and renderer constraints. Browser QA is unavailable under the managed Sites workflow. Blender asset renders will be reported separately from game rendering.
