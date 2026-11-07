"""Convert original PNGs to deterministic little-endian RGB565 for the SD card."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
BACKGROUNDS = {
    'day': 'e111ec6a4b4cc7ee58b6fbec722b262eb319e7c46039cb668c86087a64b45ad1',
    'dusk': 'afc19cda8a3c1f0057c28c4f49ef84dd1dff9322e15dc60e397c13428c15aef6',
    'night': 'e2a56576def38e6bcf0c9d60f1e02b05ca5a6ff573eb2b35c4524bdad6408dc8',
}
def convert(source, dest, size):
    image = Image.open(source).convert('RGBA')
    if image.size != size:
        raise ValueError(f'{source}: expected {size}, got {image.size}')
    words = []
    for r,g,b,a in image.getdata():
        word = ((r>>3)<<11)|((g>>2)<<5)|(b>>3)
        # Keyed transparency; preserve near-magenta opaque pixels without a collision.
        words.append(0xF81F if a<128 else 0xF81E if word==0xF81F else word)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(struct.pack('<'+'H'*len(words), *words))
def build(output):
    for scene, digest in BACKGROUNDS.items():
        path=ROOT/f'assets/backgrounds/meadow_{scene}.png'
        if hashlib.sha256(path.read_bytes()).hexdigest()!=digest:
            raise ValueError(f'Validated background changed: {path}')
        convert(path, output/f'bg_{scene}.raw', (320,480))
    for source in sorted((ROOT/'assets/ponies/rosy').glob('*.png')):
        convert(source, output/(source.stem+'.raw'), (144,144))
    manifest={p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(output.glob('*.raw'))}
    (output/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print(f'{len(manifest)} RGB565 assets exported to {output}')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=ROOT/'.build/sd/ponygotchi')
    build(parser.parse_args().output)
