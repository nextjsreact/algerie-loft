@echo off
echo ========================================
echo CORRECTION FINALE de npm run dev
echo ========================================

echo Copie des modules essentiels...
xcopy "loft-algerie-next16\node_modules" "node_modules" /E /I /Y /Q

echo Correction du fichier next.cmd...
mkdir node_modules\.bin 2>nul
echo @echo off > node_modules\.bin\next.cmd
echo node "%%~dp0\..\next\dist\bin\next" %%* >> node_modules\.bin\next.cmd

echo Test de npm run dev...
npm run dev