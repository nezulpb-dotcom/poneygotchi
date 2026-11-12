"""Create a standalone offline HTML preview from the same modular source code.
No bundler and no network required; asset and script data are inlined for file://.
"""
from pathlib import Path
import base64
import json
import re

ROOT=Path(__file__).resolve().parents[1]
modules=[
 'src/core/game.js',
 'src/core/storage.js',
 'src/graphics/pony.js',
 'src/ui/panels.js',
 'src/core/memory-game.js',
 'src/core/petting.js',
 'src/main.js',
]

def uri(path):
    return 'data:image/png;base64,' + base64.b64encode((ROOT/path).read_bytes()).decode('ascii')

sprites={p.stem:uri(p.relative_to(ROOT)) for p in (ROOT/'assets/ponies/rosy').glob('*.png')}
backgrounds={key:uri(Path('assets/backgrounds')/f'meadow_{key}.png') for key in ('day','dusk','night')}
js='\n'.join((ROOT/p).read_text('utf-8') for p in modules)
js=re.sub(r'^import .*?;\s*$', '', js, flags=re.MULTILINE)
js=re.sub(r'^export\s+(?=(const|function|class))', '', js, flags=re.MULTILINE)
old="img.src = `./assets/ponies/rosy/${state}_${String(i).padStart(2, '0')}.png`;"
assert old in js
js=js.replace(old,"img.src = SPRITE_DATA[`${state}_${String(i).padStart(2, '0')}`];")
old_bg="$('landscape').style.backgroundImage = `url('./assets/backgrounds/meadow_${scene}.png')`;"
assert old_bg in js
js=js.replace(old_bg,"$('landscape').style.backgroundImage = `url('${BG_DATA[scene]}')`;")
js='const SPRITE_DATA = '+json.dumps(sprites,ensure_ascii=False,separators=(',',':'))+';\nconst BG_DATA = '+json.dumps(backgrounds,ensure_ascii=False,separators=(',',':'))+';\n'+js
css=(ROOT/'src/styles.css').read_text('utf-8')
css=css.replace("url('../assets/backgrounds/meadow_day.png')",f'url("{backgrounds["day"]}")')
html=(ROOT/'index.html').read_text('utf-8')
html=html.replace('<link rel="stylesheet" href="./src/styles.css">','<style>\n'+css+'\n</style>')
html=html.replace('<script type="module" src="./src/main.js"></script>','<script>\n'+js.replace('</script>','<\\/script>')+'\n</script>')
html=html.replace('src="./assets/ponies/rosy/idle_00.png"',f'src="{sprites["idle_00"]}"')
(RootOutput:=ROOT/'preview-offline.html').write_text(html,'utf-8')
print('Standalone preview:',RootOutput.stat().st_size,'bytes')
