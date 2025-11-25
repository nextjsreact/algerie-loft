@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🔍 TEST SYSTÈME D'ANNONCES
echo ========================================
echo.
echo Ce script va ouvrir les fichiers nécessaires pour tester le système.
echo.
echo 📋 ÉTAPES À SUIVRE:
echo.
echo 1. Le fichier de test SQL va s'ouvrir
echo    → Copiez tout le contenu
echo    → Allez dans Supabase SQL Editor
echo    → Collez et exécutez
echo.
echo 2. Le fichier de debug HTML va s'ouvrir
echo    → Modifiez vos clés Supabase (lignes 95-96)
echo    → Sauvegardez
echo    → Ouvrez dans votre navigateur
echo.
echo 3. Le guide rapide va s'ouvrir
echo    → Suivez les instructions
echo.
pause
echo.
echo 📂 Ouverture des fichiers...
echo.

REM Ouvrir le fichier de test SQL
if exist "database\migrations\test_announcements_quick.sql" (
    echo ✅ Ouverture: test_announcements_quick.sql
    start "" "database\migrations\test_announcements_quick.sql"
    timeout /t 2 /nobreak >nul
) else (
    echo ❌ Fichier non trouvé: database\migrations\test_announcements_quick.sql
)

REM Ouvrir le fichier de debug HTML
if exist "debug-announcements-complete.html" (
    echo ✅ Ouverture: debug-announcements-complete.html
    start "" "debug-announcements-complete.html"
    timeout /t 2 /nobreak >nul
) else (
    echo ❌ Fichier non trouvé: debug-announcements-complete.html
)

REM Ouvrir le guide rapide
if exist "DEBUG_ANNONCES_RAPIDE.md" (
    echo ✅ Ouverture: DEBUG_ANNONCES_RAPIDE.md
    start "" "DEBUG_ANNONCES_RAPIDE.md"
    timeout /t 2 /nobreak >nul
) else (
    echo ❌ Fichier non trouvé: DEBUG_ANNONCES_RAPIDE.md
)

echo.
echo ========================================
echo ✅ Fichiers ouverts!
echo ========================================
echo.
echo 🎯 MAINTENANT:
echo.
echo 1. Exécutez le SQL dans Supabase
echo 2. Configurez le fichier HTML
echo 3. Suivez le guide
echo.
echo 📞 Si vous avez des problèmes:
echo    → Consultez ANNONCES_FIX_COMPLET.md
echo    → Vérifiez la console du navigateur (F12)
echo.
pause
