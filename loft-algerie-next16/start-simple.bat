@echo off
cls
echo ==========================================
echo    DEMARRAGE SERVEUR NEXT.JS 16.1
echo ==========================================
echo.

echo Nettoyage du cache...
if exist ".next" rmdir /s /q .next

echo Demarrage du serveur...
echo.
echo Le serveur sera disponible sur: http://localhost:3000
echo.
echo Pages a tester:
echo - http://localhost:3000 (Accueil)
echo - http://localhost:3000/public (Interface publique)  
echo - http://localhost:3000/business (Fonctionnalites metier)
echo - http://localhost:3000/admin (Dashboard admin)
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

node_modules\.bin\next.exe dev --port 3000