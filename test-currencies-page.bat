@echo off
echo Test de la page Devises - Toutes langues
echo ========================================

echo 1. Arrêt des processus existants...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 2. Nettoyage du cache...
if exist .next rmdir /s /q .next

echo 3. Démarrage du serveur...
echo.
echo ✅ Corrections appliquées pour /settings/currencies :
echo   - settings.json : Traductions currencies ajoutées (FR/AR/EN)
echo   - common.json : Code, Symbol, Ratio, Yes, No ajoutés (FR/AR/EN)
echo   - Toutes les clés de traduction maintenant disponibles
echo.
echo 🌍 Langues supportées : Français, Arabe, Anglais
echo 📝 Page : /settings/currencies
echo.
echo TRADUCTIONS AJOUTÉES :
echo   EN: Manage currencies, Default Currency, Code, Symbol, Rate, Yes, No
echo   FR: Gérer devises, Devise par défaut, Code, Symbole, Taux, Oui, Non  
echo   AR: إدارة العملات, العملة الافتراضية, الرمز, المعدل, نعم, لا
echo.
echo INSTRUCTIONS DE TEST :
echo - Ouvrez http://localhost:3001/settings/currencies
echo - Changez entre les langues (FR/EN/AR)
echo - Vérifiez que TOUS les textes sont traduits :
echo   * Plus de clés comme "settings.currencies.subtitle"
echo   * Plus de "common.code", "common.symbol", etc.
echo   * Boutons et colonnes entièrement traduits
echo.
start http://localhost:3001/settings/currencies
npm run dev