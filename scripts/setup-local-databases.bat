@echo off
echo.
echo 🚀 CONFIGURATION AUTOMATIQUE DES BASES LOCALES
echo =============================================
echo.
echo Ce script va configurer automatiquement toutes les bases PostgreSQL locales
echo pour les environnements prod, dev, test et learning.
echo.
echo Les operations suivantes seront effectuees :
echo - Creation des bases de donnees PostgreSQL
echo - Mise a jour des fichiers de configuration .env
echo - Test de connectivite
echo.
echo ⚠️ Assurez-vous que PostgreSQL est installe sur votre systeme !
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
echo 🔧 Demarrage de la configuration...
echo.

npx tsx setup-local-databases.ts --with-schema

echo.
echo =============================================
echo CONFIGURATION TERMINEE
echo =============================================
echo.
echo Prochaines etapes recommandees :
echo 1. Testez les connexions : diagnose-connections.bat
echo 2. Clonez les donnees : clone-pg-to-dev.bat
echo 3. Demarrez l'application : npm run dev
echo.
pause