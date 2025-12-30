# Fix ChunkLoadError - Nettoyage complet
Write-Host "=== FIX CHUNK LOAD ERROR ===" -ForegroundColor Green

# 1. Arrêter tous les processus Node.js
Write-Host "1. Arrêt des processus Node.js..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "next" -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Supprimer les dossiers de cache
Write-Host "2. Suppression des caches..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
if (Test-Path "yarn.lock") { Remove-Item -Force "yarn.lock" }

# 3. Nettoyer le cache npm
Write-Host "3. Nettoyage cache npm..." -ForegroundColor Yellow
npm cache clean --force

# 4. Vérifier la version Next.js dans package.json
Write-Host "4. Vérification package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
Write-Host "Version Next.js dans package.json: $($packageJson.dependencies.next)" -ForegroundColor Cyan

# 5. Réinstaller les dépendances
Write-Host "5. Réinstallation des dépendances..." -ForegroundColor Yellow
npm install

# 6. Vérifier l'installation
Write-Host "6. Vérification de l'installation..." -ForegroundColor Yellow
npm list next

# 7. Test de build
Write-Host "7. Test de build..." -ForegroundColor Yellow
npm run build

Write-Host "=== TERMINÉ ===" -ForegroundColor Green
Write-Host "Vous pouvez maintenant lancer: npm run dev" -ForegroundColor Cyan