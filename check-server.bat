@echo off
chcp 65001 >nul
title Vérification du Serveur

echo ================================
echo   VÉRIFICATION DU SERVEUR
echo ================================
echo.

netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo ✅ SERVEUR EN COURS D'EXÉCUTION
    echo.
    echo Détails :
    netstat -ano | findstr :3000
    echo.
    echo 📍 URL : http://localhost:3000
    echo.
    echo Voulez-vous ouvrir dans le navigateur ? (O/N)
    set /p open_choice="Votre choix : "
    if /i "%open_choice%"=="O" start http://localhost:3000
    if /i "%open_choice%"=="Y" start http://localhost:3000
) else (
    echo ❌ SERVEUR ARRÊTÉ
    echo.
    echo Le serveur n'est pas en cours d'exécution.
    echo.
    echo Voulez-vous démarrer le serveur ? (O/N)
    set /p start_choice="Votre choix : "
    if /i "%start_choice%"=="O" call start-dev.bat
    if /i "%start_choice%"=="Y" call start-dev.bat
)

echo.
pause
