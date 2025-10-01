@echo off
echo 🧪 TEST DE CLONAGE (SIMULATION)
echo ===============================
npx tsx scripts/clone-database.ts --source prod --target dev --dry-run
pause