"""Build with Arduino CLI 1.3.1, ESP32 2.0.17 and TFT_eSPI 2.5.33."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--toolchain',type=Path,help='Verified Linux offline toolchain root (see bootstrap_toolchain.py)')
args=parser.parse_args()
out=ROOT/'.build/firmware';out.mkdir(parents=True,exist_ok=True)
stamp=out/'build-success.json'
if stamp.exists():stamp.unlink()
env=os.environ.copy()
command=['arduino-cli']
platform='esp32'
if args.toolchain:
    base=args.toolchain.resolve();platform='espressif'
    command=[str(base/'bin/arduino-cli'),'--config-file',str(base/'arduino-cli.yaml')]
    env['ARDUINO_DIRECTORIES_DATA']=str(base/'arduino-data')
version=subprocess.check_output(command+['version'],env=env,text=True)
if 'Version: 1.3.1 ' not in version:raise SystemExit('Arduino CLI 1.3.1 required')
command+=['compile','--fqbn',f'{platform}:esp32:esp32:PSRAM=enabled,FlashMode=dio,FlashFreq=40,FlashSize=4M',
          '--jobs','2','--build-path',str(ROOT/'.build/arduino'),'--output-dir',str(out),
          '--build-property',f'compiler.cpp.extra_flags=-include "{ROOT / "firmware/PonyGotchi/BoardConfig.h"}"']
if args.toolchain:
    for tool in ['ctags','xtensa-esp32-elf-gcc','esptool_py']:
        command+=['--build-property',f'runtime.tools.{tool}.path={base/"tools"/tool}']
command+=[str(ROOT/'firmware/PonyGotchi')]
# Stream complete evidence and preserve the compiler exit status.
with (out/'compile.log').open('w') as log:
    log.write(version+'\n'+json.dumps(command)+'\n');log.flush()
    result=subprocess.run(command,env=env,stdout=log,stderr=subprocess.STDOUT)
print((out/'compile.log').read_text())
result.check_returncode()

stamp.write_text(json.dumps({
 'arduino_cli': version.strip(),
 'inputs': {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'firmware/PonyGotchi').glob('*')) if p.is_file()},
 'binaries': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.glob('*.bin'))},
 'exit_code': result.returncode,
}, indent=2)+'\n')
