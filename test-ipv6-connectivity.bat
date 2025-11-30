@echo off
echo.
echo ========================================
echo   TEST DE CONNECTIVITE IPv6
echo ========================================
echo.

echo [1/5] Verification de l'adaptateur IPv6...
netsh interface ipv6 show interface
echo.

echo [2/5] Verification des adresses IPv6...
ipconfig | findstr "IPv6"
echo.

echo [3/5] Test de connectivite IPv6 generale...
ping -6 -n 2 ipv6.google.com
echo.

echo [4/5] Test de connectivite Supabase IPv6...
ping -6 -n 2 2a05:d014:1c06:5f11:e7f2:7088:c72:86f2
echo.

echo [5/5] Resolution DNS Supabase...
nslookup db.mhngbluefyucoesgcjoy.supabase.co
echo.

echo ========================================
echo   DIAGNOSTIC
echo ========================================
echo.
echo Si tous les tests echouent:
echo   - IPv6 n'est pas active ou configure
echo   - Solution: Installer Cloudflare WARP
echo   - Lien: https://1.1.1.1/
echo.
echo Si ping IPv6 fonctionne mais pas Supabase:
echo   - Probleme de pare-feu ou routage
echo   - Verifier les regles de pare-feu
echo.
echo ========================================
pause
