@echo off
echo Nettoyage et démarrage...
taskkill /f /im node.exe 2>nul
timeout /t 1 /nobreak >nul
rmdir /s /q .next 2>nul
echo Démarrage du serveur de développement...
npm run dev