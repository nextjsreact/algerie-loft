@echo off
echo ==========================================
echo    DEMARRAGE SERVEUR - NEXT.JS 16.1
echo ==========================================
echo.

echo 🚀 Demarrage du serveur de developpement...
echo.

REM Nettoyer le cache Next.js
if exist ".next" (
    echo 🧹 Nettoyage du cache Next.js...
    rmdir /s /q .next
)

echo 📦 Verification des dependances...
if not exist "node_modules\.bin\next.exe" (
    echo ❌ Next.js non trouve, reinstallation...
    bun install
)

echo ✅ Demarrage du serveur...
echo.
echo 🌐 Le serveur sera disponible sur:
echo    http://localhost:3000
echo.
echo 📋 Pages a tester:
echo    • http://localhost:3000 (Accueil)
echo    • http://localhost:3000/public (Interface publique)
echo    • http://localhost:3000/business (Fonctionnalites metier)
echo    • http://localhost:3000/admin (Dashboard admin)
echo.
echo ⚠️  Appuyez sur Ctrl+C pour arreter le serveur
echo.

REM Demarrer Next.js directement
node_modules\.bin\next.exe dev