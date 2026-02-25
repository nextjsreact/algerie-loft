@echo off
echo Nettoyage et reinstallation des dependances...
echo.

REM Arreter tous les processus Node
taskkill /F /IM node.exe 2>nul

REM Attendre un peu
timeout /t 2 /nobreak >nul

REM Supprimer node_modules et package-lock
echo Suppression de node_modules...
if exist node_modules (
    rmdir /s /q node_modules 2>nul
)

if exist package-lock.json (
    del /f /q package-lock.json 2>nul
)

echo.
echo Nettoyage du cache npm...
call npm cache clean --force

echo.
echo Installation des dependances...
call npm install --legacy-peer-deps --no-optional

echo.
echo Installation terminee!
pause
