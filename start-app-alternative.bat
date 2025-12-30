@echo off
echo === DEMARRAGE APPLICATION SECURISEE ===
echo.
echo Verification securite...
fix-react2shell-next --check
echo.
echo Tentative de demarrage...
echo.

REM Essayer avec npx directement
echo Methode 1: npx next dev
npx next@15.5.9 dev --port 3000

REM Si echec, essayer avec yarn
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Methode 2: yarn dev
    yarn dev
)

REM Si echec, essayer installation rapide puis demarrage
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Methode 3: Installation rapide puis demarrage
    npm install next@15.5.9 --no-optional --force
    npx next dev --port 3000
)

echo.
echo === FIN ===
pause