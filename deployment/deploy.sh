#!/bin/bash
# =====================================================
# PRODUCTION DEPLOYMENT AUTOMATION SCRIPT
# =====================================================
# Automated deployment script for production environment
# Requirements: 10.1, 10.2
# =====================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ENV="${1:-production}"
FORCE_REBUILD="${2:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if environment file exists
    if [[ ! -f "$PROJECT_ROOT/.env.$DEPLOYMENT_ENV" ]]; then
        error "Environment file .env.$DEPLOYMENT_ENV not found. Please create it from .env.production.template"
    fi
    
    # Check if SSL certificates exist (for production)
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        if [[ ! -f "$SCRIPT_DIR/ssl/fullchain.pem" || ! -f "$SCRIPT_DIR/ssl/privkey.pem" ]]; then
            warn "SSL certificates not found. Run ssl-setup.sh first or use self-signed certificates for testing."
        fi
    fi
    
    info "Prerequisites check completed"
}

# Validate environment configuration
validate_environment() {
    log "Validating environment configuration..."
    
    # Source environment file
    set -a
    source "$PROJECT_ROOT/.env.$DEPLOYMENT_ENV"
    set +a
    
    # Check critical environment variables
    local required_vars=(
        "DATABASE_URL"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "NEXTAUTH_SECRET"
        "JWT_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    # Validate database connection
    info "Testing database connection..."
    if ! docker run --rm --env-file "$PROJECT_ROOT/.env.$DEPLOYMENT_ENV" postgres:15-alpine \
         psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        warn "Database connection test failed. Please verify DATABASE_URL"
    else
        info "Database connection successful"
    fi
    
    info "Environment validation completed"
}

# Build application
build_application() {
    log "Building application for $DEPLOYMENT_ENV environment..."
    
    cd "$PROJECT_ROOT"
    
    # Build Docker image
    if [[ "$FORCE_REBUILD" == "true" ]]; then
        info "Force rebuilding Docker image..."
        docker-compose -f "$SCRIPT_DIR/production-deployment.yml" build --no-cache
    else
        docker-compose -f "$SCRIPT_DIR/production-deployment.yml" build
    fi
    
    info "Application build completed"
}

# Deploy database schema
deploy_database() {
    log "Deploying database schema..."
    
    # Check if database schema needs to be deployed
    if docker run --rm --env-file "$PROJECT_ROOT/.env.$DEPLOYMENT_ENV" postgres:15-alpine \
       psql "$DATABASE_URL" -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations';" | grep -q "1"; then
        info "Database schema already exists, skipping deployment"
    else
        info "Deploying production database schema..."
        
        # Deploy schema
        docker run --rm --env-file "$PROJECT_ROOT/.env.$DEPLOYMENT_ENV" -v "$PROJECT_ROOT/database:/sql" postgres:15-alpine \
            psql "$DATABASE_URL" -f /sql/production-schema-deployment.sql
        
        # Deploy backup strategy
        docker run --rm --env-file "$PROJECT_ROOT/.env.$DEPLOYMENT_ENV" -v "$PROJECT_ROOT/database:/sql" postgres:15-alpine \
            psql "$DATABASE_URL" -f /sql/production-backup-strategy.sql
        
        # Deploy monitoring setup
        docker run --rm --env-file "$PROJECT_ROOT/.env.$DEPLOYMENT_ENV" -v "$PROJECT_ROOT/database:/sql" postgres:15-alpine \
            psql "$DATABASE_URL" -f /sql/production-monitoring-setup.sql
        
        info "Database schema deployment completed"
    fi
}

# Start services
start_services() {
    log "Starting production services..."
    
    cd "$PROJECT_ROOT"
    
    # Copy environment file
    cp ".env.$DEPLOYMENT_ENV" ".env.production"
    
    # Start services
    docker-compose -f "$SCRIPT_DIR/production-deployment.yml" up -d
    
    # Wait for services to be healthy
    info "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$SCRIPT_DIR/production-deployment.yml" ps | grep -q "healthy"; then
            break
        fi
        
        info "Attempt $attempt/$max_attempts - Waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        error "Services failed to become healthy within timeout"
    fi
    
    info "All services are running and healthy"
}

# Run health checks
run_health_checks() {
    log "Running post-deployment health checks..."
    
    # Check application health
    local app_url="http://localhost:3000"
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        app_url="https://localhost"
    fi
    
    info "Checking application health endpoint..."
    if curl -f -s "$app_url/api/health" > /dev/null; then
        info "Application health check passed"
    else
        error "Application health check failed"
    fi
    
    # Check database connectivity
    info "Checking database connectivity..."
    if docker-compose -f "$SCRIPT_DIR/production-deployment.yml" exec -T app \
       node -e "
       const { createClient } = require('@supabase/supabase-js');
       const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
       client.from('lofts').select('count').limit(1).then(() => console.log('OK')).catch(console.error);
       " | grep -q "OK"; then
        info "Database connectivity check passed"
    else
        warn "Database connectivity check failed"
    fi
    
    # Check Redis connectivity (if enabled)
    if docker-compose -f "$SCRIPT_DIR/production-deployment.yml" ps redis | grep -q "Up"; then
        info "Checking Redis connectivity..."
        if docker-compose -f "$SCRIPT_DIR/production-deployment.yml" exec -T redis redis-cli ping | grep -q "PONG"; then
            info "Redis connectivity check passed"
        else
            warn "Redis connectivity check failed"
        fi
    fi
    
    info "Health checks completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring and alerting..."
    
    # Create monitoring directories
    mkdir -p "$PROJECT_ROOT/monitoring/grafana/dashboards"
    mkdir -p "$PROJECT_ROOT/monitoring/prometheus"
    
    # Copy monitoring configurations
    if [[ -d "$SCRIPT_DIR/monitoring" ]]; then
        cp -r "$SCRIPT_DIR/monitoring/"* "$PROJECT_ROOT/monitoring/"
    fi
    
    # Start monitoring services
    info "Starting monitoring services..."
    docker-compose -f "$SCRIPT_DIR/production-deployment.yml" up -d prometheus grafana loki promtail
    
    info "Monitoring setup completed"
    info "Grafana dashboard available at: http://localhost:3001"
}

# Create backup
create_initial_backup() {
    log "Creating initial backup..."
    
    # Create backup directory
    mkdir -p "$PROJECT_ROOT/backups"
    
    # Create database backup
    local backup_file="$PROJECT_ROOT/backups/initial-backup-$(date +%Y%m%d-%H%M%S).sql"
    
    docker run --rm --env-file "$PROJECT_ROOT/.env.$DEPLOYMENT_ENV" -v "$PROJECT_ROOT/backups:/backups" postgres:15-alpine \
        pg_dump "$DATABASE_URL" > "$backup_file"
    
    info "Initial backup created: $backup_file"
}

# Display deployment summary
show_deployment_summary() {
    log "Deployment Summary"
    echo "===================="
    echo "Environment: $DEPLOYMENT_ENV"
    echo "Deployment Time: $(date)"
    echo "Services Status:"
    
    docker-compose -f "$SCRIPT_DIR/production-deployment.yml" ps
    
    echo
    echo "Application URLs:"
    echo "- Main Application: https://localhost (or your configured domain)"
    echo "- Health Check: https://localhost/api/health"
    echo "- Grafana Dashboard: http://localhost:3001"
    
    echo
    echo "Useful Commands:"
    echo "- View logs: docker-compose -f $SCRIPT_DIR/production-deployment.yml logs -f"
    echo "- Stop services: docker-compose -f $SCRIPT_DIR/production-deployment.yml down"
    echo "- Restart services: docker-compose -f $SCRIPT_DIR/production-deployment.yml restart"
    echo "- Scale app: docker-compose -f $SCRIPT_DIR/production-deployment.yml up -d --scale app=3"
    
    echo
    log "Deployment completed successfully! 🚀"
}

# Rollback function
rollback_deployment() {
    warn "Rolling back deployment..."
    
    # Stop current services
    docker-compose -f "$SCRIPT_DIR/production-deployment.yml" down
    
    # Remove current images
    docker-compose -f "$SCRIPT_DIR/production-deployment.yml" down --rmi all
    
    warn "Rollback completed. Please investigate the issues and redeploy."
}

# Cleanup function
cleanup() {
    if [[ $? -ne 0 ]]; then
        error "Deployment failed. Check the logs above for details."
        
        read -p "Do you want to rollback? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback_deployment
        fi
    fi
}

# Help function
show_help() {
    echo "Usage: $0 [ENVIRONMENT] [FORCE_REBUILD]"
    echo
    echo "Arguments:"
    echo "  ENVIRONMENT     Deployment environment (default: production)"
    echo "  FORCE_REBUILD   Force rebuild of Docker images (default: false)"
    echo
    echo "Examples:"
    echo "  $0                          # Deploy to production"
    echo "  $0 production true          # Deploy to production with force rebuild"
    echo "  $0 staging                  # Deploy to staging"
    echo
    echo "Prerequisites:"
    echo "  - Docker and Docker Compose installed"
    echo "  - Environment file (.env.production) configured"
    echo "  - SSL certificates configured (for production)"
    echo "  - Database accessible"
}

# Main execution
main() {
    log "Starting deployment to $DEPLOYMENT_ENV environment..."
    
    # Set up error handling
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    build_application
    deploy_database
    start_services
    run_health_checks
    setup_monitoring
    create_initial_backup
    show_deployment_summary
    
    # Remove error trap on successful completion
    trap - EXIT
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"