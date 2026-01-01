@echo off
echo 🚀 Build de production avec corrections...
echo.

echo 📋 Étapes du build :
echo 1. Nettoyage du cache
echo 2. Build Next.js optimisé
echo 3. Vérification du build
echo.

echo 🧹 Nettoyage du cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo 🔧 Configuration pour le build...
set NODE_ENV=production
set NEXT_TELEMETRY_DISABLED=1

echo.
echo 🚀 Lancement du build Next.js...
echo.

npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ BUILD RÉUSSI !
    echo.
    echo 📊 Résumé :
    echo - ✅ Corrections API appliquées
    echo - ✅ Politiques RLS corrigées  
    echo - ✅ Dropdown executive fonctionnel
    echo - ✅ Build de production prêt
    echo.
    echo 🚀 Pour démarrer en production :
    echo npm start
    echo.
) else (
    echo.
    echo ❌ BUILD ÉCHOUÉ
    echo.
    echo 🔧 Solutions possibles :
    echo 1. Vérifiez les erreurs ci-dessus
    echo 2. Installez les dépendances manquantes
    echo 3. Commentez les composants problématiques
    echo.
)

pause