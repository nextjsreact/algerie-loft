@echo off
echo Test des traductions - Loft Algérie
echo =====================================
echo.
echo Arrêt des processus Node.js existants...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Nettoyage du cache...
if exist .next rmdir /s /q .next

echo Démarrage du serveur...
echo Ouvrez http://localhost:3001/availability dans votre navigateur
echo Testez le changement de langue avec le sélecteur de langue
echo.
npm run dev