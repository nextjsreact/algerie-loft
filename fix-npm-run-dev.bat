@echo off
echo ========================================
echo SOLUTION DEFINITIVE pour npm run dev
echo ========================================

REM Restaurer le script original
echo Restauration du script dev original...
powershell -Command "(Get-Content package.json) -replace '\"dev\": \"node node_modules/next/dist/bin/next dev\",', '\"dev\": \"next dev\",' | Set-Content package.json"

REM Créer un next.cmd fonctionnel
echo Creation du fichier next.cmd fonctionnel...
mkdir node_modules\.bin 2>nul
echo @echo off > node_modules\.bin\next.cmd
echo "C:\Program Files\nodejs\node.exe" "%%~dp0\..\next\dist\bin\next" %%* >> node_modules\.bin\next.cmd

REM Tester la commande
echo Test de npm run dev...
npm run dev