# CrowPanel Home Dashboard

A standalone touchscreen home dashboard experiment for the Elecrow CrowPanel DIS05035H V2.2.

## Goal

Turn the CrowPanel into a small, glanceable home information screen, independent from PonyGotchi. This experiment must not change Rosy's game, save data, SD-card assets, touch calibration, or existing firmware configuration.

## First playable milestone

- Full-screen portrait home screen with a clear digital clock and date.
- Large touch zones to switch between a home view and a simple information view.
- Calm animated background with restrained motion.
- Clear offline state when network data is unavailable; no fabricated weather or sensor readings.
- Keep rendering responsive on the ESP32 and avoid large frame buffers where possible.

## Later extensions

- Optional local weather when Wi-Fi and a reliable data source are configured.
- Optional indoor temperature / humidity when a compatible sensor is connected.
- User-selectable themes and brightness controls.
- Persistent settings, stored separately from PonyGotchi saves.

## Hardware constraints

- Target: Elecrow CrowPanel DIS05035H V2.2 (ESP32-WROVER-B).
- Display: portrait 320 × 480, ILI9488.
- Touch and SD-card wiring must remain unchanged unless independently verified.
- Never format the SD card, erase existing resources, or flash the physical panel automatically.

## Development rules

1. Keep this experiment isolated in its own branch and directory.
2. Do not merge into `main` or PonyGotchi without explicit review.
3. Reuse the known-good display configuration rather than guessing pins or frequencies.
4. Build and test in simulation/CI first; report physical-device validation separately.
5. Every iteration should deliver a visible, usable improvement rather than documentation-only progress.

## Current status

Concept branch created. No firmware changes or physical-device tests have been made yet.
