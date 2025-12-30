@echo off
echo Demarrage avec npm run dev corrige...
cd /d "%~dp0"
set PATH=%CD%\node_modules\.bin;%PATH%
npm run dev