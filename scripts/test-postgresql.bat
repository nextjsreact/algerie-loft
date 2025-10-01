@echo off
chcp 65001 >nul
echo.
echo 🧪 TEST DE CONNEXION POSTGRESQL
echo ================================
echo.

echo 1. Test de connexion basique...
psql -U postgres -d postgres -c "SELECT version();" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erreur: Impossible de se connecter a PostgreSQL
    echo 💡 Verifiez que PostgreSQL est demarre
    pause
    exit /b 1
)

echo ✅ Connexion PostgreSQL reussie

echo 2. Test des bases de donnees...
echo.

echo Test de loft_prod...
psql -U postgres -d loft_prod -c "SELECT COUNT(*) FROM information_schema.tables;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ loft_prod: Base vide ou inexistante
) else (
    echo ✅ loft_prod: OK
)

echo Test de loft_dev...
psql -U postgres -d loft_dev -c "SELECT COUNT(*) FROM information_schema.tables;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ loft_dev: Base vide ou inexistante
) else (
    echo ✅ loft_dev: OK
)

echo Test de loft_test...
psql -U postgres -d loft_test -c "SELECT COUNT(*) FROM information_schema.tables;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ loft_test: Base vide ou inexistante
) else (
    echo ✅ loft_test: OK
)

echo Test de loft_learning...
psql -U postgres -d loft_learning -c "SELECT COUNT(*) FROM information_schema.tables;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ loft_learning: Base vide ou inexistante
) else (
    echo ✅ loft_learning: OK
)

echo.
echo 🎉 Tests termines !
echo.
echo 📋 Prochaines etapes:
echo 1. .\clone-pg-to-dev.bat (clonage prod vers dev)
echo 2. .\diagnose-connections.ts (diagnostic complet)
echo.
pause