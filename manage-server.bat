@echo off
chcp 65001 >nul
title Gestion du Serveur Next.js

:menu
cls
echo ================================
echo   GESTION DU SERVEUR NEXT.JS
echo ================================
echo.
echo 1. Démarrer le serveur
echo 2. Arrêter le serveur
echo 3. Redémarrer le serveur
echo 4. Vérifier le statut
echo 5. Ouvrir dans le navigateur
echo 6. Quitter
echo.
set /p choice="Votre choix (1-6) : "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto open
if "%choice%"=="6" goto end
goto menu

:start
cls
echo ================================
echo   DÉMARRAGE DU SERVEUR
echo ================================
echo.
echo Vérification si le serveur tourne déjà...
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo.
    echo ⚠️  Le serveur est déjà en cours d'exécution !
    echo.
    echo Voulez-vous le redémarrer ? (O/N)
    set /p restart_choice="Votre choix : "
    if /i "%restart_choice%"=="O" goto restart
    if /i "%restart_choice%"=="Y" goto restart
    goto menu
)

echo.
echo Démarrage du serveur Next.js...
echo.
echo 📍 URL : http://localhost:3000
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo.
node node_modules\next\dist\bin\next dev
goto menu

:stop
cls
echo ================================
echo   ARRÊT DU SERVEUR
echo ================================
echo.
echo Recherche du serveur...

set found=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    set found=1
    echo Arrêt du serveur (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Serveur arrêté avec succès !
    ) else (
        echo ❌ Erreur lors de l'arrêt du serveur
    )
)

if %found%==0 (
    echo ❌ Aucun serveur trouvé sur le port 3000
    echo Le serveur est peut-être déjà arrêté.
)

echo.
pause
goto menu

:restart
cls
echo ================================
echo   REDÉMARRAGE DU SERVEUR
echo ================================
echo.
echo Étape 1/2 : Arrêt du serveur...

set found=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    set found=1
    taskkill /PID %%a /F >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Serveur arrêté
    )
)

if %found%==0 (
    echo ℹ️  Aucun serveur à arrêter
)

echo.
echo Attente de 2 secondes...
timeout /t 2 /nobreak >nul

echo.
echo Étape 2/2 : Démarrage du serveur...
echo.
echo 📍 URL : http://localhost:3000
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo.
node node_modules\next\dist\bin\next dev
goto menu

:status
cls
echo ================================
echo   STATUT DU SERVEUR
echo ================================
echo.
echo Vérification du port 3000...
echo.

netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo ✅ SERVEUR EN COURS D'EXÉCUTION
    echo.
    echo Détails :
    netstat -ano | findstr :3000
    echo.
    echo 📍 URL : http://localhost:3000
) else (
    echo ❌ SERVEUR ARRÊTÉ
    echo.
    echo Le serveur n'est pas en cours d'exécution.
)

echo.
pause
goto menu

:open
cls
echo ================================
echo   OUVERTURE DANS LE NAVIGATEUR
echo ================================
echo.
echo Vérification du serveur...

netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo ✅ Serveur en cours d'exécution
    echo.
    echo Ouverture de http://localhost:3000...
    start http://localhost:3000
    timeout /t 2 /nobreak >nul
) else (
    echo ❌ Le serveur n'est pas en cours d'exécution
    echo.
    echo Voulez-vous démarrer le serveur ? (O/N)
    set /p start_choice="Votre choix : "
    if /i "%start_choice%"=="O" goto start
    if /i "%start_choice%"=="Y" goto start
)

goto menu

:end
cls
echo ================================
echo   AU REVOIR !
echo ================================
echo.
echo Merci d'avoir utilisé le gestionnaire de serveur.
echo.
timeout /t 2 /nobreak >nul
exit
