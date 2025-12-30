Write-Host "=== Migration Simple des Composants ===" -ForegroundColor Cyan
Write-Host ""

$sourceDir = "."
$targetDir = "loft-algerie-next16"

Write-Host "✅ Structure corrigée : app/ à la racine (comme l'original)" -ForegroundColor Green
Write-Host ""

# Copier les composants essentiels un par un
Write-Host "Migration des composants UI essentiels..." -ForegroundColor Yellow

$uiComponents = @(
    "components\ui\button.tsx",
    "components\ui\card.tsx", 
    "components\ui\input.tsx",
    "components\ui\label.tsx"
)

foreach ($component in $uiComponents) {
    if (Test-Path "$sourceDir\$component") {
        Write-Host "  ✅ $component" -ForegroundColor Green
        Copy-Item "$sourceDir\$component" "$targetDir\$component" -Force
    } else {
        Write-Host "  ⚠️  $component (non trouvé)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Migration des providers de base..." -ForegroundColor Yellow

$providers = @(
    "components\providers\client-providers.tsx",
    "components\providers\theme-provider.tsx"
)

# Créer le dossier providers s'il n'existe pas
if (!(Test-Path "$targetDir\components\providers")) {
    New-Item -ItemType Directory -Path "$targetDir\components\providers" -Force | Out-Null
}

foreach ($provider in $providers) {
    if (Test-Path "$sourceDir\$provider") {
        Write-Host "  ✅ $provider" -ForegroundColor Green
        Copy-Item "$sourceDir\$provider" "$targetDir\$provider" -Force
    }
}

Write-Host ""
Write-Host "=== MIGRATION TERMINÉE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Structure maintenant compatible avec votre projet original !" -ForegroundColor Cyan
Write-Host "app/ à la racine (pas dans src/)" -ForegroundColor Gray