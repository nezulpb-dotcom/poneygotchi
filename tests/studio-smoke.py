import base64
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.getenv("PONYGOTCHI_CHROMIUM"))
    page = browser.new_page(viewport={"width": 390, "height": 900}, has_touch=True)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.add_init_script("Math.random = () => 0.01")
    page.clock.install()
    page.goto((root / "studio" / "preview.html").as_uri())
    canvas = page.locator("#game")
    assert canvas.bounding_box()["width"] == 320
    assert canvas.bounding_box()["height"] == 480
    snapshot = lambda: page.evaluate("PonyGotchiDebug.snapshot()")
    def tap(x, y):
        box = canvas.bounding_box()
        page.touchscreen.tap(box["x"] + x * box["width"] / 320,
                             box["y"] + y * box["height"] / 480)
        page.wait_for_timeout(100)

    def capture(name):
        data = canvas.evaluate("(canvas) => canvas.toDataURL()")
        (root / "docs" / name).write_bytes(base64.b64decode(data.split(",")[1]))

    page.wait_for_timeout(400)
    assert snapshot()["screen"] == "home"
    position = snapshot()["petX"]
    page.wait_for_timeout(700)
    assert snapshot()["petX"] != position
    capture("studio_home.png")
    page.evaluate("""() => {
      const ctx = document.querySelector('#game').getContext('2d');
      window.transitionFrames = [];
      const until = performance.now() + 350;
      function sample(t) {
        window.transitionFrames.push(Array.from(ctx.getImageData(18, 153, 1, 1).data));
        if (t < until) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }""")
    tap(20, 200)
    assert snapshot()["screen"] == "care"
    page.wait_for_timeout(300)
    frames = page.evaluate("window.transitionFrames")
    assert len(frames) >= 3
    assert all(sum(pixel[:3]) > 30 for pixel in frames)
    capture("studio_care.png")
    tap(45, 465)
    assert snapshot()["hunger"] > 85
    tap(119, 465)
    assert snapshot()["joy"] == 100
    tap(192, 465)
    assert snapshot()["clean"] == 100
    tap(267, 465)
    assert snapshot()["energy"] == 100
    tap(snapshot()["petX"] + 72, 250)
    assert snapshot()["bond"] == 1
    tap(20, 200)
    assert snapshot()["screen"] == "home"
    tap(20, 200)
    tap(273, 156)
    assert snapshot()["screen"] == "menu"
    for x, y, destination in ((60, 380, "quests"), (160, 380, "explore"),
                              (250, 380, "games"), (60, 438, "shop"), (160, 438, "settings")):
        tap(x, y)
        assert snapshot()["screen"] == destination
        tap(70, 38)
        assert snapshot()["screen"] == "home"
        tap(20, 200)
        tap(273, 156)
    tap(250, 438)
    assert snapshot()["screen"] == "care"
    tap(20, 200)
    assert snapshot()["screen"] == "home"
    tap(20, 200)
    page.clock.fast_forward(12500)
    assert snapshot()["screen"] == "home"

    for selector, screen in (("#quick-quests", "quests"), ("#quick-shop", "shop"),
                             ("#quick-game", "games")):
        page.locator(selector).click()
        assert snapshot()["screen"] == screen
    tap(93, 215)
    assert snapshot()["screen"] == "arcade"
    tap(160, 446)
    assert snapshot()["screen"] == "games"
    tap(93, 340)
    assert snapshot()["screen"] == "fireflies"
    coins = snapshot()["coins"]
    level = snapshot()["level"]
    tap(100, 230)  # Taps during playback are ignored.
    page.wait_for_timeout(2700)
    for _ in range(3):
        tap(100, 230)
    page.wait_for_timeout(3400)
    tap(210, 230)
    assert snapshot()["fireflyBest"] == 1
    assert snapshot()["coins"] == coins + 3 + 12 * (snapshot()["level"] - level)
    tap(210, 230)
    assert snapshot()["coins"] == coins + 3 + 12 * (snapshot()["level"] - level)
    capture("studio_fireflies.png")
    tap(160, 445)
    page.evaluate("Math.random = () => 0.999")
    tap(220, 215)
    assert snapshot()["screen"] == "memory"
    for i in range(12):
        tap(66 + (i % 4) * 62, 218 + (i // 4) * 61)
    assert snapshot()["memoryBest"] == 6
    capture("studio_memory.png")
    tap(160, 445)
    tap(220, 340)
    assert snapshot()["screen"] == "garden"
    tap(220, 211)
    tap(220, 211)
    assert snapshot()["garden"][0]["wateredAt"] > 0
    page.evaluate("Date.now = (() => { const now = Date.now; return () => now() + 61000; })()")
    page.wait_for_timeout(150)
    tap(220, 211)
    assert snapshot()["harvests"] == 1
    capture("studio_garden.png")
    tap(286, 109)
    tap(20, 200)
    tap(273, 156)
    tap(160, 380)
    assert snapshot()["screen"] == "explore"
    tap(160, 410)
    page.wait_for_timeout(5000)
    assert len(snapshot()["discoveries"]) == 1
    tap(20, 200)
    tap(273, 156)
    tap(160, 438)
    assert snapshot()["screen"] == "settings"
    tap(260, 215)
    assert snapshot()["screen"] == "clock"
    tap(274, 378)
    tap(160, 438)
    assert snapshot()["screen"] == "settings"
    assert abs(snapshot()["clockOffset"]) > 1000
    page.reload()
    page.wait_for_timeout(400)
    assert len(snapshot()["discoveries"]) == 1
    assert abs(snapshot()["clockOffset"]) > 1000
    assert snapshot()["fireflyBest"] == 1
    assert snapshot()["memoryBest"] == 6
    assert snapshot()["harvests"] == 1
    assert not errors, errors
    print("Studio: home, Rosy movement, touch, care, quests, shop, four activities, exploration, clock and persistence; no JS errors")
