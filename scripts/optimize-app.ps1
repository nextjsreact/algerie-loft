# Script d'optimisation pour l'application Loft Algerie
Write-Host "Optimisation de l'application Loft Algerie..." -ForegroundColor Cyan

# 1. Nettoyer le cache Next.js
Write-Host "Nettoyage du cache Next.js..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "Cache Next.js supprime" -ForegroundColor Green
} else {
    Write-Host "Aucun cache Next.js trouve" -ForegroundColor Blue
}

# 2. Nettoyer node_modules/.cache si existe
Write-Host "Nettoyage du cache node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "Cache node_modules supprime" -ForegroundColor Green
}

# 3. Verifier les variables d'environnement
Write-Host "Verification des variables d'environnement..." -ForegroundColor Yellow
$envFiles = @(".env.local", ".env.development", ".env")
foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "$file trouve" -ForegroundColor Green
    } else {
        Write-Host "$file manquant" -ForegroundColor Red
    }
}

# 4. Verifier la structure des composants settings
Write-Host "Verification des composants settings..." -ForegroundColor Yellow
$settingsComponents = @(
    "app/settings/categories/page.tsx",
    "app/settings/currencies/page.tsx", 
    "app/settings/payment-methods/page.tsx",
    "app/settings/zone-areas/page.tsx",
    "app/settings/internet-connections/page.tsx"
)

foreach ($component in $settingsComponents) {
    if (Test-Path $component) {
        Write-Host "$component OK" -ForegroundColor Green
    } else {
        Write-Host "$component manquant" -ForegroundColor Red
    }
}

# 5. Verifier le fichier de traductions
Write-Host "Verification des traductions..." -ForegroundColor Yellow
if (Test-Path "lib/i18n/translations.ts") {
    Write-Host "Fichier de traductions trouve" -ForegroundColor Green
} else {
    Write-Host "Fichier de traductions manquant" -ForegroundColor Red
}

Write-Host ""
Write-Host "Optimisation terminee !" -ForegroundColor Cyan
Write-Host "Prochaines etapes :" -ForegroundColor White
Write-Host "1. Executez: npm run dev" -ForegroundColor Gray
Write-Host "2. Ouvrez: http://localhost:3002" -ForegroundColor Gray
Write-Host "3. Si probleme de cookies: Ouvrez scripts/clear-cookies.html" -ForegroundColor Gray

Write-Host ""
Write-Host "Demarrage de l'application..." -ForegroundColor Cyan