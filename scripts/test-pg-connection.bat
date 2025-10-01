@echo off
echo 🔍 TEST DE CONNECTIVITÉ POSTGRESQL
echo ==================================
echo.
echo Ce script teste la connectivité aux bases PostgreSQL
echo avant d'effectuer un clonage complet.
echo.

npx tsx scripts/clone-database-pg.ts --dry-run --verbose

echo.
echo ✅ Test de connectivité terminé !
echo.
pause