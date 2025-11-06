@echo off
echo 🧹 Nettoyage complet et redémarrage...
echo.

echo 🛑 Arrêt des processus Node.js...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 🗂️ Suppression des caches...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .swc rmdir /s /q .swc

echo 📦 Réinstallation des dépendances...
npm ci --silent

echo 🚀 Redémarrage du serveur de développement...
npm run dev

pause