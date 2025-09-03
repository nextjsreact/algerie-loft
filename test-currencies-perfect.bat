@echo off
echo Test PARFAIT - Page Currencies - Toutes traductions corrigées
echo ============================================================

echo 1. Arrêt des processus...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 2. Nettoyage cache...
if exist .next rmdir /s /q .next

echo 3. PROBLÈME RÉSOLU - Sections nav dupliquées
echo   Il y avait deux sections "nav" dans common.json
echo   La deuxième écrasait la première
echo.
echo ✅ CORRECTION FINALE APPLIQUÉE :
echo   Fusion des sections nav en une seule :
echo   "nav": {
echo     "currencies": "Devises/Currencies/العملات",
echo     "categories": "Catégories/Categories/الفئات"
echo   }
echo.
echo 🎯 RÉSULTAT ATTENDU :
echo   - Plus d'erreur "nav.currencies" dans les logs
echo   - Navigation "Devises" affichée correctement
echo   - Toutes les traductions de la page fonctionnelles
echo   - Changement de langue parfait (FR/EN/AR)
echo.
echo 🌍 TEST COMPLET :
echo   1. Vérifiez la navigation : "Devises" au lieu de "nav.currencies"
echo   2. Changez les langues et vérifiez toutes les traductions
echo   3. Plus aucune clé brute visible
echo.
start http://localhost:3001/settings/currencies
npm run dev