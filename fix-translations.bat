@echo off
echo Correction des traductions manquantes...
echo =====================================

echo 1. Arrêt des processus Node.js...
taskkill /f /im node.exe 2>nul

echo 2. Nettoyage du cache Next.js...
if exist .next rmdir /s /q .next

echo 3. Nettoyage du cache npm...
npm cache clean --force

echo 4. Redémarrage du serveur...
echo.
echo ✅ Corrections appliquées :
echo   - Namespace 'availability' ajouté à la configuration i18n
echo   - Traductions manquantes ajoutées dans common.json (FR/AR)
echo   - Fichier availability.json créé pour l'anglais
echo   - Manifest.json corrigé
echo.
echo 🌍 Langues supportées : Français, Arabe, Anglais
echo 📝 Namespaces : common, availability, lofts, etc.
echo.
start http://localhost:3001/availability
npm run dev