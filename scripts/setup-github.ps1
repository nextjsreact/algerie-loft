# 🚀 Script de configuration GitHub pour Loft Algérie (PowerShell)
# Ce script configure automatiquement le repository GitHub avec les secrets nécessaires

param(
    [switch]$Force = $false
)

# Configuration des couleurs
$Host.UI.RawUI.ForegroundColor = "White"

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

Write-Host "🚀 Configuration GitHub pour Loft Algérie" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si gh CLI est installé
try {
    $ghVersion = gh --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "GitHub CLI not found"
    }
    Write-Success "GitHub CLI installé"
} catch {
    Write-Error "GitHub CLI (gh) n'est pas installé"
    Write-Status "Installez-le depuis: https://cli.github.com/"
    Write-Status "Ou via winget: winget install GitHub.cli"
    exit 1
}

# Vérifier l'authentification GitHub
try {
    gh auth status 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Not authenticated"
    }
    Write-Success "GitHub CLI configuré et authentifié"
} catch {
    Write-Error "Vous n'êtes pas authentifié avec GitHub CLI"
    Write-Status "Exécutez: gh auth login"
    exit 1
}

# Obtenir le nom du repository
try {
    $repoInfo = gh repo view --json owner,name | ConvertFrom-Json
    $repoOwner = $repoInfo.owner.login
    $repoName = $repoInfo.name
    $repoFullName = "$repoOwner/$repoName"
    
    Write-Status "Repository: $repoFullName"
} catch {
    Write-Error "Impossible de déterminer les informations du repository"
    Write-Status "Assurez-vous d'être dans un repository GitHub"
    exit 1
}

# Fonction pour définir un secret
function Set-GitHubSecret {
    param(
        [string]$SecretName,
        [string]$Description,
        [bool]$IsRequired = $true
    )
    
    Write-Host ""
    Write-Status "Configuration: $SecretName"
    Write-Host "Description: $Description" -ForegroundColor Gray
    
    if ($IsRequired) {
        $secretValue = Read-Host "Entrez la valeur pour $SecretName" -AsSecureString
        $secretValuePlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretValue))
        
        if ([string]::IsNullOrEmpty($secretValuePlain)) {
            Write-Warning "Valeur vide pour $SecretName, ignoré"
            return
        }
        
        try {
            $secretValuePlain | gh secret set $SecretName --repo $repoFullName
            Write-Success "$SecretName configuré"
        } catch {
            Write-Error "Erreur lors de la configuration de $SecretName"
        }
    } else {
        $secretValue = Read-Host "Entrez la valeur pour $SecretName (optionnel)" -AsSecureString
        $secretValuePlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretValue))
        
        if (-not [string]::IsNullOrEmpty($secretValuePlain)) {
            try {
                $secretValuePlain | gh secret set $SecretName --repo $repoFullName
                Write-Success "$SecretName configuré"
            } catch {
                Write-Error "Erreur lors de la configuration de $SecretName"
            }
        } else {
            Write-Warning "$SecretName ignoré (optionnel)"
        }
    }
}

# Configuration des secrets essentiels
Write-Host ""
Write-Status "=== SECRETS VERCEL (Requis pour le déploiement) ===" -ForegroundColor Magenta

Set-GitHubSecret "VERCEL_TOKEN" "Token d'API Vercel (https://vercel.com/account/tokens)"
Set-GitHubSecret "VERCEL_ORG_ID" "ID de l'organisation Vercel"
Set-GitHubSecret "VERCEL_PROJECT_ID" "ID du projet Vercel"

Write-Host ""
Write-Status "=== SECRETS SUPABASE (Requis pour la base de données) ===" -ForegroundColor Magenta

Set-GitHubSecret "NEXT_PUBLIC_SUPABASE_URL" "URL publique Supabase"
Set-GitHubSecret "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Clé anonyme publique Supabase"
Set-GitHubSecret "SUPABASE_SERVICE_ROLE_KEY" "Clé de rôle de service Supabase"

Write-Host ""
Write-Status "=== SECRETS OPTIONNELS ===" -ForegroundColor Magenta

Set-GitHubSecret "CODECOV_TOKEN" "Token Codecov pour les rapports de couverture" $false
Set-GitHubSecret "SNYK_TOKEN" "Token Snyk pour l'analyse de sécurité" $false
Set-GitHubSecret "GEMINI_API_KEY" "Clé API Google Gemini pour l'IA" $false

# Configuration des variables d'environnement
Write-Host ""
Write-Status "=== VARIABLES D'ENVIRONNEMENT ===" -ForegroundColor Magenta

function Set-GitHubVariable {
    param(
        [string]$VarName,
        [string]$VarValue,
        [string]$Description
    )
    
    Write-Status "Configuration de la variable: $VarName"
    Write-Host "Description: $Description" -ForegroundColor Gray
    Write-Host "Valeur: $VarValue" -ForegroundColor Gray
    
    try {
        $VarValue | gh variable set $VarName --repo $repoFullName
        Write-Success "$VarName configuré"
    } catch {
        Write-Error "Erreur lors de la configuration de $VarName"
    }
}

Set-GitHubVariable "NODE_VERSION" "18" "Version de Node.js à utiliser"
Set-GitHubVariable "ENVIRONMENT" "production" "Environnement par défaut"

# Configuration des labels
Write-Host ""
Write-Status "=== LABELS GITHUB ===" -ForegroundColor Magenta

function Create-GitHubLabel {
    param(
        [string]$LabelName,
        [string]$LabelColor,
        [string]$Description
    )
    
    try {
        gh label create $LabelName --color $LabelColor --description $Description --repo $repoFullName 2>$null
        Write-Success "Label '$LabelName' créé"
    } catch {
        Write-Warning "Label '$LabelName' existe déjà ou erreur"
    }
}

Create-GitHubLabel "🐛 bug" "d73a4a" "Quelque chose ne fonctionne pas"
Create-GitHubLabel "✨ enhancement" "a2eeef" "Nouvelle fonctionnalité ou amélioration"
Create-GitHubLabel "📚 documentation" "0075ca" "Améliorations de la documentation"
Create-GitHubLabel "🔧 maintenance" "fbca04" "Maintenance et refactoring"
Create-GitHubLabel "🚀 deployment" "0e8a16" "Lié au déploiement"
Create-GitHubLabel "🔒 security" "b60205" "Problème de sécurité"
Create-GitHubLabel "⚡ performance" "ff9500" "Amélioration des performances"
Create-GitHubLabel "🧪 testing" "c5def5" "Tests et qualité"

# Résumé final
Write-Host ""
Write-Success "=== CONFIGURATION TERMINÉE ===" -ForegroundColor Green
Write-Host ""
Write-Status "Repository configuré: $repoFullName"
Write-Status "Workflows GitHub Actions: .github/workflows/"
Write-Status "Configuration Vercel: vercel.json"
Write-Status "Configuration des tests: jest.config.js, playwright.config.ts"
Write-Host ""
Write-Warning "ACTIONS MANUELLES REQUISES:" -ForegroundColor Yellow
Write-Host "1. Créez les environnements dans GitHub:"
Write-Host "   https://github.com/$repoFullName/settings/environments"
Write-Host ""
Write-Host "2. Configurez Vercel:"
Write-Host "   - Connectez votre repository à Vercel"
Write-Host "   - Configurez les variables d'environnement dans Vercel"
Write-Host ""
Write-Host "3. Configurez Supabase:"
Write-Host "   - Créez votre projet Supabase"
Write-Host "   - Configurez les tables et RLS policies"
Write-Host ""
Write-Success "Votre projet est maintenant prêt pour le CI/CD! 🎉" -ForegroundColor Green