@echo off
echo Test FINAL - Page Currencies avec toutes les traductions
echo ======================================================

echo 1. Arrêt FORCE de tous les processus...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
timeout /t 3 /nobreak >nul

echo 2. Nettoyage complet...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo 3. SOLUTION APPLIQUÉE - Traductions dans common.json
echo   Le problème était que l'app cherche dans le namespace 'common'
echo   au lieu de 'nav' et 'settings' séparément.
echo.
echo ✅ TOUTES LES TRADUCTIONS AJOUTÉES DANS common.json :
echo.
echo [ANGLAIS]
echo   nav.currencies = "Currencies"
echo   settings.currencies.subtitle = "Manage your currencies and exchange rates"
echo   settings.currencies.addNew = "Add new currency"
echo   settings.currencies.defaultCurrency = "Default Currency"
echo   settings.currencies.setAsDefault = "Set as Default"
echo   common.loading = "Loading..."
echo   common.copyId = "Copy ID"
echo.
echo [FRANÇAIS]
echo   nav.currencies = "Devises"
echo   settings.currencies.subtitle = "Gérez vos devises et taux de change"
echo   settings.currencies.addNew = "Ajouter une nouvelle devise"
echo   settings.currencies.defaultCurrency = "Devise par défaut"
echo   settings.currencies.setAsDefault = "Définir par défaut"
echo   common.loading = "Chargement..."
echo   common.copyId = "Copier l'ID"
echo.
echo [ARABE]
echo   nav.currencies = "العملات"
echo   settings.currencies.subtitle = "إدارة العملات وأسعار الصرف"
echo   settings.currencies.addNew = "إضافة عملة جديدة"
echo   settings.currencies.defaultCurrency = "العملة الافتراضية"
echo   settings.currencies.setAsDefault = "تعيين كافتراضي"
echo   common.loading = "جاري التحميل..."
echo   common.copyId = "نسخ المعرف"
echo.
echo 🎯 RÉSULTAT ATTENDU :
echo   - Plus de clés brutes comme "nav.currencies"
echo   - Plus de "settings.currencies.subtitle"
echo   - Plus de "common.loading" ou "common.copyId"
echo   - Toutes les traductions affichées correctement
echo.
echo INSTRUCTIONS DE TEST :
echo - Changez entre FR/EN/AR
echo - Vérifiez que TOUT est traduit
echo - Plus aucune clé de traduction visible
echo.
start http://localhost:3001/settings/currencies
npm run dev