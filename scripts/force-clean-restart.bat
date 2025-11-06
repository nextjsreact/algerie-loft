@echo off
echo 🧹 Nettoyage complet et redémarrage forcé...

echo.
echo 🛑 Arrêt des processus Node.js...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo.
echo 🗑️ Suppression des caches...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .next\cache rmdir /s /q .next\cache

echo.
echo 🔄 Attente de 2 secondes...
timeout /t 2 /nobreak >nul

echo.
echo ✅ Nettoyage terminé !
echo.
echo 💡 Maintenant exécutez: npm run dev
echo.
pause