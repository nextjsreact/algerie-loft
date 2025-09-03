@echo off
echo Nettoyage du cache Next.js...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul
echo Cache nettoyé !