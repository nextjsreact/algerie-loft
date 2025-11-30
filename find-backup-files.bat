@echo off
echo.
echo ========================================
echo   RECHERCHE DES FICHIERS DE BACKUP
echo ========================================
echo.

echo [1] Dossier backups du projet:
echo %CD%\backups
dir /B backups\*.sql 2>nul
if errorlevel 1 (
    echo [Aucun fichier trouve]
)
echo.

echo [2] Dossier temporaire Windows:
echo %TEMP%\supabase-cloner
dir /B "%TEMP%\supabase-cloner\*.sql" 2>nul
if errorlevel 1 (
    echo [Aucun fichier trouve]
)
echo.

echo [3] Recherche dans tout le disque C: (peut prendre du temps):
echo Recherche de fichiers full_*.sql...
dir /S /B C:\full_*.sql 2>nul | findstr /I "2025-11-29"
echo.

echo ========================================
echo   INFORMATIONS
echo ========================================
echo.
echo Les backups devraient etre dans:
echo   %CD%\backups\
echo.
echo Les fichiers temporaires sont dans:
echo   %TEMP%\supabase-cloner\
echo.
echo Pour voir le chemin exact, verifier la base de donnees:
echo   SELECT file_path FROM backup_records ORDER BY started_at DESC LIMIT 1;
echo.
echo ========================================
pause
