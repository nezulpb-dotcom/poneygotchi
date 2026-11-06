"""Produce original open-to-edit placeholder pixel-art sprites for Rosy.
These are NOT traced from either reference image. All frames are RGBA PNGs.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageColor
import math

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'ponies' / 'rosy'
OUT.mkdir(parents=True, exist_ok=True)
P = dict(outline='#9b507b',body='#ffd1e9',shadow='#f3a8d1',light='#ffe9f4',mane='#ea76b9',mane_dark='#be4d91',mane_light='#ffb5de',eye='#413153',iris='#6254a5',hoof='#e88fbd')


def ellipse(q, b, fill, outline=None, width=1):
    q.ellipse(b, fill=fill, outline=outline, width=width)


def frame(state: str, index: int) -> Image.Image:
    im=Image.new('RGBA',(72,72),(0,0,0,0))
    q=ImageDraw.Draw(im)
    bob=[0,-1,0,1][index] if state not in ('sleep','sad') else 2
    stride=(-2,0,2,0)[index] if state=='walk' else 0
    eye_closed=state in ('blink','sleep') or (state=='happy' and index in (1,3))
    # tail behind body, with two-layer glossy curl
    ellipse(q,(7,32+bob,29,55+bob),P['outline'])
    ellipse(q,(9,32+bob,28,54+bob),P['mane_dark'])
    ellipse(q,(6,40+bob,22,62+bob),P['mane'])
    ellipse(q,(6,44+bob,19,59+bob),P['mane_light'])
    q.rectangle((11,49+bob,16,59+bob),fill=P['mane'])
    # back feet and alternating legs
    for x,step in [(26,stride),(44,-stride)]:
        bx=x+step
        ellipse(q,(bx,46+bob,bx+13,66+bob),P['outline'])
        ellipse(q,(bx+2,46+bob,bx+11,64+bob),P['body'])
        q.rectangle((bx+2,60+bob,bx+10,64+bob),fill=P['hoof'])
    # torso
    ellipse(q,(17,27+bob,58,57+bob),P['outline'])
    ellipse(q,(19,28+bob,56,54+bob),P['body'])
    ellipse(q,(25,34+bob,46,48+bob),P['light'])
    # neck and muzzle base
    ellipse(q,(42,19+bob,64,51+bob),P['outline'])
    ellipse(q,(43,19+bob,63,49+bob),P['body'])
    # ear tufts and ears
    q.polygon([(45,22+bob),(46,9+bob),(56,20+bob)], fill=P['outline'])
    q.polygon([(47,19+bob),(47,12+bob),(53,20+bob)],fill=P['light'])
    # mane behind fringe
    for cx,cy,r in [(43,21,10),(50,16,10),(57,18,9),(40,32,10),(38,42,8)]:
        ellipse(q,(cx-r,cy-r+bob,cx+r,cy+r+bob),P['outline'])
        ellipse(q,(cx-r+2,cy-r+2+bob,cx+r-2,cy+r-2+bob),P['mane'])
    ellipse(q,(48,9+bob,62,23+bob),P['mane_light'])
    ellipse(q,(52,14+bob,66,25+bob),P['mane'])
    # cheek / nose
    ellipse(q,(56,32+bob,70,45+bob),P['outline'])
    ellipse(q,(57,33+bob,69,43+bob),P['light'])
    ellipse(q,(56,34+bob,60,37+bob),'#f79fc8')
    if eye_closed:
        q.arc((57,25+bob,65,33+bob),0,160,fill=P['eye'],width=2)
    else:
        ellipse(q,(57,24+bob,64,33+bob),'#fff9ff',P['outline'])
        ellipse(q,(60,25+bob,64,32+bob),P['iris'])
        q.rectangle((62,26+bob,63,27+bob),fill='white')
    if state=='sad':
        q.arc((62,39+bob,68,44+bob),180,350,fill=P['outline'],width=1)
    else:
        q.arc((61,36+bob,69,42+bob),0,170,fill=P['outline'],width=1)
    # cutie mark: simple original heart
    q.polygon([(31,38+bob),(35,35+bob),(39,38+bob),(35,44+bob)],fill='#f06aab')
    q.rectangle((33,38+bob,37,41+bob),fill='#ffb8d6')
    if state=='eat':
        ellipse(q,(62,42+bob,69,49+bob),'#dd4c65',P['outline'])
        q.line((65,42+bob,67,39+bob),fill='#52945a',width=2)
    if state=='wash':
        for x,y,r in [(17,26,5),(23,13,4),(66,11,4),(56,3,3)]:
            ellipse(q,(x-r,y-r+bob,x+r,y+r+bob),None,'#c8f7fa',2)
    if state=='happy':
        q.text((62,8+bob),'♥',fill='#ffedf8')
    if state=='sleep':
        q.text((57,6+bob),'z',fill='#fff2fb')
        q.text((64,2+bob),'Z',fill='#fff2fb')
    return im.resize((144,144),Image.Resampling.NEAREST)

for state in ('idle','walk','blink','happy','eat','sleep','sad','wash'):
    for i in range(4):
        frame(state,i).save(OUT/f'{state}_{i:02d}.png', optimize=True)

print('Generated',len(list(OUT.glob('*.png'))),'sprite files')
