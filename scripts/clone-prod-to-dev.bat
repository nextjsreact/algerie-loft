@echo off
echo ========================================
echo CLONAGE PRODUCTION vers DEVELOPPEMENT
echo ========================================
echo.
echo Ce script va cloner les donnees de production
echo vers l'environnement de developpement.
echo.
echo ATTENTION: Toutes les donnees DEV seront supprimees!
echo.
pause

echo.
echo Execution du clonage...
npx tsx scripts/clone-prod-to-dev-fixed.ts

echo.
echo Clonage termine!
pause