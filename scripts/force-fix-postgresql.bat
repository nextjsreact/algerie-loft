@echo off
echo.
echo 🚀 CORRECTION FORCEE POSTGRESQL
echo ===============================
echo.

echo 1. Recherche du fichier pg_hba.conf...
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
echo 2. Modification FORCEE de %PG_HBA%...
echo # Configuration PostgreSQL - Mode TRUST pour developpement > "%PG_HBA%"
echo # ======================================================== >> "%PG_HBA%"
echo local   all             all                                     trust >> "%PG_HBA%"
echo host    all             all             127.0.0.1/32            trust >> "%PG_HBA%"
echo host    all             all             ::1/128                 trust >> "%PG_HBA%"
echo local   replication     all                                     trust >> "%PG_HBA%"
echo host    replication     all             127.0.0.1/32            trust >> "%PG_HBA%"
echo host    replication     all             ::1/128                 trust >> "%PG_HBA%"
echo ✅ Fichier recree avec configuration TRUST

echo.
echo 3. Arret FORCE de PostgreSQL...
taskkill /f /im postgres.exe >nul 2>&1
sc stop postgresql-x64-13 >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo 4. Demarrage FORCE de PostgreSQL...
sc start postgresql-x64-13 >nul 2>&1
timeout /t 5 /nobreak >nul
echo ✅ PostgreSQL force demarre

echo.
echo 5. Test de connexion...
psql -U postgres -d postgres -c "SELECT version();" 2>nul
if %errorlevel% equ 0 (
    echo ✅ CONNEXION REUSSIE !
    echo.
    echo 🎯 Prochaine etape : .\setup-local-databases.bat
    echo.
    echo 📋 Test rapide :
    echo psql -U postgres -d postgres -c "SELECT 1;"
) else (
    echo ❌ CONNEXION ECHOUEE
    echo.
    echo 🔧 Solutions de secours :
    echo 1. Redemarrer l'ordinateur
    echo 2. Reinstaller PostgreSQL
    echo 3. Utiliser Docker : docker run --name postgres -e POSTGRES_PASSWORD=motdepasse -p 5432:5432 -d postgres
)

echo.
pause

:end