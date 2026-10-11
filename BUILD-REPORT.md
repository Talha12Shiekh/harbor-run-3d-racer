# Harbor Run build report

Date: 2026-10-11

The accepted first city circuit was restored after the previous execution workspace disappeared. Earlier test results do not serve as verification of the restored source. The checks below were run on this restored build.

## Passed

npm test: 12 tests passed, zero failures. Coverage includes route continuity, acceleration and reverse bounds, nitrous and Speedbreaker bounds and recovery, road boundaries under held steering, car overlap separation, rejected reverse and skipped checkpoints, exactly sixteen gates for two laps, reset without progress, pause freezing, validated storage and minimum records, an AI driven legal race and a full race with three rivals plus four traffic cars.

npm run check: eight JavaScript modules parse, all local imports resolve, static UI bindings resolve, required assets exist and static hosting points at dist.

npm run check:model: the actual GLB parses with the vendored GLTFLoader and the same preparation code used by the game. The merged car contains 41 meshes and 213,229 triangles, four separate wheel groups, paint and brake materials, and finite coordinates. Dimensions after preparation: 2.684 metres wide, 1.213 metres tall and 4.6 metres long. Wheel pivots match their geometry centers.

Four JPEG files were decoded and verified with Pillow. Every image is 1024 by 1024. The model test uses a bitmap metadata stub for embedded images, so its result validates geometry and material structure, not GPU texture loading.

## Not exercised

No browser rendering, screenshot review, measured FPS, actual controller hardware or subjective driving feel was tested. The managed environment does not provide the browser control skill required by the Sites preview workflow. A preview server or substitute browser path was not started. The deployment result only proves publication, not rendered visual quality.

## Suggested manual verification

Start the game in a browser with hardware acceleration. Confirm the detailed car, city textures, shadows and reflection appear. Race two laps, use brake, reverse, handbrake, nitrous and Speedbreaker. Confirm checkpoints, lap timing and finishing position. Reset before and after a checkpoint and confirm progress is preserved without advancement. Pause and switch tabs, then verify the clock and resources did not advance. Test a standard gamepad, including disconnect pause. Complete a race, reload, and inspect retained records and settings. Compare high and reduced graphics and measure FPS on the intended laptop.

This is a first original circuit. Police pursuits, career and upgrades are outside the accepted first release.
