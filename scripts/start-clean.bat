@echo off
echo 🧹 Nettoyage et démarrage de l'application...
echo.

REM Supprimer .next s'il existe
if exist .next (
    echo Suppression du cache .next...
    rmdir /s /q .next
    echo ✅ Cache .next supprimé
) else (
    echo ℹ️ Pas de cache .next à supprimer
)

REM Supprimer node_modules\.cache s'il existe
if exist node_modules\.cache (
    echo Suppression du cache node_modules...
    rmdir /s /q node_modules\.cache
    echo ✅ Cache node_modules supprimé
) else (
    echo ℹ️ Pas de cache node_modules à supprimer
)

echo.
echo 🚀 Démarrage du serveur de développement...
echo.
npm run dev