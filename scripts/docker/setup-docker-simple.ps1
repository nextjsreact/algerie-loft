# ============================================================================
# Script de configuration Docker pour Airbnb Scraper (Version simplifiée)
# ============================================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Configuration Docker - Airbnb Scraper" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Docker
Write-Host "1. Vérification de Docker..." -ForegroundColor Yellow
docker --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Erreur: Docker non installé" -ForegroundColor Red
    exit 1
}
Write-Host "   OK" -ForegroundColor Green
Write-Host ""

# Créer dossier
Write-Host "2. Création du dossier docker..." -ForegroundColor Yellow
$dockerDir = "d:\Airbnb_transfer_v2\docker"
New-Item -ItemType Directory -Path $dockerDir -Force | Out-Null
Write-Host "   OK" -ForegroundColor Green
Write-Host ""

# Copier fichiers
Write-Host "3. Copie des fichiers..." -ForegroundColor Yellow
Copy-Item "scripts\docker\Dockerfile" -Destination "d:\Airbnb_transfer_v2\Dockerfile" -Force
Copy-Item "scripts\docker\docker-compose.yml" -Destination "$dockerDir\docker-compose.yml" -Force
Copy-Item "scripts\docker\requirements.txt" -Destination "d:\Airbnb_transfer_v2\requirements.txt" -Force
Copy-Item "scripts\docker\.env.example" -Destination "$dockerDir\.env.example" -Force
Write-Host "   OK" -ForegroundColor Green
Write-Host ""

# Créer .env
Write-Host "4. Configuration .env..." -ForegroundColor Yellow
$envFile = "$dockerDir\.env"
if (-not (Test-Path $envFile)) {
    Copy-Item "$dockerDir\.env.example" -Destination $envFile
    Write-Host "   Fichier .env créé" -ForegroundColor Green
    Write-Host "   IMPORTANT: Éditez $envFile avec vos identifiants!" -ForegroundColor Yellow
}
Write-Host ""

# Construire image
Write-Host "5. Construction de l'image Docker..." -ForegroundColor Yellow
Write-Host "   Cela peut prendre 5-10 minutes..." -ForegroundColor Gray
Set-Location "d:\Airbnb_transfer_v2"
docker build -f Dockerfile -t airbnb-scraper:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Erreur lors de la construction" -ForegroundColor Red
    exit 1
}
Write-Host "   OK" -ForegroundColor Green
Write-Host ""

# Résumé
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Configuration terminée!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Éditez: $envFile" -ForegroundColor White
Write-Host "2. Testez: cd $dockerDir" -ForegroundColor White
Write-Host "3. Lancez: docker-compose --profile manual up airbnb-scraper-full" -ForegroundColor White
Write-Host ""
