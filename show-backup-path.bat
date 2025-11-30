@echo off
echo.
echo ========================================
echo   CHEMIN DES DUMPS DE SAUVEGARDE
echo ========================================
echo.
echo Chemin absolu du dossier backups:
echo %CD%\backups
echo.
echo Contenu du dossier:
echo.
if exist backups (
    dir /B backups\*.sql 2>nul
    if errorlevel 1 (
        echo [Aucun fichier .sql trouve]
    )
) else (
    echo [Le dossier backups n'existe pas encore]
    echo Il sera cree automatiquement lors de la premiere sauvegarde
)
echo.
echo ========================================
echo Pour ouvrir le dossier dans l'explorateur:
echo   start backups
echo ========================================
echo.
pause
