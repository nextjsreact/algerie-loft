@echo off
chcp 65001 >nul
echo.
echo ⚡ CORRECTION RAPIDE - UTILISATEUR POSTGRES
echo ==========================================
echo.

echo 1. Modification des fichiers .env pour utiliser postgres...
echo.

set "ENV_DIR=../env-backup"

echo Modification de .env.development...
powershell -Command "(Get-Content '%ENV_DIR%/.env.development') -replace 'IT', 'postgres' | Set-Content '%ENV_DIR%/.env.development'"
powershell -Command "(Get-Content '%ENV_DIR%/.env.development') -replace 'LoftAlgerie2025!', '' | Set-Content '%ENV_DIR%/.env.development'"

echo Modification de .env.test...
powershell -Command "(Get-Content '%ENV_DIR%/.env.test') -replace 'IT', 'postgres' | Set-Content '%ENV_DIR%/.env.test'"
powershell -Command "(Get-Content '%ENV_DIR%/.env.test') -replace 'LoftAlgerie2025!', '' | Set-Content '%ENV_DIR%/.env.test'"

echo Modification de .env.prod...
powershell -Command "(Get-Content '%ENV_DIR%/.env.prod') -replace 'IT', 'postgres' | Set-Content '%ENV_DIR%/.env.prod'"
powershell -Command "(Get-Content '%ENV_DIR%/.env.prod') -replace 'LoftAlgerie2025!', '' | Set-Content '%ENV_DIR%/.env.prod'"

echo Modification de .env.learning...
powershell -Command "(Get-Content '%ENV_DIR%/.env.learning') -replace 'IT', 'postgres' | Set-Content '%ENV_DIR%/.env.learning'"
powershell -Command "(Get-Content '%ENV_DIR%/.env.learning') -replace 'LoftAlgerie2025!', '' | Set-Content '%ENV_DIR%/.env.learning'"

echo ✅ Fichiers .env modifies

echo 2. Test de connexion avec postgres...
psql -U postgres -d postgres -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erreur: Impossible de se connecter avec postgres
    pause
    exit /b 1
)

echo ✅ Connexion reussie avec postgres

echo 3. Creation des bases de donnees...
echo Creation de loft_prod...
createdb -U postgres loft_prod >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ loft_prod existe deja ou erreur
) else (
    echo ✅ loft_prod creee
)

echo Creation de loft_dev...
createdb -U postgres loft_dev >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ loft_dev existe deja ou erreur
) else (
    echo ✅ loft_dev creee
)

echo Creation de loft_test...
createdb -U postgres loft_test >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ loft_test existe deja ou erreur
) else (
    echo ✅ loft_test creee
)

echo Creation de loft_learning...
createdb -U postgres loft_learning >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ loft_learning existe deja ou erreur
) else (
    echo ✅ loft_learning creee
)

echo.
echo 🎉 Configuration terminee avec postgres !
echo.
echo 📋 Prochaines etapes:
echo 1. .\test-postgresql.bat
echo 2. .\clone-pg-to-dev.bat
echo.
pause