"""Transfert USB vers la microSD du CrowPanel sans lecteur de carte.
Usage: py -m pip install pyserial && py envoyer_tout.py COM4
"""
import sys,time
from pathlib import Path
try:
 import serial
except ImportError:
 print('Il manque pyserial. Dans PowerShell : py -m pip install pyserial')
 raise SystemExit(2)
ROOT=Path(__file__).resolve().parent
SD=ROOT/'sd_files'
NAMES=['day.raw','dusk.raw','night.raw','rosy.raw',
       'room_eat.raw','room_play.raw','room_wash.raw','room_sleep.raw','room_pet.raw',
       'ui_full.raw','ui_care.raw']
if len(sys.argv)!=2:
 print('Usage: py envoyer_tout.py COM4    (remplacer COM4 par le port Arduino)')
 raise SystemExit(1)
port=sys.argv[1]
missing=[f for f in NAMES if not (SD/f).is_file()]
if missing:raise SystemExit('Fichiers manquants : '+', '.join(missing))
print('Fermer le Moniteur serie de Arduino IDE et laisser le jeu allume.')
print('Ne pas toucher au cable pendant le transfert.')

def expect(ser,expected,seconds=12):
 deadline=time.monotonic()+seconds
 while time.monotonic()<deadline:
  ans=ser.readline().decode('utf-8','replace').strip()
  if ans==expected:return
  if ans.startswith('ERR'):raise RuntimeError('ESP32 : '+ans)
 raise RuntimeError(f'Reponse attendue {expected!r} non recue. Port et firmware a verifier.')

try:
 with serial.Serial(port,115200,timeout=0.4,write_timeout=20) as ser:
  time.sleep(2)
  for index,name in enumerate(NAMES,1):
   file=SD/name;size=file.stat().st_size
   ser.reset_input_buffer()
   ser.write(b'PING\n');expect(ser,'PONG')
   ser.write(f'PUT {name} {size}\n'.encode('ascii'));expect(ser,'GO')
   print(f'[{index}/{len(NAMES)}] {name} — {size:,} octets',flush=True)
   with file.open('rb') as f:
    while True:
     block=f.read(1024)
     if not block:break
     ser.write(block)
   ser.flush()
   expect(ser,'OK '+name,seconds=30)
   print('    OK',flush=True)
   time.sleep(.2)
except (OSError,RuntimeError,serial.SerialException) as err:
 print('\nTransfert interrompu :',err)
 print('Relancer le script pour recommencer la copie complete.')
 raise SystemExit(1)
print('\nInstallation des assets terminee ! Appuyer sur RESET du CrowPanel.')
