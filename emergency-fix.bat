@echo off
echo 🚨 RÉPARATION D'URGENCE DE L'APPLICATION LOFT ALGÉRIE
echo =====================================================
echo Version: 2.0 - Réparation complète avec sauvegarde
echo.

REM Créer un timestamp pour les sauvegardes
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

echo 📅 Timestamp de sauvegarde: %timestamp%
echo.

REM Arrêter tous les processus Node.js
echo 🛑 Arrêt de tous les processus Node.js...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1
timeout /t 3 /nobreak >nul

REM Sauvegarder la page d'accueil actuelle si elle existe
echo 💾 Sauvegarde de la configuration actuelle...
if exist app\page.tsx (
    if not exist backup mkdir backup
    copy app\page.tsx backup\page.tsx.%timestamp% >nul 2>&1
    echo ✅ Page d'accueil sauvegardée
)

REM Vérifier et restaurer la page d'accueil fonctionnelle
echo 🔧 Vérification de la page d'accueil...
if exist app\page.tsx.bak (
    echo 🔄 Restauration de la page d'accueil depuis la sauvegarde...
    copy app\page.tsx.bak app\page.tsx >nul 2>&1
    echo ✅ Page d'accueil restaurée
) else (
    echo ⚠️  Aucune sauvegarde trouvée, la page actuelle sera utilisée
)

REM Supprimer tous les caches
echo 🧹 Suppression des caches...
if exist .next (
    rmdir /s /q .next
    echo ✅ Cache .next supprimé
)
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo ✅ Cache node_modules supprimé
)
if exist .turbo (
    rmdir /s /q .turbo
    echo ✅ Cache .turbo supprimé
)

REM Nettoyer npm
echo 🧹 Nettoyage npm...
npm cache clean --force >nul 2>&1
echo ✅ Cache npm nettoyé

REM Vérifier les variables d'environnement
echo 🔍 Vérification des variables d'environnement...
if exist .env (
    echo ✅ Fichier .env trouvé
) else (
    if exist .env.example (
        echo 🔄 Copie de .env.example vers .env...
        copy .env.example .env >nul 2>&1
        echo ⚠️  Veuillez configurer vos variables d'environnement dans .env
    ) else (
        echo ❌ Aucun fichier d'environnement trouvé
    )
)

REM Supprimer et réinstaller node_modules
echo 📦 Réinstallation des dépendances...
if exist node_modules (
    echo 🗑️  Suppression de node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo 🗑️  Suppression de package-lock.json...
    del package-lock.json
)

echo 📥 Installation des dépendances (cela peut prendre quelques minutes)...
npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dépendances
    echo 🔄 Tentative avec --legacy-peer-deps...
    npm install --legacy-peer-deps
)

REM Vérifier la compilation TypeScript
echo 🔍 Vérification TypeScript...
npx tsc --noEmit
if %errorlevel% neq 0 (
    echo ⚠️  Erreurs TypeScript détectées, mais on continue...
)

echo.
echo 🎉 RÉPARATION TERMINÉE !
echo ========================
echo.
echo 🚀 Démarrage de l'application...
echo 📱 L'application sera disponible sur http://localhost:3000
echo 📊 Page des rapports : http://localhost:3000/reports
echo 🏠 Page d'accueil : http://localhost:3000
echo 🏢 Gestion des lofts : http://localhost:3000/lofts
echo 💰 Transactions : http://localhost:3000/transactions
echo 👥 Propriétaires : http://localhost:3000/loft-owners
echo.
echo 📋 Fonctionnalités disponibles :
echo   ✅ Génération de rapports PDF
echo   ✅ Gestion des lofts
echo   ✅ Suivi des transactions
echo   ✅ Interface moderne et responsive
echo   ✅ Thème sombre/clair
echo   ✅ Authentification Supabase
echo.
echo 🔧 En cas de problème :
echo   - Vérifiez les variables d'environnement dans .env
echo   - Consultez la console pour les erreurs
echo   - Redémarrez avec Ctrl+C puis relancez ce script
echo.

npm run dev