@echo off
echo Demarrage du serveur de developpement...
echo.

REM Arreter tous les processus Node existants
taskkill /F /IM node.exe 2>nul

REM Attendre un peu
timeout /t 2 /nobreak >nul

REM Demarrer le serveur
echo Lancement de npm run dev...
call npm run dev
