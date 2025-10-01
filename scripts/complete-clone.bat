@echo off
echo ========================================
echo CLONAGE COMPLET PRODUCTION vers DEV
echo ========================================
echo.
echo ATTENTION: Cette operation va:
echo - DETRUIRE completement la base DEV
echo - RECREER le schema depuis PROD  
echo - COPIER toutes les donnees
echo.
echo Cette action est IRREVERSIBLE!
echo.
pause

echo.
echo 1. Setup des fonctions RPC...
npx tsx scripts/setup-clone-functions.ts

echo.
echo 2. Execution du clonage complet...
npx tsx scripts/complete-clone-prod-to-dev.ts

echo.
echo Clonage complet termine!
pause