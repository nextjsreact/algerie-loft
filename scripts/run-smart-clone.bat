@echo off
echo ========================================
echo CLONAGE INTELLIGENT PROD vers DEV
echo ========================================
echo.
echo Ce script va:
echo - Vider toutes les tables DEV
echo - Copier les donnees depuis PROD
echo - Adapter automatiquement les schemas
echo - Anonymiser les donnees sensibles
echo.
echo ATTENTION: Toutes les donnees DEV seront perdues!
echo.
pause

echo.
echo Execution du clonage intelligent...
npm run clone:smart:prod-to-dev

echo.
echo Clonage intelligent termine!
pause