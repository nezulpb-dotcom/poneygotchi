from pathlib import Path
import base64
import json

root = Path(__file__).resolve().parent
assets = {}

def embed(key, path):
    assets[key] = "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode("ascii")

for world in ("day", "dusk", "night"):
    embed(f"bg_{world}", root.parent / "assets" / "backgrounds" / f"meadow_{world}.png")

for folder, prefix in (("rooms", "room_"), ("rosy", ""), ("ui", "")):
    for path in sorted((root / "assets" / folder).glob("*.png")):
        embed(prefix + path.stem, path)

source = root / "src"
rules = json.loads((root.parent / "shared/fireflies.json").read_text(encoding="utf-8"))
template = (source / "template.html").read_text(encoding="utf-8")
preview = (
    template.replace("__CSS__", (source / "style.css").read_text(encoding="utf-8"))
    .replace("__IMAGES__", json.dumps(assets))
    .replace("__JS__", (source / "game.js").read_text(encoding="utf-8")
             .replace("__THEME__", (source / "theme.js").read_text(encoding="utf-8-sig"))
             .replace("__FIREFLIES__", json.dumps(rules)))
)
output = root / "preview.html"
output.write_text(preview, encoding="utf-8", newline="\n")
print(output)
