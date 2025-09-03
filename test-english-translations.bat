@echo off
echo Test des traductions anglaises - Page Categories
echo ===============================================

echo 1. Arrêt des processus existants...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 2. Nettoyage du cache...
if exist .next rmdir /s /q .next

echo 3. Démarrage du serveur...
echo.
echo ✅ Corrections appliquées pour les traductions anglaises :
echo   - common.json : Actions, Name, Edit, Delete ajoutés
echo   - nav.json : Sign Out, Admin, Configure ajoutés
echo   - settings.json : Toutes les traductions de catégories
echo   - transactions.json : Income, Expense, Type
echo.
echo 🌍 Test de la langue anglaise
echo 📝 Page : /settings/categories
echo.
echo INSTRUCTIONS DE TEST :
echo - Ouvrez http://localhost:3001/settings/categories
echo - Changez la langue vers l'anglais (EN)
echo - Vérifiez que TOUS les textes sont en anglais :
echo   * Navigation : Categories, Settings, Sign Out
echo   * Titre : Categories (pas Catégories)
echo   * Boutons : Edit, Delete (pas Modifier, Supprimer)
echo   * Colonnes : Name, Description, Type, Actions
echo   * Types : Income, Expense (pas Revenu, Dépense)
echo.
start http://localhost:3001/settings/categories
npm run dev