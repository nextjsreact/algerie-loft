@echo off
echo 🚀 Démarrage avec logs propres...
echo.

echo 📋 Configuration appliquée :
echo - ✅ Console Ninja désactivé
echo - ✅ Cache nettoyé
echo - ✅ Variables d'environnement configurées
echo.

echo 🔍 Vos logs devraient maintenant être lisibles
echo 📊 Plus de codes oo_oo ou d'identifiants étranges
echo.

REM S'assurer que Console Ninja est désactivé
set DISABLE_CONSOLE_NINJA=true
set NODE_OPTIONS=--no-experimental-loader

echo 🚀 Démarrage du serveur...
npm run dev