@echo off
chcp 65001 >nul
cls

:menu
echo.
echo ═══════════════════════════════════════════════════════════
echo   🎯 MENU MIGRATION TABLE OWNERS
echo ═══════════════════════════════════════════════════════════
echo.
echo   1. 📊 Voir le résumé complet
echo   2. ✅ Vérifier l'état de la migration
echo   3. 🧪 Tester le système owners
echo   4. 🔒 Ajouter les politiques RLS
echo   5. 🚀 Démarrer l'application
echo   6. 📚 Ouvrir la documentation
echo   0. ❌ Quitter
echo.
echo ═══════════════════════════════════════════════════════════
echo.

set /p choice="Votre choix (0-6): "

if "%choice%"=="1" goto resume
if "%choice%"=="2" goto check
if "%choice%"=="3" goto test
if "%choice%"=="4" goto rls
if "%choice%"=="5" goto start
if "%choice%"=="6" goto docs
if "%choice%"=="0" goto end

echo.
echo ❌ Choix invalide. Veuillez réessayer.
timeout /t 2 >nul
goto menu

:resume
cls
echo.
echo 📊 Résumé de la migration...
echo.
node resume-migration.js
echo.
pause
goto menu

:check
cls
echo.
echo ✅ Vérification de l'état...
echo.
node check-migration-status.js
echo.
pause
goto menu

:test
cls
echo.
echo 🧪 Test du système owners...
echo.
node test-owners-system.js
echo.
pause
goto menu

:rls
cls
echo.
echo 🔒 Ajout des politiques RLS...
echo.
node add-rls-policies.js
echo.
pause
goto menu

:start
cls
echo.
echo 🚀 Démarrage de l'application...
echo.
echo ⚠️  Appuyez sur Ctrl+C pour arrêter
echo.
npm run dev
pause
goto menu

:docs
cls
echo.
echo 📚 Documentation disponible:
echo.
echo   • LIRE_MOI_MIGRATION.md      - Démarrage rapide
echo   • CONTINUER_MIGRATION.md     - Guide étape par étape
echo   • MIGRATION_STATUS_FINAL.md  - État détaillé
echo   • MIGRATION_GUIDE.md         - Guide complet
echo.
echo Ouvrez ces fichiers dans votre éditeur de texte.
echo.
pause
goto menu

:end
cls
echo.
echo 👋 Au revoir!
echo.
timeout /t 1 >nul
exit
