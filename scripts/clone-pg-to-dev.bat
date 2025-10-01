@echo off
echo 🚀 CLONAGE POSTGRESQL COMPLET - PROD vers DEV
echo ============================================
echo.
echo Ce script va:
echo - Exporter la structure et données depuis PROD
echo - Supprimer complètement la structure de DEV
echo - Recréer la structure complète depuis PROD
echo - Importer toutes les données
echo.
echo ⚠️ ATTENTION: Toutes les données existantes dans DEV seront perdues !
echo.
pause

npx tsx ../scripts/clone-database-pg.ts --source prod --target dev --verbose

echo.
echo ✅ Clonage terminé !
echo.
pause