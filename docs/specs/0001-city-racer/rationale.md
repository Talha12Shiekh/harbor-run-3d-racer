# Visual upgrade rationale

## Context
The user tested the first game and confirmed that it looks playable. Their supplied Harbor Run screenshot shows nearly identical brick facades, thick bright window trims, very clean sidewalks, solid low detail tree canopies and a grey sky. Two reference screenshots show varied stone and glass towers, transparent foliage silhouettes, industrial pipes, weathered concrete and asphalt cracks. These are the concrete gaps addressed by the upgrade.

## Options considered
Small material and light changes alone are inexpensive, but retain repeated architecture and solid canopies. A complete engine replacement would add migration work without supplying better assets. A Blender asset pipeline addresses geometry, UVs, materials and editable sources while keeping the working browser game.

## Rationale
The user explicitly authorized installing Blender and creating scenery assets. The selected pipeline exports a cohesive optimized asset kit and keeps the existing Three.js renderer. Materials, placement and lighting change together because moving the same boxes into a Blender file would not solve the observed visual gap.

## Project sources
The three attached screenshots were inspected directly. Existing world.js, design.md and the first circuit spec provide current geometry, route and renderer constraints. Browser QA is unavailable under the managed Sites workflow. Blender asset renders will be reported separately from game rendering.

## Earlier vehicle diagnosis, superseded by the sedan correction
The four new attachments were inspected directly. The game car has a rounded rear, a dominant dark rear window, thin lights and little bumper contrast. References show defined lamps, panel seams, road car proportions, detailed rims, a rear wing, bumper openings and contrasting vinyl.

The current Concept Car is 2.684 metres wide after normalization to 4.6 metres long. Generic shader overrides force its paint and glazing to similar surfaces. A shader only pass retains that silhouette. Reshaping it risks distorting wheels and panels. A separate Blender coupe supplies the selected proportions and preserves the wheel contract without changing the simulation.

## Latest sedan diagnosis and choice

The two latest attachments show the Harbor Run coupe and a gold modified Lancer Evolution IX sedan. The previous coupe choice was incorrect: its low cabin and oval lamps cannot match four doors, a taller roof and angular lamp housings. Improving its material would retain the wrong silhouette. Replacing the small asset boundary with a licensed sedan preserves the working simulation and city. The selected author notes that some details differ from the real car; this adaptation is not an exact commercial game replica.

A procedural sedan rewrite would give full authorship control but require substantial surface modeling and reference work. The independently authored sedan provides coherent sculpted panels and a real interior immediately, at the cost of attribution obligations and higher geometry count. Benit Kibabu's original author page and primary API identify CC Attribution 4.0; source metadata and checksum are retained with the FBX. A local Blender import and six renders establish the geometry choice.

The import initially lost material face indices while replacing slots, turning a front door dark. Preserving the indices corrected it. The first decal export used separate map1 and UVMap layers, so the active coordinates were all zero on decal faces. Renaming before joining corrected the failure. A runtime regression check compares exported and prepared UV arrays and requires a meaningful artwork span.

### Verified reference links

- Author and license: https://sketchfab.com/3d-models/mitsubishi-lancer-evolution-ix-ee88ad9414884bdabaf0658943ac339b
- Primary model metadata: https://api.sketchfab.com/v3/models/ee88ad9414884bdabaf0658943ac339b
- License: https://creativecommons.org/licenses/by/4.0/
- Manufacturer-authored brochure: https://xr793.com/wp-content/uploads/2023/04/2006-Mitsubishi-EVO-IX-AUS.pdf
- Front reference: https://images.coches.com/_vn_/mitsubishi/Lancer-Evolution-IX-FQ-360-2006-2007/mitsubishi_lancer-evolution-ix-fq-360-2006-07_r7.jpg?func=fit&h=508&w=768
- Side reference: https://cdn.autoc-one.jp/image/images/2515547/007_o.jpg
- Rear reference: https://www.a777aa77.ru/mitsubishi/2006-mitsubishi-lancer-evolution-9-ix-fq-360-5.jpg
- Supplied gameplay: https://www.youtube.com/watch?v=AJm-cwt0Ba8

YouTube metadata identifies a 16:05 Hot Pursuit video, rather than the game associated with the sedan screenshot. Initial web retrieval did not yield playable frames. Automated scene analysis covered only 0:00 to 4:41 and is partial, unverified scene evidence. The subsequently supplied local video allows direct sampled-frame inspection; its findings are recorded below. No extracted video or reference photograph is redistributed in the source archive.

### Direct attached-video inspection

The earlier attached MP4 was materialized and decoded locally. ffprobe reports 1280 by 720, 60000/1001 FPS and duration 965.293 seconds. FFmpeg decoded the video and extracted 97 samples at ten-second intervals; seven contact sheets spanning the entire duration were inspected. Labels are approximate sample times. This is sampled-frame inspection, not a claim of manually inspecting every frame or listening to every sound.

The footage shows a blue supercar on reflective forest roads at changing daylight, mountainous/snowy roads with a red convertible during an interception event, and a police supercar pursuit through forest routes. It includes vehicle selection, maps, unlocks and results. The initial automatic report's scene labels and coverage were incomplete; direct frames supersede it.

Transferable presentation cues: a low, stable chase viewpoint; moderate changes in distance and FOV with speed; readable rear lamps against dark trim; coherent sky reflections on body panels; worn asphalt with spatially varied reflection strength; canopy shade and atmospheric separation. The city circuit retains its existing detailed scenery. A periodic original roughness map and modest clearcoat vary the road's daylight-environment sheen. This is PBR sky/environment reflection, not screen-space reflection of nearby cars or buildings. The video shows broader modes and terrain beyond this visual correction; no police/career system is added.

## Video becomes the primary target

The user reports that the sedan revision looks good but still differs from the video, and explicitly requests original Blender authoring rather than downloaded car geometry. The earlier city was original Blender geometry, but the wrong setting. Rebuilding all city detail alone would retain the visual mismatch. The chosen change replaces that art direction with forest/alpine layers and the three visible vehicle body types. Editable local assets and rebuild scripts satisfy the user's installed-Blender workflow without claiming access to their desktop.

A shader-only pass would retain the city/sedan mismatch. More downloaded car/scenery assets violate the new original-authoring preference. A game-engine migration would not supply the missing forms and would disturb working input/race behavior. Original Blender surface models and an instanced wilderness kit preserve that behavior while addressing silhouettes, road context and atmosphere.

Primary dimension references inspected for proportions: Koenigsegg Agera technical specifications, Porsche 918 Spyder manufacturer newsroom and Bugatti Veyron manufacturer brochure. The video car identities are treated as visual families rather than claiming exact manufacturer/game CAD replicas. No manufacturer photograph pixels are bundled.

Implementation evidence for the video direction: sixteen original GLB sets (three vehicles plus thirteen scenery/road assets), independently editable Blender prototypes and composed forest/alpine scenes. Roads and shoulders are exported original Blender geometry, preserving the simulation route. Foliage uses original procedural needle opacity maps with varied volumetric boughs; terrain color blends continuously. Manufacturer references inform approximate family proportions only; the delivered bodies are original reconstructions. No imported sedan/FBX remains in this source version.
