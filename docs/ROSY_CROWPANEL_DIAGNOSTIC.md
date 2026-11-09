# CrowPanel: animation diagnostics for Rosy

Firmware branch: fix/rosy-animation-fallback-diagnostics (based on
fix/studio-compositing-care). Hardware: DIS05035H V2.2, ILI9488,
ESP32-WROVER-B.

## What changed

Previously, the 175 ms frame timer required a large composition
buffer. If allocation failed, Rosy remained still. The firmware now
renders 8-row RGB565 strips as a fallback. The timer already supports
HOME, CARE and MENU; it must not be restricted back to HOME.

Only the C++ firmware was changed. Backgrounds, microSD assets and
saved game data were NOT replaced.

## On-PC tests

Run from the repository root:

    python tests/test_rosy_animation_assets.py

This checks 32 frame offsets, data size, distinct moving frames and
the firmware fallback code. This is NOT a full Arduino compilation
or a hardware validation. Compile the sketch using the established
CrowPanel compile.ps1 script and the real ESP32 toolchain.

## On CrowPanel

After a successful compiled-firmware-only update, open Arduino IDE
Serial Monitor at 115200 baud (select the board COM port).

You should see these boot messages:

    [ANIM INIT] background=YES composer=YES width=320 freePSRAM=...
    [ANIM INIT] rosyCache=PSRAM bytes=1327104 frames=32 frameBytes=41472

Once each second while the home or care screen is visible:

    [ANIM] page=0 state=0 frame=1/4 x=... y=... ok=1 comp=RAM rosy=PSRAM

If the counter changes and ok=1, the firmware is drawing new frames,
though visible motion and frame rate must be checked on the LCD.
A [ANIM ERR] message or ok=0 indicates a read or rendering problem.
comp=STRIP or rosy=SD indicates the memory fallback path is active.

The historical Rosy asset contains identical frames for certain sleep
and sad states. This patch does not modify those graphics; enhancing
them requires a separate, verified rosy.raw upload.

Do not overwrite flash partitions other than the application or erase
NVS/calibration. Since this patch changes only source C++, it does not
require retransferring all 11 microSD files when those are already
verified on the device.
