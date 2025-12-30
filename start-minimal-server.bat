@echo off
echo Starting Next.js server without extensions...
set NODE_ENV=development
set DISABLE_CONSOLE_NINJA=true
set NEXT_TELEMETRY_DISABLED=1
set NODE_OPTIONS=--no-warnings --max-old-space-size=4096
"C:\Program Files\nodejs\node.exe" node_modules\next\dist\bin\next dev --port 3000 --hostname localhost