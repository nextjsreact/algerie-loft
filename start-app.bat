@echo off
echo 🚀 Démarrage de l'application Loft Algérie
echo.

REM Arrêter tous les processus Node.js existants
echo 🛑 Arrêt des processus Node.js existants...
taskkill /f /im node.exe >nul 2>&1

REM Attendre un peu
timeout /t 2 /nobreak >nul

REM Supprimer le cache .next s'il existe
if exist .next (
    echo 🧹 Suppression du cache .next...
    rmdir /s /q .next
)

REM Nettoyer le cache npm
echo 🧹 Nettoyage du cache npm...
npm cache clean --force >nul 2>&1

echo.
echo 🚀 Démarrage du serveur de développement...
echo 📱 L'application sera disponible sur http://localhost:3000
echo 📊 Page des rapports : http://localhost:3000/reports
echo.
echo ⚠️ Si le port 3000 est occupé, l'app démarrera sur le port 3001
echo.

npm run dev