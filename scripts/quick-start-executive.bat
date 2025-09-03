@echo off
REM 🚀 Script de démarrage rapide - Tableau de Bord Exécutif (Windows)
REM Ce script automatise le déploiement complet du système executive

echo 🎯 Démarrage du déploiement du Tableau de Bord Exécutif...
echo ==================================================

REM Vérifier les variables d'environnement
if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo ❌ Variable NEXT_PUBLIC_SUPABASE_URL manquante
    echo Assurez-vous que les variables d'environnement Supabase sont définies
    pause
    exit /b 1
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ❌ Variable SUPABASE_SERVICE_ROLE_KEY manquante
    echo Assurez-vous que les variables d'environnement Supabase sont définies
    pause
    exit /b 1
)

echo ✅ Variables d'environnement vérifiées

REM Étape 1: Afficher le script SQL à exécuter
echo.
echo 📋 ÉTAPE 1: Configuration de la base de données
echo ==============================================
echo Copiez et exécutez le contenu suivant dans votre Supabase SQL Editor:
echo.
echo --- DÉBUT DU SCRIPT SQL ---
type scripts\add-executive-role.sql
echo --- FIN DU SCRIPT SQL ---
echo.

pause

REM Étape 2: Test automatisé
echo.
echo 🧪 ÉTAPE 2: Test automatisé du déploiement
echo ==========================================

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Exécution du test automatisé...
    node scripts\test-executive-dashboard.js
) else (
    echo ⚠️ Node.js non trouvé, test automatisé ignoré
)

REM Étape 3: Instructions finales
echo.
echo 🎉 ÉTAPE 3: Déploiement terminé !
echo ================================
echo.
echo 📋 Prochaines étapes :
echo 1. Démarrez votre serveur de développement : npm run dev
echo 2. Connectez-vous avec le compte executive :
echo    📧 Email: executive@loftmanager.com
echo    🔑 Mot de passe: executive123
echo 3. Accédez au tableau de bord : http://localhost:3000/executive
echo.
echo 🔧 Configuration optionnelle :
echo - Configurez les alertes automatiques (voir EXECUTIVE_DASHBOARD_SETUP.md)
echo - Personnalisez les seuils d'alerte selon vos besoins
echo - Changez les mots de passe par défaut
echo.
echo 📚 Documentation complète : EXECUTIVE_DASHBOARD_SETUP.md
echo.
echo 🎯 Votre tableau de bord exécutif est prêt à l'emploi !
echo ==================================================

pause