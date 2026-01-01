@echo off
echo 🧹 Désactivation de Console Ninja...
echo.

echo 📋 Console Ninja pollue vos logs avec des codes oo_oo
echo 🔧 Nettoyage en cours...
echo.

REM Supprimer les fichiers de cache Console Ninja
if exist node_modules\.cache\console-ninja rmdir /s /q node_modules\.cache\console-ninja
if exist .console-ninja rmdir /s /q .console-ninja

REM Nettoyer le cache Next.js
if exist .next rmdir /s /q .next

echo ✅ Cache Console Ninja supprimé
echo.

echo 🚀 Redémarrage du serveur sans Console Ninja...
echo.

REM Démarrer sans Console Ninja
set DISABLE_CONSOLE_NINJA=true
npm run dev