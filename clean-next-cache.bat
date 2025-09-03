@echo off
echo Nettoyage du cache Next.js...

REM Arrêter tous les processus Node.js
taskkill /f /im node.exe 2>nul

REM Attendre un peu
timeout /t 2 /nobreak >nul

REM Supprimer le dossier .next
if exist .next (
    echo Suppression du dossier .next...
    rmdir /s /q .next 2>nul
    if exist .next (
        echo Tentative de suppression forcée...
        rd /s /q .next 2>nul
    )
)

REM Supprimer node_modules/.cache si existe
if exist node_modules\.cache (
    echo Suppression du cache node_modules...
    rmdir /s /q node_modules\.cache 2>nul
)

echo Cache nettoyé !
echo Vous pouvez maintenant redémarrer le serveur avec: npm run dev
pause