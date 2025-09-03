@echo off
echo Arrêt forcé de tous les processus Node.js...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Suppression du cache Next.js...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo Redémarrage...
npm run dev