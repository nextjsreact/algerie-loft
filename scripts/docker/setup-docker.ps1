# ============================================================================
# Script de configuration Docker pour Airbnb Scraper
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Configuration Docker - Airbnb Scraper" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Étape 1: Vérifier Docker ────────────────────────────────────────────────
Write-Host "1. Vérification de Docker..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version
    Write-Host "   ✅ Docker installé: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker non installé ou non démarré" -ForegroundColor Red
    Write-Host "   Solution: Démarrez Docker Desktop" -ForegroundColor Yellow
    exit 1
}

try {
    docker ps | Out-Null
    Write-Host "   ✅ Docker daemon actif" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker daemon non accessible" -ForegroundColor Red
    Write-Host "   Solution: Démarrez Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ── Étape 2: Créer la structure ────────────────────────────────────────────
Write-Host "2. Création de la structure..." -ForegroundColor Yellow

$dockerDir = "d:\Airbnb_transfer_v2\docker"
if (-not (Test-Path $dockerDir)) {
    New-Item -ItemType Directory -Path $dockerDir -Force | Out-Null
    Write-Host "   ✅ Dossier docker créé" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Dossier docker existe déjà" -ForegroundColor Gray
}

Write-Host ""

# ── Étape 3: Copier les fichiers ───────────────────────────────────────────
Write-Host "3. Copie des fichiers Docker..." -ForegroundColor Yellow

$files = @(
    @{Source="scripts\docker\Dockerfile"; Dest="d:\Airbnb_transfer_v2\Dockerfile"}
    @{Source="scripts\docker\docker-compose.yml"; Dest="$dockerDir\docker-compose.yml"}
    @{Source="scripts\docker\requirements.txt"; Dest="d:\Airbnb_transfer_v2\requirements.txt"}
    @{Source="scripts\docker\.env.example"; Dest="$dockerDir\.env.example"}
)

foreach ($file in $files) {
    if (Test-Path $file.Source) {
        Copy-Item $file.Source -Destination $file.Dest -Force
        Write-Host "   ✅ $($file.Source) → $($file.Dest)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $($file.Source) non trouvé" -ForegroundColor Yellow
    }
}

Write-Host ""

# ── Étape 4: Configurer .env ───────────────────────────────────────────────
Write-Host "4. Configuration de .env..." -ForegroundColor Yellow

$envFile = "$dockerDir\.env"
if (-not (Test-Path $envFile)) {
    Copy-Item "$dockerDir\.env.example" -Destination $envFile
    Write-Host "   ✅ Fichier .env créé depuis .env.example" -ForegroundColor Green
    Write-Host "   ⚠️  IMPORTANT: Éditez $envFile avec vos identifiants!" -ForegroundColor Yellow
} else {
    Write-Host "   ℹ️  Fichier .env existe déjà" -ForegroundColor Gray
}

Write-Host ""

# ── Étape 5: Construire l'image ────────────────────────────────────────────
Write-Host "5. Construction de l'image Docker..." -ForegroundColor Yellow
Write-Host "   ⏳ Cela peut prendre 5-10 minutes..." -ForegroundColor Gray
Write-Host ""

try {
    Set-Location "d:\Airbnb_transfer_v2"
    docker build -f Dockerfile -t airbnb-scraper:latest . 2>&1 | ForEach-Object {
        if ($_ -match "Step \d+/\d+") {
            Write-Host "   $_" -ForegroundColor Gray
        }
    }
    Write-Host ""
    Write-Host "   ✅ Image Docker construite avec succès" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur lors de la construction: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ── Étape 6: Vérifier l'image ──────────────────────────────────────────────
Write-Host "6. Vérification de l'image..." -ForegroundColor Yellow

$image = docker images airbnb-scraper:latest --format "{{.Repository}}:{{.Tag}} ({{.Size}})"
if ($image) {
    Write-Host "   ✅ Image créée: $image" -ForegroundColor Green
} else {
    Write-Host "   ❌ Image non trouvée" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ── Résumé ──────────────────────────────────────────────────────────────────
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Éditez le fichier .env:" -ForegroundColor White
Write-Host "   notepad $envFile" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Testez le scraper:" -ForegroundColor White
Write-Host "   cd $dockerDir" -ForegroundColor Gray
Write-Host "   docker-compose --profile manual up airbnb-scraper-full" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Consultez le README:" -ForegroundColor White
Write-Host "   notepad scripts\docker\README.md" -ForegroundColor Gray
Write-Host ""
