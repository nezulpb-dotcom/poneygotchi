from pathlib import Path
from struct import pack
from PIL import Image

root = Path(__file__).resolve().parents[1]
output = root / "CrowPanel" / "sd_files"
worlds = ("day", "dusk", "night")
room_top, room_end = 192, 429


def rgb565(image):
    # ESP32 reads native little-endian words; TFT_eSPI sends RGB565 with swapBytes(true).
    pixels = bytearray()
    for red, green, blue in image.convert("RGB").getdata():
        pixels.extend(pack("<H", ((red >> 3) << 11) | ((green >> 2) << 5) | (blue >> 3)))
    return pixels


backgrounds = []
for world in worlds:
    with Image.open(root / "assets" / "backgrounds" / f"meadow_{world}.png") as image:
        if image.size != (320, 480):
            raise ValueError(f"Unexpected dimensions: {image.size}")
        backgrounds.append(image.convert("RGBA"))
        (output / f"{world}.raw").write_bytes(rgb565(image))

# Blend in RGBA before quantizing. Each room stores one opaque band per world.
for action in ("eat", "play", "wash", "sleep", "pet"):
    with Image.open(root / "studio" / "assets" / "rooms" / f"{action}.png") as room:
        layer = room.convert("RGBA").crop((0, room_top + 8, 320, room_end + 8))
        patch = bytearray()
        for background in backgrounds:
            band = background.crop((0, room_top, 320, room_end))
            patch.extend(rgb565(Image.alpha_composite(band, layer)))
        (output / f"room_{action}.raw").write_bytes(patch)
