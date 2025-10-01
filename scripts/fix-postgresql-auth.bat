@echo off
echo.
echo 🔧 CORRECTION AUTOMATIQUE POSTGRESQL
echo ===================================
echo.
echo Ce script va essayer de corriger automatiquement les problemes
echo d'authentification PostgreSQL.
echo.
echo Les operations suivantes seront effectuees :
echo - Diagnostic de la configuration actuelle
echo - Application de corrections automatiques
echo - Test des corrections
echo - Redemarrage de PostgreSQL si necessaire
echo.

set /p choice="Voulez-vous continuer ? (O/N) : "
if /i not "%choice%"=="O" if /i not "%choice%"=="o" (
    echo.
    echo ❌ Operation annulee par l'utilisateur.
    echo.
    pause
    exit /b 1
)

echo.
echo 🔍 Diagnostic en cours...
echo.

npx tsx fix-postgresql-auth.ts

echo.
echo ===================================
echo CORRECTION TERMINEE
echo ===================================
echo.
echo Prochaines etapes :
echo 1. Si la correction a fonctionne : setup-local-databases.bat
echo 2. Si la correction n'a pas fonctionne : diagnose-postgresql.bat
echo 3. Redemarrer manuellement PostgreSQL si necessaire
echo.
pause