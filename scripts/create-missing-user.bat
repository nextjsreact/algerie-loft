@echo off
chcp 65001 >nul
echo.
echo 🚀 CREATION DE L'UTILISATEUR MANQUANT "IT"
echo ==========================================
echo.

echo 1. Test de connexion avec postgres...
psql -U postgres -d postgres -c "SELECT version();" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erreur: Impossible de se connecter avec postgres
    echo 💡 Assurez-vous que PostgreSQL est demarre
    pause
    exit /b 1
)

echo ✅ Connexion reussie avec postgres

echo 2. Creation de l'utilisateur IT...
psql -U postgres -d postgres -c "CREATE USER IT WITH PASSWORD 'LoftAlgerie2025!';" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ L'utilisateur IT existe deja ou erreur de creation
) else (
    echo ✅ Utilisateur IT cree avec succes
)

echo 3. Attribution des privileges...
psql -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE postgres TO IT;" >nul 2>&1
psql -U postgres -d postgres -c "ALTER USER IT CREATEDB;" >nul 2>&1

echo 4. Test de connexion avec IT...
psql -U IT -d postgres -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erreur: Impossible de se connecter avec IT
    echo 💡 Verifiez le mot de passe et les privileges
    pause
    exit /b 1
)

echo ✅ Utilisateur IT configure avec succes !
echo.
echo 🎯 Prochaine etape: .\setup-local-databases.bat
echo.
pause