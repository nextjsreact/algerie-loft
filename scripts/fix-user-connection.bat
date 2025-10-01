@echo off
chcp 65001 >nul
echo.
echo 🔧 CORRECTION DE LA CONNEXION UTILISATEUR IT
echo ============================================
echo.

echo 1. Modification temporaire de pg_hba.conf pour IT...
set "PG_HBA=C:\Program Files\PostgreSQL\13\data\pg_hba.conf"

echo # PostgreSQL Client Authentication Configuration File > "%PG_HBA%"
echo # =================================================== >> "%PG_HBA%"
echo. >> "%PG_HBA%"
echo # TYPE  DATABASE        USER            ADDRESS                 METHOD >> "%PG_HBA%"
echo. >> "%PG_HBA%"
echo # "local" is for Unix domain socket connections only >> "%PG_HBA%"
echo local   all             all                                     trust >> "%PG_HBA%"
echo # IPv4 local connections: >> "%PG_HBA%"
echo host    all             all             127.0.0.1/32            trust >> "%PG_HBA%"
echo # IPv6 local connections: >> "%PG_HBA%"
echo host    all             all             ::1/128                 trust >> "%PG_HBA%"
echo. >> "%PG_HBA%"
echo # Configuration specifique pour IT >> "%PG_HBA%"
echo host    all             IT              127.0.0.1/32            md5 >> "%PG_HBA%"
echo host    all             IT              ::1/128                 md5 >> "%PG_HBA%"

echo ✅ Configuration modifiee

echo 2. Redemarrage de PostgreSQL...
net stop postgresql-x64-13 >nul 2>&1
timeout /t 2 /nobreak >nul
net start postgresql-x64-13 >nul 2>&1

echo ✅ PostgreSQL redemarre

echo 3. Test de connexion avec IT...
psql -U IT -d postgres -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erreur: Impossible de se connecter avec IT
    echo 💡 Tentative avec mot de passe...
    psql "postgresql://IT:LoftAlgerie2025!@localhost:5432/postgres" -c "SELECT 1;" >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Echec de connexion avec mot de passe
        echo 💡 Retour a la configuration TRUST
        goto RESTORE_TRUST
    ) else (
        echo ✅ Connexion reussie avec mot de passe !
    )
) else (
    echo ✅ Connexion reussie avec IT !
)

echo.
echo 🎯 Configuration terminee !
echo.
echo 📋 Prochaine etape: .\setup-local-databases.bat
echo.
goto END

:RESTORE_TRUST
echo 4. Restauration de la configuration TRUST...
echo # PostgreSQL Client Authentication Configuration File > "%PG_HBA%"
echo # =================================================== >> "%PG_HBA%"
echo. >> "%PG_HBA%"
echo # TYPE  DATABASE        USER            ADDRESS                 METHOD >> "%PG_HBA%"
echo. >> "%PG_HBA%"
echo # "local" is for Unix domain socket connections only >> "%PG_HBA%"
echo local   all             all                                     trust >> "%PG_HBA%"
echo # IPv4 local connections: >> "%PG_HBA%"
echo host    all             all             127.0.0.1/32            trust >> "%PG_HBA%"
echo # IPv6 local connections: >> "%PG_HBA%"
echo host    all             all             ::1/128                 trust >> "%PG_HBA%"

echo ✅ Configuration TRUST restauree
echo 💡 Utilisez l'URL complete avec mot de passe pour IT

:END
echo.
pause