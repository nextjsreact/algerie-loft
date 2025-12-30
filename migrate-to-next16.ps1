Write-Host "=== Migration vers Next.js 16.1 ===" -ForegroundColor Cyan
Write-Host ""

$sourceDir = "."
$targetDir = "loft-algerie-next16"

Write-Host "Copie des fichiers essentiels..." -ForegroundColor Yellow

# Créer les dossiers nécessaires
$folders = @("lib", "components", "app", "styles", "types", "utils", "contexts", "hooks", "middleware")
foreach ($folder in $folders) {
    if (Test-Path "$sourceDir\$folder") {
        Write-Host "Copie du dossier: $folder" -ForegroundColor Green
        if (!(Test-Path "$targetDir\src\$folder")) {
            New-Item -ItemType Directory -Path "$targetDir\src\$folder" -Force | Out-Null
        }
        Copy-Item "$sourceDir\$folder\*" "$targetDir\src\$folder\" -Recurse -Force
    }
}

# Copier les fichiers de configuration
$configFiles = @(
    "next.config.mjs",
    "tailwind.config.ts",
    "middleware.ts",
    "i18n.ts",
    ".env.local",
    ".env.example"
)

foreach ($file in $configFiles) {
    if (Test-Path "$sourceDir\$file") {
        Write-Host "Copie du fichier: $file" -ForegroundColor Green
        Copy-Item "$sourceDir\$file" "$targetDir\" -Force
    }
}

# Copier les dossiers publics
if (Test-Path "$sourceDir\public") {
    Write-Host "Copie du dossier public..." -ForegroundColor Green
    Copy-Item "$sourceDir\public\*" "$targetDir\public\" -Recurse -Force
}

# Copier les messages de traduction
if (Test-Path "$sourceDir\messages") {
    Write-Host "Copie des traductions..." -ForegroundColor Green
    Copy-Item "$sourceDir\messages" "$targetDir\" -Recurse -Force
}

Write-Host ""
Write-Host "=== MIGRATION TERMINEE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. cd loft-algerie-next16" -ForegroundColor White
Write-Host "2. Installez les dependances manquantes:" -ForegroundColor White
Write-Host "   bun add @supabase/supabase-js @supabase/ssr next-intl" -ForegroundColor Gray
Write-Host "3. bun dev" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Verifiez et ajustez les imports dans vos fichiers!" -ForegroundColor Yellow