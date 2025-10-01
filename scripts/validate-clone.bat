@echo off
echo ========================================
echo VALIDATION POST-CLONAGE
echo ========================================
echo.
echo Ce script va verifier que le clonage
echo s'est deroule correctement en comparant:
echo - Le nombre d'enregistrements PROD vs DEV
echo - L'integrite des donnees
echo - Le fonctionnement de base
echo.
pause

echo.
echo Execution de la validation complete...
npm run validate:clone-full

echo.
echo Validation terminee!
pause