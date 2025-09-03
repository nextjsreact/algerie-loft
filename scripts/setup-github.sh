#!/bin/bash

# 🚀 Script de configuration GitHub pour Loft Algérie
# Ce script configure automatiquement le repository GitHub avec les secrets nécessaires

set -e

echo "🚀 Configuration GitHub pour Loft Algérie"
echo "========================================"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si gh CLI est installé
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) n'est pas installé"
    print_status "Installez-le depuis: https://cli.github.com/"
    exit 1
fi

# Vérifier l'authentification GitHub
if ! gh auth status &> /dev/null; then
    print_error "Vous n'êtes pas authentifié avec GitHub CLI"
    print_status "Exécutez: gh auth login"
    exit 1
fi

print_success "GitHub CLI configuré et authentifié"

# Obtenir le nom du repository
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
REPO_OWNER=$(gh repo view --json owner --jq '.owner.login' 2>/dev/null || echo "")

if [ -z "$REPO_OWNER" ]; then
    print_error "Impossible de déterminer le propriétaire du repository"
    print_status "Assurez-vous d'être dans un repository GitHub"
    exit 1
fi

REPO_FULL_NAME="${REPO_OWNER}/${REPO_NAME}"
print_status "Repository: ${REPO_FULL_NAME}"

# Configuration des secrets GitHub
print_status "Configuration des secrets GitHub..."

# Fonction pour définir un secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local is_required=${3:-true}
    
    echo ""
    print_status "Configuration: ${secret_name}"
    echo "Description: ${secret_description}"
    
    if [ "$is_required" = true ]; then
        read -p "Entrez la valeur pour ${secret_name}: " -s secret_value
        echo ""
        
        if [ -z "$secret_value" ]; then
            print_warning "Valeur vide pour ${secret_name}, ignoré"
            return
        fi
        
        if gh secret set "$secret_name" --body "$secret_value" --repo "$REPO_FULL_NAME"; then
            print_success "${secret_name} configuré"
        else
            print_error "Erreur lors de la configuration de ${secret_name}"
        fi
    else
        read -p "Entrez la valeur pour ${secret_name} (optionnel): " -s secret_value
        echo ""
        
        if [ -n "$secret_value" ]; then
            if gh secret set "$secret_name" --body "$secret_value" --repo "$REPO_FULL_NAME"; then
                print_success "${secret_name} configuré"
            else
                print_error "Erreur lors de la configuration de ${secret_name}"
            fi
        else
            print_warning "${secret_name} ignoré (optionnel)"
        fi
    fi
}

# Configuration des secrets essentiels
echo ""
print_status "=== SECRETS VERCEL (Requis pour le déploiement) ==="

set_secret "VERCEL_TOKEN" "Token d'API Vercel (https://vercel.com/account/tokens)"
set_secret "VERCEL_ORG_ID" "ID de l'organisation Vercel"
set_secret "VERCEL_PROJECT_ID" "ID du projet Vercel"

echo ""
print_status "=== SECRETS SUPABASE (Requis pour la base de données) ==="

set_secret "NEXT_PUBLIC_SUPABASE_URL" "URL publique Supabase"
set_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Clé anonyme publique Supabase"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "Clé de rôle de service Supabase"

echo ""
print_status "=== SECRETS OPTIONNELS ==="

set_secret "CODECOV_TOKEN" "Token Codecov pour les rapports de couverture" false
set_secret "SNYK_TOKEN" "Token Snyk pour l'analyse de sécurité" false
set_secret "GEMINI_API_KEY" "Clé API Google Gemini pour l'IA" false

# Configuration des variables d'environnement
echo ""
print_status "=== VARIABLES D'ENVIRONNEMENT ==="

set_variable() {
    local var_name=$1
    local var_value=$2
    local var_description=$3
    
    print_status "Configuration de la variable: ${var_name}"
    echo "Description: ${var_description}"
    echo "Valeur: ${var_value}"
    
    if gh variable set "$var_name" --body "$var_value" --repo "$REPO_FULL_NAME"; then
        print_success "${var_name} configuré"
    else
        print_error "Erreur lors de la configuration de ${var_name}"
    fi
}

set_variable "NODE_VERSION" "18" "Version de Node.js à utiliser"
set_variable "ENVIRONMENT" "production" "Environnement par défaut"

# Configuration des environnements GitHub
echo ""
print_status "=== ENVIRONNEMENTS GITHUB ==="

create_environment() {
    local env_name=$1
    local env_description=$2
    
    print_status "Création de l'environnement: ${env_name}"
    
    # Note: La création d'environnements via CLI n'est pas directement supportée
    # Il faut les créer manuellement dans l'interface GitHub
    print_warning "Créez manuellement l'environnement '${env_name}' dans:"
    echo "https://github.com/${REPO_FULL_NAME}/settings/environments"
    echo "Description: ${env_description}"
}

create_environment "development" "Environnement de développement"
create_environment "production" "Environnement de production"

# Configuration des branches protégées
echo ""
print_status "=== PROTECTION DES BRANCHES ==="

protect_branch() {
    local branch_name=$1
    
    print_status "Protection de la branche: ${branch_name}"
    
    # Vérifier si la branche existe
    if git show-ref --verify --quiet "refs/heads/${branch_name}" || git show-ref --verify --quiet "refs/remotes/origin/${branch_name}"; then
        # Configuration de la protection (nécessite des permissions admin)
        if gh api "repos/${REPO_FULL_NAME}/branches/${branch_name}/protection" \
            --method PUT \
            --field required_status_checks='{"strict":true,"contexts":["test","build"]}' \
            --field enforce_admins=true \
            --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
            --field restrictions=null 2>/dev/null; then
            print_success "Branche ${branch_name} protégée"
        else
            print_warning "Impossible de protéger ${branch_name} (permissions insuffisantes)"
        fi
    else
        print_warning "Branche ${branch_name} n'existe pas encore"
    fi
}

protect_branch "main"
protect_branch "develop"

# Configuration des labels
echo ""
print_status "=== LABELS GITHUB ==="

create_label() {
    local label_name=$1
    local label_color=$2
    local label_description=$3
    
    if gh label create "$label_name" --color "$label_color" --description "$label_description" --repo "$REPO_FULL_NAME" 2>/dev/null; then
        print_success "Label '${label_name}' créé"
    else
        print_warning "Label '${label_name}' existe déjà ou erreur"
    fi
}

create_label "🐛 bug" "d73a4a" "Quelque chose ne fonctionne pas"
create_label "✨ enhancement" "a2eeef" "Nouvelle fonctionnalité ou amélioration"
create_label "📚 documentation" "0075ca" "Améliorations de la documentation"
create_label "🔧 maintenance" "fbca04" "Maintenance et refactoring"
create_label "🚀 deployment" "0e8a16" "Lié au déploiement"
create_label "🔒 security" "b60205" "Problème de sécurité"
create_label "⚡ performance" "ff9500" "Amélioration des performances"
create_label "🧪 testing" "c5def5" "Tests et qualité"

# Résumé final
echo ""
print_success "=== CONFIGURATION TERMINÉE ==="
echo ""
print_status "Repository configuré: ${REPO_FULL_NAME}"
print_status "Workflows GitHub Actions: .github/workflows/"
print_status "Configuration Vercel: vercel.json"
print_status "Configuration des tests: jest.config.js, playwright.config.ts"
echo ""
print_warning "ACTIONS MANUELLES REQUISES:"
echo "1. Créez les environnements dans GitHub:"
echo "   https://github.com/${REPO_FULL_NAME}/settings/environments"
echo ""
echo "2. Configurez Vercel:"
echo "   - Connectez votre repository à Vercel"
echo "   - Configurez les variables d'environnement dans Vercel"
echo ""
echo "3. Configurez Supabase:"
echo "   - Créez votre projet Supabase"
echo "   - Configurez les tables et RLS policies"
echo ""
print_success "Votre projet est maintenant prêt pour le CI/CD! 🎉"