# Script PowerShell pour automatiser la synchronisation complète Airbnb
# Usage: .\airbnb-full-sync.ps1 [-SkipScraping] [-SkipVerification]

param(
    [switch]$SkipScraping,      # Sauter l'étape de scraping (utiliser les données existantes)
    [switch]$SkipVerification,  # Sauter l'étape de vérification Supabase
    [string]$JsonFile = ""      # Chemin vers un fichier JSON spécifique (optionnel)
)

$ErrorActionPreference = "Stop"

# Configuration
$dockerDir = "d:\Airbnb_transfer_v2\docker"
$outputDir = "d:\Airbnb_transfer_v2\output"
$scriptsDir = "c:\Users\SERVICE-INFO\IA\algerie-loft\scripts"
$projectDir = "c:\Users\SERVICE-INFO\IA\algerie-loft"
$containerName = "airbnb_scraper_full"

# Couleurs
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "   $Message" -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "🔹 $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "   ✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "   ❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "   ⚠️  $Message" -ForegroundColor Yellow
}

function Write-InfoMsg {
    param([string]$Message)
    Write-Host "   ℹ️  $Message" -ForegroundColor Cyan
}

# Fonction pour vérifier si un processus écoute sur un port
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Fonction pour attendre qu'un port soit disponible
function Wait-ForPort {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 60
    )
    
    $elapsed = 0
    while (-not (Test-Port -Port $Port) -and $elapsed -lt $TimeoutSeconds) {
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline
    }
    Write-Host ""
    
    return (Test-Port -Port $Port)
}

# ============================================================================
# DÉBUT DU SCRIPT
# ============================================================================

Write-Header "Synchronisation Complète Airbnb v2.0.0"

Write-InfoMsg "Mode: $(if ($SkipScraping) { 'Utiliser données existantes' } else { 'Scraping complet' })"
Write-InfoMsg "Vérification: $(if ($SkipVerification) { 'Désactivée' } else { 'Activée' })"

# ============================================================================
# ÉTAPE 1: VÉRIFIER DOCKER (si scraping nécessaire)
# ============================================================================

if (-not $SkipScraping) {
    Write-Step "Étape 1/6: Vérification de Docker"
    
    try {
        $dockerVersion = docker --version
        Write-Success "Docker détecté: $dockerVersion"
    } catch {
        Write-Error "Docker n'est pas démarré ou n'est pas installé"
        Write-InfoMsg "Veuillez démarrer Docker Desktop et réessayer"
        exit 1
    }
    
    # ============================================================================
    # ÉTAPE 2: LANCER LE SCRAPER DOCKER
    # ============================================================================
    
    Write-Step "Étape 2/6: Lancement du scraper Docker"
    
    Write-InfoMsg "Cela peut prendre 45-60 minutes pour ~5000 réservations"
    Write-InfoMsg "Vous pouvez suivre la progression dans une autre fenêtre avec:"
    Write-InfoMsg "   docker logs -f $containerName"
    Write-Host ""
    
    $confirmation = Read-Host "Voulez-vous lancer le scraper maintenant? (O/N)"
    if ($confirmation -ne "O" -and $confirmation -ne "o") {
        Write-Warning "Scraping annulé par l'utilisateur"
        $SkipScraping = $true
    } else {
        try {
            Set-Location $dockerDir
            Write-InfoMsg "Lancement du conteneur Docker..."
            
            # Lancer le conteneur en arrière-plan
            docker-compose --profile manual up -d airbnb-scraper-full
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Conteneur démarré avec succès"
                
                # Attendre que le scraping soit terminé
                Write-InfoMsg "Attente de la fin du scraping..."
                Write-InfoMsg "Appuyez sur Ctrl+C pour annuler et passer à l'étape suivante"
                
                try {
                    docker wait $containerName | Out-Null
                    Write-Success "Scraping terminé"
                } catch {
                    Write-Warning "Attente interrompue"
                }
            } else {
                Write-Error "Échec du démarrage du conteneur"
                exit 1
            }
        } catch {
            Write-Error "Erreur lors du lancement du scraper: $_"
            exit 1
        } finally {
            Set-Location $scriptsDir
        }
    }
}

# ============================================================================
# ÉTAPE 3: COPIER LES DONNÉES DEPUIS DOCKER
# ============================================================================

if (-not $SkipScraping -or $JsonFile -eq "") {
    Write-Step "Étape 3/6: Copie des données depuis Docker"
    
    try {
        Set-Location $scriptsDir
        .\copy-airbnb-data-from-docker.ps1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Données copiées avec succès"
            $JsonFile = "$outputDir\reservations_airbnb_latest.json"
        } else {
            Write-Error "Échec de la copie des données"
            exit 1
        }
    } catch {
        Write-Error "Erreur lors de la copie: $_"
        exit 1
    }
} else {
    Write-Step "Étape 3/6: Utilisation des données existantes"
    
    if ($JsonFile -eq "") {
        $JsonFile = "$outputDir\reservations_airbnb_latest.json"
    }
    
    if (-not (Test-Path $JsonFile)) {
        Write-Error "Fichier JSON introuvable: $JsonFile"
        Write-InfoMsg "Veuillez spécifier un fichier valide avec -JsonFile"
        exit 1
    }
    
    Write-Success "Fichier JSON: $JsonFile"
}

# ============================================================================
# ÉTAPE 4: DÉMARRER LE SERVEUR NEXT.JS (si nécessaire)
# ============================================================================

Write-Step "Étape 4/6: Vérification du serveur Next.js"

if (Test-Port -Port 3000) {
    Write-Success "Serveur Next.js déjà démarré sur http://localhost:3000"
} else {
    Write-Warning "Serveur Next.js non détecté"
    Write-InfoMsg "Veuillez démarrer le serveur dans une autre fenêtre avec:"
    Write-InfoMsg "   cd $projectDir"
    Write-InfoMsg "   npm run dev"
    Write-Host ""
    
    $confirmation = Read-Host "Appuyez sur Entrée une fois le serveur démarré..."
    
    Write-InfoMsg "Attente du serveur (max 60 secondes)..."
    if (Wait-ForPort -Port 3000 -TimeoutSeconds 60) {
        Write-Success "Serveur Next.js détecté"
    } else {
        Write-Error "Impossible de se connecter au serveur Next.js"
        Write-InfoMsg "Veuillez vérifier que le serveur est bien démarré"
        exit 1
    }
}

# ============================================================================
# ÉTAPE 5: ENVOYER LES DONNÉES À L'API
# ============================================================================

Write-Step "Étape 5/6: Envoi des données à l'API Next.js"

try {
    Set-Location $scriptsDir
    
    Write-InfoMsg "Fichier: $JsonFile"
    Write-InfoMsg "API: http://localhost:3000/api/airbnb/sync"
    Write-Host ""
    
    python send-airbnb-data-to-api.py $JsonFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Données envoyées avec succès"
    } else {
        Write-Error "Échec de l'envoi des données"
        Write-InfoMsg "Consultez les logs ci-dessus pour plus de détails"
        exit 1
    }
} catch {
    Write-Error "Erreur lors de l'envoi: $_"
    exit 1
}

# ============================================================================
# ÉTAPE 6: VÉRIFICATION DANS SUPABASE (optionnel)
# ============================================================================

if (-not $SkipVerification) {
    Write-Step "Étape 6/6: Vérification dans Supabase"
    
    Write-InfoMsg "Pour vérifier les données importées:"
    Write-InfoMsg "1. Ouvrir Supabase SQL Editor:"
    Write-InfoMsg "   https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk/sql"
    Write-Host ""
    Write-InfoMsg "2. Exécuter le script de vérification:"
    Write-InfoMsg "   $projectDir\supabase\migrations\verify_airbnb_import.sql"
    Write-Host ""
    
    $openBrowser = Read-Host "Voulez-vous ouvrir Supabase dans le navigateur? (O/N)"
    if ($openBrowser -eq "O" -or $openBrowser -eq "o") {
        Start-Process "https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk/sql"
        Write-Success "Navigateur ouvert"
    }
    
    $openScript = Read-Host "Voulez-vous ouvrir le script de vérification? (O/N)"
    if ($openScript -eq "O" -or $openScript -eq "o") {
        code "$projectDir\supabase\migrations\verify_airbnb_import.sql"
        Write-Success "Script ouvert dans VS Code"
    }
} else {
    Write-Step "Étape 6/6: Vérification ignorée"
}

# ============================================================================
# RÉSUMÉ FINAL
# ============================================================================

Write-Header "SYNCHRONISATION TERMINÉE"

Write-Success "Toutes les étapes ont été complétées avec succès!"
Write-Host ""

Write-InfoMsg "Prochaines étapes recommandées:"
Write-Host "   1. Vérifier les données dans Supabase (voir ci-dessus)" -ForegroundColor Gray
Write-Host "   2. Mapper les lofts avec les annonces Airbnb:" -ForegroundColor Gray
Write-Host "      code $scriptsDir\MAPPING_GUIDE.md" -ForegroundColor Gray
Write-Host "   3. Résoudre les conflits éventuels (voir table airbnb_conflicts)" -ForegroundColor Gray
Write-Host ""

Write-InfoMsg "Statistiques attendues:"
Write-Host "   - Total réservations: ~5278" -ForegroundColor Gray
Write-Host "   - Upcoming: ~125" -ForegroundColor Gray
Write-Host "   - Completed: ~5153" -ForegroundColor Gray
Write-Host "   - Annonces: ~102" -ForegroundColor Gray
Write-Host ""

Write-InfoMsg "Documentation complète:"
Write-Host "   code $scriptsDir\README.md" -ForegroundColor Gray
Write-Host "   code $scriptsDir\AIRBNB_DATA_TRANSFER_GUIDE.md" -ForegroundColor Gray
Write-Host ""

Write-Header "✅ SUCCÈS"

exit 0
