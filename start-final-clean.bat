@echo off
echo ========================================
echo DEMARRAGE FINAL PROPRE - SANS NINJA
echo ========================================

REM Tuer tous les processus Node.js
taskkill /F /IM node.exe /T >nul 2>&1

REM Attendre 2 secondes
timeout /t 2 /nobreak >nul

REM Variables d'environnement pour bloquer Console Ninja
set DISABLE_CONSOLE_NINJA=1
set CONSOLE_NINJA_DISABLED=1
set NODE_OPTIONS=--no-warnings --disable-proto=delete
set NEXT_TELEMETRY_DISABLED=1
set CI=true

echo Demarrage du serveur Next.js PROPRE...
echo Port: 3000
echo URL: http://localhost:3000
echo.

REM Démarrer le serveur
npm run dev