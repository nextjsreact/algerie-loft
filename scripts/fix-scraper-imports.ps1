# ============================================================================
# Script de correction des imports dans airbnb_scraper.py
# ============================================================================

$SCRAPER_PATH = "d:\Airbnb_transfer_v2\airbnb_scraper.py"
$BACKUP_PATH = "d:\Airbnb_transfer_v2\airbnb_scraper.py.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Correction de airbnb_scraper.py" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le fichier existe
if (-not (Test-Path $SCRAPER_PATH)) {
    Write-Host "Erreur: Fichier non trouvé: $SCRAPER_PATH" -ForegroundColor Red
    exit 1
}

# Créer une sauvegarde
Write-Host "1. Création d'une sauvegarde..." -ForegroundColor Yellow
Copy-Item $SCRAPER_PATH $BACKUP_PATH -Force
Write-Host "   Sauvegarde: $BACKUP_PATH" -ForegroundColor Green
Write-Host ""

# Lire le contenu
Write-Host "2. Lecture du fichier..." -ForegroundColor Yellow
$content = Get-Content $SCRAPER_PATH -Raw -Encoding UTF8

# Correction 1: Import
Write-Host "3. Correction de l'import..." -ForegroundColor Yellow
$content = $content -replace 'from supabase_client import', 'from airbnb_api_client import'
$content = $content -replace 'USE_SUPABASE = True', 'USE_API = True'
$content = $content -replace 'USE_SUPABASE = False', 'USE_API = False'
Write-Host "   OK" -ForegroundColor Green
Write-Host ""

# Correction 2: Fonction push_to_supabase
Write-Host "4. Correction des fonctions..." -ForegroundColor Yellow
$content = $content -replace 'def push_to_supabase', 'def push_to_nextjs'
$content = $content -replace 'push_to_supabase\(', 'push_to_nextjs('
$content = $content -replace 'if not USE_SUPABASE:', 'if not USE_API:'
$content = $content -replace 'Supabase non configuré', 'API Next.js non configurée'
$content = $content -replace 'Push vers Supabase', 'Envoi vers l''API Next.js'
$content = $content -replace 'Supabase mis à jour', 'API Next.js synchronisée'
Write-Host "   OK" -ForegroundColor Green
Write-Host ""

# Sauvegarder
Write-Host "5. Sauvegarde du fichier corrigé..." -ForegroundColor Yellow
$content | Out-File -FilePath $SCRAPER_PATH -Encoding UTF8 -NoNewline
Write-Host "   OK" -ForegroundColor Green
Write-Host ""

# Vérification
Write-Host "6. Vérification..." -ForegroundColor Yellow
$verif = Get-Content $SCRAPER_PATH -Raw
if ($verif -match 'from airbnb_api_client import' -and $verif -match 'USE_API') {
    Write-Host "   OK - Corrections appliquées" -ForegroundColor Green
} else {
    Write-Host "   ERREUR - Corrections non appliquées" -ForegroundColor Red
    Write-Host "   Restauration de la sauvegarde..." -ForegroundColor Yellow
    Copy-Item $BACKUP_PATH $SCRAPER_PATH -Force
    exit 1
}
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Corrections terminées!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Reconstruire l'image Docker:" -ForegroundColor White
Write-Host "   cd d:\Airbnb_transfer_v2" -ForegroundColor Gray
Write-Host "   docker build -f Dockerfile -t airbnb-scraper:latest ." -ForegroundColor Gray
Write-Host ""
Write-Host "2. Relancer le scraper:" -ForegroundColor White
Write-Host "   cd docker" -ForegroundColor Gray
Write-Host "   docker-compose --profile manual up airbnb-scraper-full" -ForegroundColor Gray
Write-Host ""
