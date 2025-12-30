@echo off
echo Demarrage serveur Next.js sans extensions...
set NODE_ENV=development
set NEXT_TELEMETRY_DISABLED=1
set DISABLE_CONSOLE_NINJA=true
set CONSOLE_NINJA_DISABLED=true
"C:\Program Files\nodejs\node.exe" node_modules\next\dist\bin\next dev --port 3000