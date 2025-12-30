@echo off
echo ========================================
echo Demarrage PROPRE sans Console Ninja
echo ========================================

REM Variables pour désactiver Console Ninja
set DISABLE_CONSOLE_NINJA=true
set CONSOLE_NINJA_DISABLED=true
set NODE_OPTIONS=--no-warnings
set NEXT_TELEMETRY_DISABLED=1

echo Demarrage du serveur Next.js...
npm run dev