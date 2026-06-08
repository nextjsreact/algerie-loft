# Script de réparation pour Next.js dev server
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "RÉPARATION DU SERVEUR DE DÉVELOPPEMENT NEXT.JS" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# Étape 1: Vérifier Node.js
Write-Host "`n1. Vérification de Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "   Version Node.js: $nodeVersion" -ForegroundColor Green

# Étape 2: Vérifier npm
Write-Host "`n2. Vérification de npm..." -ForegroundColor Yellow
$npmVersion = npm --version
Write-Host "   Version npm: $npmVersion" -ForegroundColor Green

# Étape 3: Nettoyer les caches
Write-Host "`n3. Nettoyage des caches..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Write-Host "   Suppression de .next..." -ForegroundColor Gray
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
}
if (Test-Path "node_modules\.cache") {
    Write-Host "   Suppression de node_modules\.cache..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
}
Write-Host "   ✓ Caches nettoyés" -ForegroundColor Green

# Étape 4: Vérifier next.config.mjs
Write-Host "`n4. Vérification de next.config.mjs..." -ForegroundColor Yellow
if (Test-Path "next.config.mjs") {
    Write-Host "   ✓ next.config.mjs existe" -ForegroundColor Green
} else {
    Write-Host "   ✗ next.config.mjs manquant!" -ForegroundColor Red
}

# Étape 5: Vérifier le dossier app
Write-Host "`n5. Vérification du dossier app..." -ForegroundColor Yellow
if (Test-Path "app") {
    $appFiles = (Get-ChildItem app -Recurse -File | Measure-Object).Count
    Write-Host "   ✓ Dossier app existe ($appFiles fichiers)" -ForegroundColor Green
} else {
    Write-Host "   ✗ Dossier app manquant!" -ForegroundColor Red
}

# Étape 6: Vérifier Next.js dans node_modules
Write-Host "`n6. Vérification de Next.js..." -ForegroundColor Yellow
if (Test-Path "node_modules\next") {
    $nextPackage = Get-Content "node_modules\next\package.json" | ConvertFrom-Json
    Write-Host "   ✓ Next.js installé (version $($nextPackage.version))" -ForegroundColor Green
} else {
    Write-Host "   ✗ Next.js non installé!" -ForegroundColor Red
    Write-Host "   Installation de Next.js..." -ForegroundColor Yellow
    npm install next@16.1.1
}

# Étape 7: Vérifier les binaires Next.js
Write-Host "`n7. Vérification des binaires Next.js..." -ForegroundColor Yellow
$nextBin = "node_modules\.bin\next.cmd"
if (Test-Path $nextBin) {
    Write-Host "   ✓ Binaire Next.js trouvé" -ForegroundColor Green
} else {
    Write-Host "   ✗ Binaire Next.js manquant!" -ForegroundColor Red
}

# Étape 8: Tester avec node directement
Write-Host "`n8. Test avec node directement..." -ForegroundColor Yellow
Write-Host "   Tentative: node node_modules\next\dist\bin\next dev" -ForegroundColor Gray

# Étape 9: Solution alternative
Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "SOLUTIONS POSSIBLES" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

Write-Host "`nSolution 1: Utiliser node directement" -ForegroundColor Yellow
Write-Host "   node node_modules\next\dist\bin\next dev" -ForegroundColor White

Write-Host "`nSolution 2: Réinstaller les dépendances" -ForegroundColor Yellow
Write-Host "   Remove-Item -Recurse -Force node_modules" -ForegroundColor White
Write-Host "   Remove-Item package-lock.json" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor White

Write-Host "`nSolution 3: Utiliser yarn au lieu de npm" -ForegroundColor Yellow
Write-Host "   npm install -g yarn" -ForegroundColor White
Write-Host "   yarn install" -ForegroundColor White
Write-Host "   yarn dev" -ForegroundColor White

Write-Host "`nSolution 4: Vérifier les variables d'environnement PATH" -ForegroundColor Yellow
Write-Host "   `$env:PATH" -ForegroundColor White

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "Voulez-vous essayer la Solution 1 maintenant? (O/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "O" -or $response -eq "o") {
    Write-Host "`nDémarrage du serveur avec node directement..." -ForegroundColor Green
    node node_modules\next\dist\bin\next dev
}
