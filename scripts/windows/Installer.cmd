@echo off
setlocal
cd /d "%~dp0"
py -3 -m venv .tools
if errorlevel 1 goto error
.tools\Scripts\python.exe -m pip install -r requirements-build.txt
if errorlevel 1 goto error
echo Outils installes. Lire INSTALL_WINDOWS.md avant le flash.
pause
exit /b 0
:error
echo Installation echouee. Installer Python 3.12 depuis python.org puis reessayer.
pause
exit /b 1
