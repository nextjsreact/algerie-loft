@echo off
echo ========================================
echo Nettoyage du cache Next.js
echo ========================================

echo Suppression du dossier .next...
if exist .next (
    rmdir /s /q .next
    echo ✓ Cache .next supprime
) else (
    echo ✓ Pas de cache .next a supprimer
)

echo.
echo ========================================
echo Redemarrage du serveur de developpement
echo ========================================
echo.
echo Le serveur va demarrer sur http://localhost:3000
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

npm run dev
