@echo off
setlocal
cd /d "%~dp0"
if not exist .tools\Scripts\python.exe (
 echo Lancer Installer.cmd avant de flasher.
 exit /b 1
)
.tools\Scripts\python.exe verifier.py
if errorlevel 1 exit /b 1
set /p PONY_PORT=Port USB du CrowPanel (exemple COM5) :
.tools\Scripts\python.exe -m esptool --chip esp32 --port "%PONY_PORT%" flash_id
if errorlevel 1 exit /b 1
if exist sauvegarde-avant-flash.bin (
 echo La sauvegarde existe deja : la conserver ailleurs avant un nouveau flash.
 exit /b 1
)
.tools\Scripts\python.exe -m esptool --chip esp32 --port "%PONY_PORT%" read_flash 0 0x400000 sauvegarde-avant-flash.bin
if errorlevel 1 exit /b 1
echo Sauvegarde terminee. Verifier une flash de 4 Mo et un CrowPanel DIS05035H V2.2.
set /p PONY_CONFIRM=Taper FLASH pour installer ce firmware experimental :
if not "%PONY_CONFIRM%"=="FLASH" exit /b 1
.tools\Scripts\python.exe -m esptool --chip esp32 --port "%PONY_PORT%" write_flash 0x0 firmware-merged.bin
if errorlevel 1 exit /b 1
echo Flash termine. La validation physique du jeu reste a effectuer.
pause
