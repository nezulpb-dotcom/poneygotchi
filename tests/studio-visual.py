"""Capture and check the offline Studio renderer at its native resolution."""
import base64
from datetime import datetime
import os
from pathlib import Path
import sys

from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "docs/studio-render/after"
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.getenv("PONYGOTCHI_CHROMIUM"))
    page = browser.new_page(viewport={"width": 390, "height": 900}, timezone_id="Europe/Brussels")
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.add_init_script("Math.random = () => 0.5")
    page.clock.install(time=datetime.fromisoformat("2026-11-08T12:00:00+01:00"))
    page.goto((root / "studio/preview.html").as_uri())
    canvas = page.locator("#game")
    box = canvas.bounding_box()
    assert (box["width"], box["height"]) == (320, 480)
    page.evaluate(r"""async () => {
      await Promise.all(Object.entries(PONY_IMAGES).map(async ([name, uri]) => {
        const image = new Image();
        image.src = uri;
        await image.decode();
        const size = name.startsWith('bg_') || name.startsWith('room_') ? [320, 480]
          : /_\d$/.test(name) ? [144, 144] : null;
        if (size && (image.width !== size[0] || image.height !== size[1])) throw Error(name);
      }));
    }""")

    def shot(name):
        data = canvas.evaluate("(canvas) => canvas.toDataURL()")
        (out / f"{name}.png").write_bytes(base64.b64decode(data.split(",")[1]))

    def pixel(x, y):
        return canvas.evaluate("(canvas, [x,y]) => Array.from(canvas.getContext('2d').getImageData(x,y,1,1).data)", [x, y])

    def set_hour(hour):
        page.clock.set_fixed_time(datetime.fromisoformat(f"2026-11-08T{hour:02}:00:00+01:00"))
        page.wait_for_timeout(100)

    colors = []
    for hour, world in ((12, "day"), (19, "dusk"), (22, "night")):
        set_hour(hour)
        colors.append(pixel(1, 400))
        shot(world)
    assert len({tuple(color) for color in colors}) == 3

    set_hour(12)
    page.evaluate("PonyGotchiDebug.open('care')")
    page.wait_for_timeout(100)
    shot("hud")
    for action in ("eat", "play", "wash", "sleep", "pet"):
        page.evaluate("(action) => PonyGotchiDebug.care(action)", action)
        page.wait_for_timeout(260)
        shot(action)
        if action == "sleep":
            assert pixel(1, 400) == colors[2]
            page.clock.fast_forward(3500)
            page.wait_for_timeout(100)
            assert pixel(1, 400) == colors[0]

    page.clock.fast_forward(2700)
    page.evaluate("PonyGotchiDebug.open('menu')")
    page.wait_for_timeout(200)
    shot("menu")
    assert not errors, errors
    print("Studio: assets décodés, cycle automatique, retour de la sieste et captures 320 × 480")
