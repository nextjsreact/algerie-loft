@echo off
echo.
echo 🔍 RECHERCHE ET CORRECTION POSTGRESQL
echo ====================================
echo.

echo Recherche du fichier pg_hba.conf...
for /d %%i in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%i\data\pg_hba.conf" (
        echo ✅ Trouve: %%i\data\pg_hba.conf
        set PG_HBA=%%i\data\pg_hba.conf
        goto :found
    )
)

echo ❌ Fichier pg_hba.conf non trouve
goto :end

:found
echo.
echo Modification de %PG_HBA%...
powershell -Command "(Get-Content '%PG_HBA%') -replace 'scram-sha-256', 'trust' | Set-Content '%PG_HBA%'"
echo ✅ Fichier modifie avec succes

echo.
echo Redemarrage de PostgreSQL...
net stop postgresql-x64-15 >nul 2>&1
timeout /t 3 /nobreak >nul
net start postgresql-x64-15 >nul 2>&1
echo ✅ PostgreSQL redemarre

echo.
echo Test de connexion...
psql -U postgres -d postgres -c "SELECT 1;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ CONNEXION REUSSIE !
    echo.
    echo 🎯 Prochaine etape : .\setup-local-databases.bat
) else (
    echo ❌ CONNEXION ECHOUEE
    echo.
    echo 🔧 Solutions:
    echo 1. Verifiez que PostgreSQL est demarre
    echo 2. Redemarrez manuellement via services.msc
    echo 3. Verifiez le nom exact du service PostgreSQL
)

echo.
pause

:end