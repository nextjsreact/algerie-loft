@echo off
cls
echo.
echo ==========================================
echo   TEST DES COMPOSANTS MIGRES
echo ==========================================
echo.
echo ✅ Composants UI migres avec succes :
echo    - Button (avec variants)
echo    - Card (Header, Content, Footer)
echo    - Input et Label
echo    - Theme Provider (Dark/Light)
echo.
echo 🚀 Demarrage du serveur de test...
echo.
echo 🌐 Acces: http://localhost:3000
echo.
echo 🎯 Testez :
echo    - Les differents boutons
echo    - Le mode sombre/clair
echo    - Les cartes d'information
echo    - La configuration contact
echo.
bun dev
pause