@echo off
echo ========================================
echo Demarrage avec modules fonctionnels
echo ========================================

REM Copier la configuration corrigée vers loft-algerie-next16
copy "next.config.mjs" "loft-algerie-next16\next.config.mjs" /Y
copy "lib\security\password-security.ts" "loft-algerie-next16\lib\security\password-security.ts" /Y

REM Démarrer depuis loft-algerie-next16 avec notre config
cd loft-algerie-next16
echo Demarrage depuis loft-algerie-next16 avec config corrigee...
npm run dev