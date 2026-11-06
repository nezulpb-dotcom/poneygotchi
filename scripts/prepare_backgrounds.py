"""Prepare original background(s) at the exact 320x480 portrait target."""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageDraw
import random

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'assets'/'backgrounds'/'background_source.png'
OUT=ROOT/'assets'/'backgrounds'
if not SRC.is_file():
    raise SystemExit('Missing original background_source.png — see assets/README.md')
im=Image.open(SRC).convert('RGB').resize((320,480),Image.Resampling.LANCZOS)
im.save(OUT/'meadow_day.png',optimize=True)
twilight=ImageEnhance.Color(im).enhance(0.95)
twilight=Image.blend(twilight,Image.new('RGB',im.size,(140,97,173)),0.14)
twilight.save(OUT/'meadow_dusk.png',optimize=True)
night=ImageEnhance.Brightness(im).enhance(.54)
night=Image.blend(night, Image.new('RGB',im.size,(24,34,94)),0.27)
d=ImageDraw.Draw(night)
random.seed(812)
for _ in range(38):
    x=random.randrange(20,300);y=random.randrange(12,160);r=random.choice([0,0,1])
    d.ellipse((x-r,y-r,x+r,y+r),fill=(239,232,254))
night.save(OUT/'meadow_night.png',optimize=True)
print('Saved background day/dusk/night 320x480')
