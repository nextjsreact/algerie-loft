@echo off
echo ========================================
echo FIX: Interface Partners Vide
echo ========================================
echo.

echo [1/4] Arret du serveur...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo     OK - Serveur arrete
echo.

echo [2/4] Nettoyage du cache Next.js...
if exist .next (
    rmdir /s /q .next
    echo     OK - Cache .next supprime
) else (
    echo     OK - Pas de cache a supprimer
)
echo.

echo [3/4] Nettoyage du cache npm...
call npm cache clean --force
echo     OK - Cache npm nettoye
echo.

echo [4/4] Redemarrage du serveur...
echo.
echo ========================================
echo Serveur demarre !
echo ========================================
echo.
echo Testez maintenant :
echo   http://localhost:3000/fr/admin/partners
echo.
echo ========================================
echo.

call npm run dev
