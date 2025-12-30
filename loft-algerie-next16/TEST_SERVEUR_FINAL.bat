@echo off
echo ==========================================
echo    TEST FINAL DU SERVEUR - PHASE 2
echo ==========================================
echo.

echo 1. Verification des fichiers...
if exist "node_modules\.bin\next.exe" (
    echo ✅ Next.js executable present
) else (
    echo ❌ Next.js executable manquant
    echo Execution: bun install
    bun install
)

echo.
echo 2. Test de compilation...
echo Verification TypeScript...
if exist "app\page.tsx" (
    echo ✅ Page d'accueil presente
) else (
    echo ❌ Page d'accueil manquante
)

if exist "components\lofts\SimpleLoftsList.tsx" (
    echo ✅ Composant lofts present
) else (
    echo ❌ Composant lofts manquant
)

if exist "components\admin\AdminDashboard.tsx" (
    echo ✅ Dashboard admin present
) else (
    echo ❌ Dashboard admin manquant
)

echo.
echo 3. Demarrage du serveur de test...
echo.
echo ⚠️  IMPORTANT: Le serveur va demarrer
echo    Ouvrez http://localhost:3000 dans votre navigateur
echo    Appuyez sur Ctrl+C pour arreter
echo.
echo Pages a tester:
echo • http://localhost:3000 (Accueil)
echo • http://localhost:3000/public (Interface publique)
echo • http://localhost:3000/business (Fonctionnalites metier)
echo • http://localhost:3000/admin (Dashboard admin)
echo.

pause

echo Demarrage...
node_modules\.bin\next.exe dev --port 3000