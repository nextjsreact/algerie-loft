@echo off
set DISABLE_CONSOLE_NINJA=true
set NODE_OPTIONS=--no-warnings
"C:\Program Files\nodejs\node.exe" node_modules\next\dist\bin\next dev --port 3000