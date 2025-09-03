@echo off
echo Nettoyage complet et test des traductions Currencies
echo ===================================================

echo 1. Arrêt FORCE de tous les processus Node.js...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
timeout /t 3 /nobreak >nul

echo 2. Nettoyage complet des caches...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .turbo rmdir /s /q .turbo

echo 3. Nettoyage des duplications de traductions...
echo   - Suppression des settings.* dans common.json
echo   - Séparation claire des namespaces
echo   - settings.json : settings.currencies.*
echo   - common.json : common.*
echo   - nav.json : nav.*

echo 4. Démarrage du serveur avec cache vide...
echo.
echo ✅ CORRECTIONS APPLIQUÉES :
echo   [EN] settings.currencies.subtitle = "Manage your currencies and exchange rates"
echo   [EN] common.code = "Code", common.symbol = "Symbol", common.ratio = "Rate"
echo   [EN] nav.currencies = "Currencies"
echo.
echo   [FR] settings.currencies.subtitle = "Gérez vos devises et taux de change"
echo   [FR] common.code = "Code", common.symbol = "Symbole", common.ratio = "Taux"
echo   [FR] nav.currencies = "Devises"
echo.
echo   [AR] settings.currencies.subtitle = "إدارة العملات وأسعار الصرف"
echo   [AR] common.code = "الرمز", common.symbol = "الرمز", common.ratio = "المعدل"
echo.
echo 🔧 NAMESPACES NETTOYÉS :
echo   - Pas de duplication entre common.json et settings.json
echo   - Chaque traduction dans son fichier approprié
echo.
echo INSTRUCTIONS DE TEST :
echo - La page va s'ouvrir sur http://localhost:3001/settings/currencies
echo - Changez la langue et vérifiez qu'il n'y a PLUS de clés brutes
echo - Tous les textes doivent être traduits correctement
echo.
start http://localhost:3001/settings/currencies
npm run dev