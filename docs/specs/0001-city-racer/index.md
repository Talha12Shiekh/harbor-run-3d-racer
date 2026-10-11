# 0001 City racer

**Status**: In Progress
**Date**: 2026-10-11
**Authorized by**: User, Accept and build, then proceed with all remaining steps.

This restores the previously agreed spec after local workspace loss. It records the same accepted decisions.

## Requirements
AC-1: Browser based detailed 3D daylight city circuit with an imported sports car, photo textures, lighting and chase camera.
AC-2: Responsive arcade acceleration, brake, reverse, steering and handbrake with bounded road and car collisions.
AC-3: A real two lap race against three rivals with traffic, ordered checkpoints, elapsed time, lap times and finishing position.
AC-4: Usable nitrous and Speedbreaker meters, keyboard and standard gamepad controls, reset, rear view and pause.
AC-5: Menu, loading, error, HUD and results. Local best times and validated settings survive reload.
AC-6: Editable source, asset credits, verification report and playable deployment.

## Decision
Three.js 0.180.0 with imported detailed GLB car and photo asphalt and brick textures. Buildless static JavaScript, no backend. Physics uses a fixed 120Hz timestep and a spline track shared with rendered road geometry. Assets are freely reusable with attribution where required. Ordinary laptop performance is the target, with reduced graphics available, measured FPS remains to be verified.

## Feature design
Entities: track samples and eight checkpoint distances; cars with x, z, heading, speed, steer, slip, nitrous, breaker, checkpoint and lap progress; race state menu, countdown, racing, paused, finished; profile version 1 with paint, quality, volume and best lap/race.

Value sources: speed from physical car velocity; gear from speed bands; position from completed gates and distance toward next gate; clock from race simulation elapsed time; lap from legal checkpoint crossings; nitrous and breaker from car resource state; records from completed races only; paint, quality and volume from validated localStorage.

No remote runtime requests, no account data in the game. Optional localStorage failure falls back to memory. Finishing requires sixteen ordered forward gate crossings. Reset returns to the last legal checkpoint without increasing progress. Pausing stops clocks and meters.

Menu composition, HUD and visuals follow design.md. Audio is synthesized engine, wind and skid sound. Control mappings are documented in README.md.

## Build plan
- [x] AC-1: Restore detailed model, photo textures, road and street detail.
- [x] AC-2, AC-3: Restore driving, collisions and race rules.
- [x] AC-4, AC-5: Restore controls, meters, menus and profile.
- [x] AC-2, AC-3, AC-5: Run simulation and model geometry checks.
- [ ] AC-6: Publish and package editable source with credits.

## Consequences
This first release is a circuit. Police pursuits, career, vehicle upgrades, additional cars and touch driving remain later work. It is not a reproduction of branded cars, music or original game assets. GPU rendering, controller hardware and frame rate need real browser verification when supported tooling is available.
