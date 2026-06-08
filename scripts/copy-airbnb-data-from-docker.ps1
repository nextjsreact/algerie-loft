# Script PowerShell pour copier les données Airbnb depuis le conteneur Docker
# Usage: .\copy-airbnb-data-from-docker.ps1

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   Copie des données Airbnb depuis le conteneur Docker" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$containerName = "airbnb_scraper_full"
$outputDir = "d:\Airbnb_transfer_v2\output"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Vérifier que Docker est démarré
Write-Host "🔍 Vérification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   ✅ Docker détecté: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker n'est pas démarré ou n'est pas installé" -ForegroundColor Red
    Write-Host "   Veuillez démarrer Docker Desktop et réessayer" -ForegroundColor Red
    exit 1
}

# Vérifier que le conteneur existe
Write-Host ""
Write-Host "🔍 Vérification du conteneur '$containerName'..." -ForegroundColor Yellow
$containerExists = docker ps -a --filter "name=$containerName" --format "{{.Names}}" | Select-String -Pattern $containerName

if (-not $containerExists) {
    Write-Host "   ❌ Conteneur '$containerName' introuvable" -ForegroundColor Red
    Write-Host ""
    Write-Host "Conteneurs disponibles:" -ForegroundColor Yellow
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
    exit 1
}

Write-Host "   ✅ Conteneur trouvé" -ForegroundColor Green

# Vérifier le statut du conteneur
$containerStatus = docker ps -a --filter "name=$containerName" --format "{{.Status}}"
Write-Host "   📊 Statut: $containerStatus" -ForegroundColor Cyan

# Créer le dossier de destination
Write-Host ""
Write-Host "📁 Création du dossier de destination..." -ForegroundColor Yellow
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
    Write-Host "   ✅ Dossier créé: $outputDir" -ForegroundColor Green
} else {
    Write-Host "   ✅ Dossier existant: $outputDir" -ForegroundColor Green
}

# Lister les fichiers disponibles dans le conteneur
Write-Host ""
Write-Host "📋 Fichiers disponibles dans le conteneur:" -ForegroundColor Yellow
try {
    $containerFiles = docker exec $containerName ls -lh /app/output/ 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host $containerFiles -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️  Impossible de lister les fichiers (conteneur arrêté?)" -ForegroundColor Yellow
        Write-Host "   Tentative de copie quand même..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Impossible de lister les fichiers (conteneur arrêté?)" -ForegroundColor Yellow
    Write-Host "   Tentative de copie quand même..." -ForegroundColor Yellow
}

# Copier les fichiers
Write-Host ""
Write-Host "📦 Copie des fichiers..." -ForegroundColor Yellow

$filesToCopy = @(
    @{
        Source = "/app/output/reservations_airbnb.json"
        Dest = "$outputDir\reservations_airbnb_$timestamp.json"
        Description = "Réservations (JSON)"
        Required = $true
    },
    @{
        Source = "/app/output/reservations_airbnb.csv"
        Dest = "$outputDir\reservations_airbnb_$timestamp.csv"
        Description = "Réservations (CSV)"
        Required = $false
    },
    @{
        Source = "/app/output/listings.json"
        Dest = "$outputDir\listings_$timestamp.json"
        Description = "Annonces (JSON)"
        Required = $false
    }
)

$successCount = 0
$failCount = 0
$copiedFiles = @()

foreach ($file in $filesToCopy) {
    Write-Host ""
    Write-Host "   📄 $($file.Description)..." -ForegroundColor Cyan
    Write-Host "      Source: $($file.Source)" -ForegroundColor Gray
    Write-Host "      Destination: $($file.Dest)" -ForegroundColor Gray
    
    try {
        docker cp "${containerName}:$($file.Source)" "$($file.Dest)" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0 -and (Test-Path $file.Dest)) {
            $fileSize = (Get-Item $file.Dest).Length
            $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
            Write-Host "      ✅ Copié avec succès ($fileSizeMB MB)" -ForegroundColor Green
            $successCount++
            $copiedFiles += $file.Dest
        } else {
            if ($file.Required) {
                Write-Host "      ❌ Échec de la copie (fichier requis)" -ForegroundColor Red
                $failCount++
            } else {
                Write-Host "      ⚠️  Fichier non trouvé (optionnel)" -ForegroundColor Yellow
            }
        }
    } catch {
        if ($file.Required) {
            Write-Host "      ❌ Erreur: $_" -ForegroundColor Red
            $failCount++
        } else {
            Write-Host "      ⚠️  Fichier non trouvé (optionnel)" -ForegroundColor Yellow
        }
    }
}

# Créer un lien symbolique vers la dernière version (pour faciliter l'utilisation)
if ($copiedFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "🔗 Création de liens vers les dernières versions..." -ForegroundColor Yellow
    
    $latestJsonPath = "$outputDir\reservations_airbnb_latest.json"
    $sourceJsonPath = "$outputDir\reservations_airbnb_$timestamp.json"
    
    if (Test-Path $sourceJsonPath) {
        # Supprimer l'ancien lien s'il existe
        if (Test-Path $latestJsonPath) {
            Remove-Item $latestJsonPath -Force
        }
        
        # Créer une copie (les liens symboliques nécessitent des droits admin)
        Copy-Item $sourceJsonPath $latestJsonPath -Force
        Write-Host "   ✅ Lien créé: reservations_airbnb_latest.json" -ForegroundColor Green
    }
}

# Résumé
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   RÉSUMÉ" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "✅ Fichiers copiés: $successCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "❌ Échecs: $failCount" -ForegroundColor Red
}
Write-Host ""
Write-Host "📁 Dossier de destination: $outputDir" -ForegroundColor Cyan
Write-Host ""

if ($copiedFiles.Count -gt 0) {
    Write-Host "Fichiers copiés:" -ForegroundColor Yellow
    foreach ($file in $copiedFiles) {
        Write-Host "   - $file" -ForegroundColor Gray
    }
    Write-Host ""
}

# Afficher les prochaines étapes
if ($successCount -gt 0) {
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "   PROCHAINES ÉTAPES" -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Vérifier les données copiées:" -ForegroundColor Yellow
    Write-Host "   Get-ChildItem $outputDir" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Démarrer le serveur Next.js (si pas déjà démarré):" -ForegroundColor Yellow
    Write-Host "   cd c:\Users\SERVICE-INFO\IA\algerie-loft" -ForegroundColor Gray
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Envoyer les données à l'API:" -ForegroundColor Yellow
    Write-Host "   cd c:\Users\SERVICE-INFO\IA\algerie-loft\scripts" -ForegroundColor Gray
    Write-Host "   python send-airbnb-data-to-api.py $outputDir\reservations_airbnb_latest.json" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ou utiliser le guide complet:" -ForegroundColor Yellow
    Write-Host "   code c:\Users\SERVICE-INFO\IA\algerie-loft\scripts\AIRBNB_DATA_TRANSFER_GUIDE.md" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "======================================================================" -ForegroundColor Cyan

# Code de sortie
if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
