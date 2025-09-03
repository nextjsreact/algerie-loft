# 🚀 Script de déploiement pour Loft Algérie (PowerShell)
# Déploie l'application sur différents environnements

param(
    [string]$Environment = "development",
    [switch]$SkipTests = $false,
    [switch]$Force = $false
)

# Configuration des couleurs
function Write-Status {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Configuration
$branch = git branch --show-current
$commitHash = git rev-parse --short HEAD
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "🚀 Déploiement Loft Algérie" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Environnement: $Environment"
Write-Host "Branche: $branch"
Write-Host "Commit: $commitHash"
Write-Host "Timestamp: $timestamp"
Write-Host ""

# Validation de l'environnement
switch ($Environment.ToLower()) {
    { $_ -in @("development", "dev") } {
        $Environment = "development"
        $vercelEnv = "preview"
    }
    { $_ -in @("staging", "test") } {
        $Environment = "staging"
        $vercelEnv = "preview"
    }
    { $_ -in @("production", "prod") } {
        $Environment = "production"
        $vercelEnv = "production"
    }
    default {
        Write-Error "Environnement invalide: $Environment"
        Write-Host "Environnements supportés: development, staging, production"
        exit 1
    }
}

# Vérification des prérequis
function Test-Prerequisites {
    Write-Status "Vérification des prérequis..."
    
    # Vérifier Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -ne 0) { throw "Node.js not found" }
        Write-Success "Node.js installé: $nodeVersion"
    } catch {
        Write-Error "Node.js n'est pas installé"
        exit 1
    }
    
    # Vérifier npm
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -ne 0) { throw "npm not found" }
        Write-Success "npm installé: $npmVersion"
    } catch {
        Write-Error "npm n'est pas installé"
        exit 1
    }
    
    # Vérifier Vercel CLI
    try {
        $vercelVersion = vercel --version 2>$null
        if ($LASTEXITCODE -ne 0) { throw "Vercel CLI not found" }
        Write-Success "Vercel CLI installé: $vercelVersion"
    } catch {
        Write-Warning "Vercel CLI n'est pas installé"
        Write-Status "Installation de Vercel CLI..."
        npm install -g vercel
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Échec de l'installation de Vercel CLI"
            exit 1
        }
    }
    
    # Vérifier Git
    try {
        $gitVersion = git --version 2>$null
        if ($LASTEXITCODE -ne 0) { throw "Git not found" }
        Write-Success "Git installé"
    } catch {
        Write-Error "Git n'est pas installé"
        exit 1
    }
}

# Vérification de l'état du repository
function Test-GitStatus {
    Write-Status "Vérification de l'état Git..."
    
    # Vérifier les modifications non commitées
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Warning "Des modifications non commitées détectées"
        git status --short
        
        if (-not $Force) {
            $continue = Read-Host "Continuer le déploiement? (y/N)"
            if ($continue -notmatch '^[Yy]$') {
                Write-Error "Déploiement annulé"
                exit 1
            }
        }
    }
    
    # Vérifier la branche pour la production
    if ($Environment -eq "production" -and $branch -ne "main") {
        Write-Error "La production ne peut être déployée que depuis la branche 'main'"
        Write-Status "Branche actuelle: $branch"
        exit 1
    }
    
    Write-Success "État Git vérifié"
}

# Installation des dépendances
function Install-Dependencies {
    Write-Status "Installation des dépendances..."
    
    if (Test-Path "package-lock.json") {
        npm ci
    } else {
        npm install
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Échec de l'installation des dépendances"
        exit 1
    }
    
    Write-Success "Dépendances installées"
}

# Exécution des tests
function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "Tests ignorés (--SkipTests)"
        return
    }
    
    Write-Status "Exécution des tests..."
    
    # Tests unitaires
    npm run test 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tests unitaires réussis"
    } else {
        Write-Error "Échec des tests unitaires"
        
        if ($Environment -eq "production" -and -not $Force) {
            exit 1
        } else {
            $continue = Read-Host "Continuer malgré l'échec des tests? (y/N)"
            if ($continue -notmatch '^[Yy]$') {
                exit 1
            }
        }
    }
    
    # Linting
    npm run lint 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Linting réussi"
    } else {
        Write-Warning "Problèmes de linting détectés"
        npm run lint
    }
}

# Build de l'application
function Build-Application {
    Write-Status "Build de l'application..."
    
    # Définir les variables d'environnement pour le build
    $env:NODE_ENV = "production"
    $env:NEXT_TELEMETRY_DISABLED = "1"
    
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Échec du build"
        exit 1
    }
    
    Write-Success "Build réussi"
}

# Déploiement sur Vercel
function Deploy-ToVercel {
    Write-Status "Déploiement sur Vercel..."
    
    # Configuration des arguments Vercel
    $vercelArgs = @("deploy", "--yes")
    
    switch ($Environment) {
        "production" {
            $vercelArgs += "--prod"
        }
        "staging" {
            $vercelArgs += "--target", "staging"
        }
        "development" {
            $vercelArgs += "--target", "preview"
        }
    }
    
    # Déploiement
    try {
        $deploymentOutput = & vercel @vercelArgs 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Vercel deployment failed"
        }
        
        # Extraire l'URL de déploiement
        $deploymentUrl = ($deploymentOutput | Select-String "https://.*\.vercel\.app" | Select-Object -Last 1).Matches.Value
        
        if ($deploymentUrl) {
            Write-Success "Déploiement réussi"
            Write-Host "URL: $deploymentUrl" -ForegroundColor Green
            
            # Sauvegarder l'URL de déploiement
            $deploymentUrl | Out-File -FilePath ".deployment-url-$Environment" -Encoding UTF8
        } else {
            throw "Could not extract deployment URL"
        }
    } catch {
        Write-Error "Échec du déploiement Vercel: $_"
        exit 1
    }
}

# Vérification post-déploiement
function Test-PostDeployment {
    Write-Status "Vérification post-déploiement..."
    
    if (Test-Path ".deployment-url-$Environment") {
        $deploymentUrl = Get-Content ".deployment-url-$Environment" -Raw
        $deploymentUrl = $deploymentUrl.Trim()
        
        # Attendre que le déploiement soit prêt
        Start-Sleep -Seconds 10
        
        # Vérifier la santé de l'application
        try {
            $healthResponse = Invoke-WebRequest -Uri "$deploymentUrl/api/health" -Method GET -TimeoutSec 30
            if ($healthResponse.StatusCode -eq 200) {
                Write-Success "Application déployée et fonctionnelle"
            } else {
                Write-Warning "L'endpoint de santé retourne: $($healthResponse.StatusCode)"
            }
        } catch {
            Write-Warning "L'endpoint de santé n'est pas accessible"
            Write-Status "Vérifiez manuellement: $deploymentUrl"
        }
        
        # Vérifier la page d'accueil
        try {
            $homeResponse = Invoke-WebRequest -Uri $deploymentUrl -Method GET -TimeoutSec 30
            if ($homeResponse.StatusCode -eq 200) {
                Write-Success "Page d'accueil accessible"
            }
        } catch {
            Write-Warning "Page d'accueil non accessible"
        }
    }
}

# Notification de déploiement
function Send-Notification {
    Write-Status "Envoi de notification..."
    
    # Créer un tag Git pour les déploiements en production
    if ($Environment -eq "production") {
        $tagName = "v$timestamp"
        git tag -a $tagName -m "Déploiement production $timestamp"
        
        try {
            git push origin $tagName 2>$null
            Write-Success "Tag créé: $tagName"
        } catch {
            Write-Warning "Impossible de pousser le tag"
        }
    }
    
    # Notification via script personnalisé si disponible
    if (Test-Path "scripts/notify-deployment.ts") {
        try {
            npm run notify:deployment-success 2>$null
        } catch {
            # Ignorer les erreurs de notification
        }
    }
}

# Nettoyage
function Invoke-Cleanup {
    Write-Status "Nettoyage..."
    
    # Supprimer les fichiers temporaires
    if (Test-Path ".deployment-url-$Environment") {
        Remove-Item ".deployment-url-$Environment" -Force -ErrorAction SilentlyContinue
    }
    
    Write-Success "Nettoyage terminé"
}

# Fonction principale
function Main {
    Write-Host "🚀 Début du déploiement..." -ForegroundColor Cyan
    Write-Host ""
    
    try {
        Test-Prerequisites
        Test-GitStatus
        Install-Dependencies
        Invoke-Tests
        Build-Application
        Deploy-ToVercel
        Test-PostDeployment
        Send-Notification
        Invoke-Cleanup
        
        Write-Host ""
        Write-Success "🎉 Déploiement terminé avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Status "Résumé:"
        Write-Host "- Environnement: $Environment"
        Write-Host "- Branche: $branch"
        Write-Host "- Commit: $commitHash"
        
        if (Test-Path ".deployment-url-$Environment") {
            $deploymentUrl = Get-Content ".deployment-url-$Environment" -Raw
            Write-Host "- URL: $($deploymentUrl.Trim())"
        }
        
        Write-Host ""
        Write-Status "Prochaines étapes:"
        Write-Host "1. Vérifiez l'application déployée"
        Write-Host "2. Testez les fonctionnalités critiques"
        Write-Host "3. Surveillez les logs pour détecter d'éventuels problèmes"
        
    } catch {
        Write-Error "Erreur lors du déploiement: $_"
        Invoke-Cleanup
        exit 1
    }
}

# Exécution du script principal
Main