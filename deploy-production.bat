@echo off
echo ========================================
echo    DEPLOIEMENT PRODUCTION - LOFT ALGERIE
echo ========================================
echo.

echo [1/5] Verification du build...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/5] Build reussi! Preparation du deploiement...
echo.

echo [3/5] Verification de Vercel CLI...
vercel --version
if %errorlevel% neq 0 (
    echo ERREUR: Vercel CLI non installe!
    echo Installez avec: npm i -g vercel
    pause
    exit /b 1
)

echo.
echo [4/5] Lancement du deploiement...
echo.
echo IMPORTANT: 
echo - Selectionnez votre scope/equipe
echo - Confirmez le nom du projet: loft-algerie
echo - Confirmez le repertoire: ./
echo.
pause

echo [5/5] Deploiement en production...
vercel --prod

echo.
echo ========================================
echo    DEPLOIEMENT TERMINE!
echo ========================================
echo.
echo Votre application est maintenant en ligne!
echo Verifiez l'URL fournie par Vercel.
echo.
pause