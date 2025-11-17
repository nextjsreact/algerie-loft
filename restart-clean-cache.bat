@echo off
echo ========================================
echo NETTOYAGE COMPLET DU CACHE
echo ========================================
echo.

echo [1/4] Arret du serveur Node.js...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Suppression du cache .next...
if exist .next rmdir /s /q .next
echo Cache .next supprime!

echo [3/4] Suppression du cache node_modules...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist node_modules\.vite rmdir /s /q node_modules\.vite
echo Cache node_modules supprime!

echo [4/4] Redemarrage du serveur...
echo.
echo ========================================
echo SERVEUR EN COURS DE DEMARRAGE...
echo ========================================
echo.
npm run dev
