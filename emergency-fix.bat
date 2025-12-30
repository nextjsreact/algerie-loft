@echo off
echo === NETTOYAGE COMPLET ET REINSTALLATION ===

echo 1. Arrêt des processus Node.js...
taskkill /f /im node.exe 2>nul
taskkill /f /im next.exe 2>nul

echo 2. Suppression des caches...
if exist .next rmdir /s /q .next
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist yarn.lock del yarn.lock

echo 3. Nettoyage cache npm...
npm cache clean --force

echo 4. Réinstallation des dépendances...
npm install

echo 5. Vérification de la version Next.js...
npm list next

echo 6. Build de test...
npm run build

echo === TERMINÉ ===
pause