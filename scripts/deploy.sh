#!/bin/bash

# 🚀 Script de déploiement pour Loft Algérie
# Déploie l'application sur différents environnements

set -e

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

# Configuration
ENVIRONMENT=${1:-"development"}
BRANCH=$(git branch --show-current)
COMMIT_HASH=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

print_status "🚀 Déploiement Loft Algérie"
echo "================================"
echo "Environnement: $ENVIRONMENT"
echo "Branche: $BRANCH"
echo "Commit: $COMMIT_HASH"
echo "Timestamp: $TIMESTAMP"
echo ""

# Validation de l'environnement
case $ENVIRONMENT in
    "development"|"dev")
        ENVIRONMENT="development"
        VERCEL_ENV="preview"
        ;;
    "staging"|"test")
        ENVIRONMENT="staging"
        VERCEL_ENV="preview"
        ;;
    "production"|"prod")
        ENVIRONMENT="production"
        VERCEL_ENV="production"
        ;;
    *)
        print_error "Environnement invalide: $ENVIRONMENT"
        echo "Environnements supportés: development, staging, production"
        exit 1
        ;;
esac

# Vérification des prérequis
check_prerequisites() {
    print_status "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        print_error "npm n'est pas installé"
        exit 1
    fi
    
    # Vérifier Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI n'est pas installé"
        print_status "Installation de Vercel CLI..."
        npm install -g vercel
    fi
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        print_error "Git n'est pas installé"
        exit 1
    fi
    
    print_success "Prérequis vérifiés"
}

# Vérification de l'état du repository
check_git_status() {
    print_status "Vérification de l'état Git..."
    
    # Vérifier les modifications non commitées
    if [[ -n $(git status --porcelain) ]]; then
        print_warning "Des modifications non commitées détectées"
        git status --short
        
        read -p "Continuer le déploiement? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Déploiement annulé"
            exit 1
        fi
    fi
    
    # Vérifier la branche pour la production
    if [[ $ENVIRONMENT == "production" && $BRANCH != "main" ]]; then
        print_error "La production ne peut être déployée que depuis la branche 'main'"
        print_status "Branche actuelle: $BRANCH"
        exit 1
    fi
    
    print_success "État Git vérifié"
}

# Installation des dépendances
install_dependencies() {
    print_status "Installation des dépendances..."
    
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dépendances installées"
}

# Exécution des tests
run_tests() {
    print_status "Exécution des tests..."
    
    # Tests unitaires
    if npm run test > /dev/null 2>&1; then
        print_success "Tests unitaires réussis"
    else
        print_error "Échec des tests unitaires"
        
        if [[ $ENVIRONMENT == "production" ]]; then
            exit 1
        else
            read -p "Continuer malgré l'échec des tests? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
    
    # Linting
    if npm run lint > /dev/null 2>&1; then
        print_success "Linting réussi"
    else
        print_warning "Problèmes de linting détectés"
        npm run lint || true
    fi
}

# Build de l'application
build_application() {
    print_status "Build de l'application..."
    
    # Définir les variables d'environnement pour le build
    export NODE_ENV="production"
    export NEXT_TELEMETRY_DISABLED=1
    
    if npm run build; then
        print_success "Build réussi"
    else
        print_error "Échec du build"
        exit 1
    fi
}

# Déploiement sur Vercel
deploy_to_vercel() {
    print_status "Déploiement sur Vercel..."
    
    # Configuration des arguments Vercel
    VERCEL_ARGS=""
    
    case $ENVIRONMENT in
        "production")
            VERCEL_ARGS="--prod"
            ;;
        "staging")
            VERCEL_ARGS="--target staging"
            ;;
        "development")
            VERCEL_ARGS="--target preview"
            ;;
    esac
    
    # Déploiement
    if DEPLOYMENT_URL=$(vercel deploy $VERCEL_ARGS --yes 2>/dev/null | tail -n 1); then
        print_success "Déploiement réussi"
        echo "URL: $DEPLOYMENT_URL"
        
        # Sauvegarder l'URL de déploiement
        echo "$DEPLOYMENT_URL" > ".deployment-url-${ENVIRONMENT}"
        
    else
        print_error "Échec du déploiement Vercel"
        exit 1
    fi
}

# Vérification post-déploiement
post_deployment_check() {
    print_status "Vérification post-déploiement..."
    
    if [[ -f ".deployment-url-${ENVIRONMENT}" ]]; then
        DEPLOYMENT_URL=$(cat ".deployment-url-${ENVIRONMENT}")
        
        # Attendre que le déploiement soit prêt
        sleep 10
        
        # Vérifier la santé de l'application
        if curl -f -s "$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
            print_success "Application déployée et fonctionnelle"
        else
            print_warning "L'endpoint de santé n'est pas accessible"
            print_status "Vérifiez manuellement: $DEPLOYMENT_URL"
        fi
        
        # Vérifier la page d'accueil
        if curl -f -s "$DEPLOYMENT_URL" > /dev/null 2>&1; then
            print_success "Page d'accueil accessible"
        else
            print_warning "Page d'accueil non accessible"
        fi
    fi
}

# Notification de déploiement
send_notification() {
    print_status "Envoi de notification..."
    
    # Créer un tag Git pour les déploiements en production
    if [[ $ENVIRONMENT == "production" ]]; then
        TAG_NAME="v${TIMESTAMP}"
        git tag -a "$TAG_NAME" -m "Déploiement production $TIMESTAMP"
        
        if git push origin "$TAG_NAME" 2>/dev/null; then
            print_success "Tag créé: $TAG_NAME"
        else
            print_warning "Impossible de pousser le tag"
        fi
    fi
    
    # Notification via script personnalisé si disponible
    if [[ -f "scripts/notify-deployment.ts" ]]; then
        npm run notify:deployment-success 2>/dev/null || true
    fi
}

# Nettoyage
cleanup() {
    print_status "Nettoyage..."
    
    # Supprimer les fichiers temporaires
    rm -f ".deployment-url-${ENVIRONMENT}" 2>/dev/null || true
    
    print_success "Nettoyage terminé"
}

# Fonction principale
main() {
    echo "🚀 Début du déploiement..."
    echo ""
    
    check_prerequisites
    check_git_status
    install_dependencies
    run_tests
    build_application
    deploy_to_vercel
    post_deployment_check
    send_notification
    cleanup
    
    echo ""
    print_success "🎉 Déploiement terminé avec succès!"
    echo ""
    print_status "Résumé:"
    echo "- Environnement: $ENVIRONMENT"
    echo "- Branche: $BRANCH"
    echo "- Commit: $COMMIT_HASH"
    
    if [[ -f ".deployment-url-${ENVIRONMENT}" ]]; then
        DEPLOYMENT_URL=$(cat ".deployment-url-${ENVIRONMENT}")
        echo "- URL: $DEPLOYMENT_URL"
    fi
    
    echo ""
    print_status "Prochaines étapes:"
    echo "1. Vérifiez l'application déployée"
    echo "2. Testez les fonctionnalités critiques"
    echo "3. Surveillez les logs pour détecter d'éventuels problèmes"
}

# Gestion des erreurs
trap 'print_error "Erreur lors du déploiement"; cleanup; exit 1' ERR

# Exécution du script principal
main "$@"