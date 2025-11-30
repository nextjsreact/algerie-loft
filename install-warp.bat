@echo off
echo.
echo ========================================
echo   INSTALLATION CLOUDFLARE WARP
echo ========================================
echo.
echo Cloudflare WARP fournit un tunnel IPv6 gratuit
echo qui resoudra le probleme de connectivite.
echo.
echo Etapes:
echo 1. Telecharger depuis: https://1.1.1.1/
echo 2. Installer l'application
echo 3. Lancer et activer WARP
echo 4. Attendre 10 secondes
echo 5. Tester la connectivite
echo.
echo ========================================
echo.
echo Voulez-vous ouvrir le site de telechargement?
echo.
pause
start https://1.1.1.1/
echo.
echo Apres installation, executez: test-ipv6-after-warp.bat
echo.
pause
