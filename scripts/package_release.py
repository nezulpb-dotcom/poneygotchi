"""Package only a successfully compiled firmware with its preview and SD assets."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import zipfile
ROOT=Path(__file__).resolve().parents[1]
version=json.loads((ROOT/'package.json').read_text())['version']
build=ROOT/'.build/firmware'
if not (build/'compile.log').exists() or not (build/'build-success.json').exists():
    raise SystemExit('A successful Arduino build is required before packaging')
proof=json.loads((build/'build-success.json').read_text())
if proof['exit_code']!=0:raise SystemExit('Build was not successful')
for path,digest in proof['inputs'].items():
    if hashlib.sha256((ROOT/path).read_bytes()).hexdigest()!=digest:raise SystemExit('Rebuild changed source: '+path)
for name,digest in proof['binaries'].items():
    if hashlib.sha256((build/name).read_bytes()).hexdigest()!=digest:raise SystemExit('Invalid binary: '+name)
if len(sys.argv)!=2:raise SystemExit('Usage: python scripts/package_release.py PATH_TO_ARDUINO_ESP32_2.0.17')
core=Path(sys.argv[1])
staging=ROOT/'.build'/f'PonyGotchi-{version}'
if staging.exists():shutil.rmtree(staging)
staging.mkdir(parents=True)
subprocess.run([sys.executable,'-m','esptool','--chip','esp32','merge_bin','--flash_mode','dio','--flash_freq','40m','--flash_size','4MB','-o',str(staging/'firmware-merged.bin'),
 '0x1000',str(build/'PonyGotchi.ino.bootloader.bin'),'0x8000',str(build/'PonyGotchi.ino.partitions.bin'),
 '0xe000',str(core/'tools/partitions/boot_app0.bin'),'0x10000',str(build/'PonyGotchi.ino.bin')],check=True)
for path in ['preview-offline.html','docs/INSTALL_WINDOWS.md','firmware/requirements-build.txt']:
    shutil.copy2(ROOT/path,staging/Path(path).name)
shutil.copy2(build/'compile.log',staging/'compile.log')
shutil.copy2(build/'build-success.json',staging/'build-success.json')
shutil.copytree(ROOT/'.build/sd',staging/'SD')
for path in (ROOT/'scripts/windows').glob('*.cmd'):shutil.copy2(path,staging/path.name)
source=staging/'sources'
for directory in ['firmware','src','scripts','tests','docs']:
    shutil.copytree(ROOT/directory,source/directory,ignore=shutil.ignore_patterns('__pycache__'))
for path in ['README.md','AGENTS.md','index.html','package.json','preview-offline.html']:
    shutil.copy2(ROOT/path,source/path)
shutil.copytree(ROOT/'assets/ponies',source/'assets/ponies')
(source/'assets/backgrounds').mkdir(parents=True)
for p in (ROOT/'assets/backgrounds').glob('meadow_*.png'):shutil.copy2(p,source/'assets/backgrounds'/p.name)
shutil.copy2(ROOT/'assets/README.md',source/'assets/README.md')
(staging/'verifier.py').write_text('''from pathlib import Path
import hashlib, json
root=Path(__file__).resolve().parent
for name,digest in json.loads((root/'SHA256.json').read_text()).items():
 if hashlib.sha256((root/name).read_bytes()).hexdigest()!=digest:raise SystemExit('Fichier invalide: '+name)
print('Tous les fichiers de la livraison sont intacts.')
''')
manifest={p.relative_to(staging).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(staging.rglob('*')) if p.is_file()}
(staging/'SHA256.json').write_text(json.dumps(manifest,indent=2)+'\n')
dist=ROOT/'dist';dist.mkdir(exist_ok=True)
archive=dist/f'PonyGotchi-{version}-CrowPanel-V22.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for p in sorted(staging.rglob('*')):
        if p.is_file():z.write(p,p.relative_to(staging.parent))
print('Release:',archive)
print('SHA256:',hashlib.sha256(archive.read_bytes()).hexdigest())
