@echo off
echo.
echo ========================================
echo   TEST IPv6 APRES WARP
echo ========================================
echo.
echo [1/3] Test IPv6 general...
ping -6 -n 2 ipv6.google.com
echo.
echo [2/3] Test Supabase IPv6...
ping -6 -n 2 2a05:d014:1c06:5f11:e7f2:7088:c72:86f2
echo.
echo [3/3] Test hostname Supabase...
ping -n 2 db.mhngbluefyucoesgcjoy.supabase.co
echo.
echo ========================================
echo   RESULTAT
echo ========================================
echo.
echo Si les pings fonctionnent:
echo   ✅ IPv6 est maintenant actif
echo   ✅ Vous pouvez creer des backups
echo   ✅ Allez sur /fr/admin/superuser/backup
echo.
echo Si les pings echouent encore:
echo   ❌ WARP n'est pas active
echo   ❌ Verifier que WARP est lance
echo   ❌ Cliquer sur le bouton pour activer
echo.
echo ========================================
pause
