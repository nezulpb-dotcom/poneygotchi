"""Linux x86_64 offline-capable Arduino installation, official artifacts + locked hashes.
Sources: Espressif package index 2.0.17, Arduino CLI 1.3.1 checksums,
Arduino ctags 5.8-arduino11 SHA512. No global installation or TLS bypass.
"""
import argparse
import hashlib
import json
from pathlib import Path
import platform
import shutil
import subprocess
import tarfile
import urllib.request
import zipfile
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--destination',type=Path,required=True)
parser.add_argument('--cache',type=Path,help='Optional cache of locked name.download archives')
args=parser.parse_args();base=args.destination.resolve()
if platform.system()!='Linux' or platform.machine()!='x86_64':raise SystemExit('This bootstrap is Linux x86_64 only; Windows: see INSTALL_WINDOWS.md')
lock=json.loads((ROOT/'firmware/toolchain-lock.json').read_text())
for name,artifact in lock.items():
    dest=base/('arduino-user/hardware/espressif/esp32' if name=='esp32' else 'bin' if name=='arduino-cli' else 'tools/'+name)
    marker=base/('verified-'+name+'.json')
    if marker.exists() and json.loads(marker.read_text())==artifact and dest.exists():continue
    if dest.exists() and any(dest.iterdir()):raise SystemExit(f'Preserve existing installation first: {dest}')
    base.mkdir(parents=True,exist_ok=True)
    archive=base/(name+'.download');print('Download and verify',name,flush=True)
    cached=args.cache/(name+'.download') if args.cache else None
    if cached and cached.exists():shutil.copyfile(cached,archive)
    else:
        with urllib.request.urlopen(artifact['url'],timeout=180) as response, archive.open('wb') as output:shutil.copyfileobj(response,output)
    algorithm,expected=artifact['checksum'].split(':');algorithm=algorithm.lower().replace('-','')
    if hashlib.new(algorithm,archive.read_bytes()).hexdigest()!=expected.lower():raise SystemExit(f'Integrity check failed: {name}')
    staging=base/('extract-'+name);staging.mkdir(exist_ok=False)
    if zipfile.is_zipfile(archive):
        with zipfile.ZipFile(archive) as z:z.extractall(staging)
    else:
        with tarfile.open(archive) as t:t.extractall(staging,filter='data')
    dest.parent.mkdir(parents=True,exist_ok=True)
    if name=='arduino-cli':
        dest.mkdir(exist_ok=True);shutil.move(str(staging/'arduino-cli'),dest/'arduino-cli');shutil.rmtree(staging)
    else:
        children=list(staging.iterdir());source=children[0] if len(children)==1 and children[0].is_dir() else staging
        shutil.move(str(source),dest)
        if staging.exists() and staging!=dest:staging.rmdir()
    marker.write_text(json.dumps(artifact))
(base/'arduino-data').mkdir(exist_ok=True)
for name,value in [('package_index.json',{'packages':[]}),('library_index.json',{'libraries':[]})]:
    path=base/'arduino-data'/name
    if not path.exists():path.write_text(json.dumps(value))
# This is a manual verified hardware installation, not an edited Boards Manager index.
config='directories:\n'+''.join(f'  {key}: {json.dumps(str(base/path))}\n' for key,path in [('data','arduino-data'),('downloads','downloads'),('user','arduino-user')])
(base/'arduino-cli.yaml').write_text(config)
library=base/'arduino-user/libraries/TFT_eSPI'
commit='317ce97e598c004d158b87d01940a31acfb3eced'
if not library.exists():subprocess.run(['git','clone','--depth','1','--branch','v2.5.33','https://github.com/Bodmer/TFT_eSPI.git',str(library)],check=True)
if subprocess.check_output(['git','-C',str(library),'rev-parse','HEAD'],text=True).strip()!=commit:raise SystemExit('Unexpected TFT_eSPI commit')
if subprocess.check_output(['git','-C',str(library),'status','--porcelain'],text=True).strip():raise SystemExit('TFT_eSPI has local modifications')
print('Verified toolchain ready. Use scripts/build_firmware.py --toolchain',base)
