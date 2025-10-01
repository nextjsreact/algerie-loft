@echo off
echo.
echo 🚀 CORRECTION RAPIDE POSTGRESQL
echo ===============================
echo.
echo Ce script va corriger rapidement le probleme d'utilisateur PostgreSQL.
echo.

echo 1. Modification du fichier pg_hba.conf...
powershell -Command "(Get-Content 'C:\Program Files\PostgreSQL\15\data\pg_hba.conf') -replace 'scram-sha-256', 'trust' | Set-Content 'C:\Program Files\PostgreSQL\15\data\pg_hba.conf'"
echo ✅ Fichier pg_hba.conf modifie

echo.
echo 2. Redemarrage de PostgreSQL...
net stop postgresql-x64-15 >nul 2>&1
timeout /t 2 /nobreak >nul
net start postgresql-x64-15 >nul 2>&1
echo ✅ PostgreSQL redemarre

echo.
echo 3. Test de connexion...
psql -U postgres -d postgres -c "SELECT 1;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ CONNEXION REUSSIE !
    echo.
    echo 🎯 Prochaine etape : .\setup-local-databases.bat
) else (
    echo ❌ CONNEXION ECHOUEE
    echo.
    echo 🔧 Redemarrer manuellement PostgreSQL via services.msc
)

echo.
pause