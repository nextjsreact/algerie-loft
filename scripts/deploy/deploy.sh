#!/bin/bash

# Multi-Role Booking System Deployment Script
# This script handles the complete deployment process

set -e

echo "🚀 Starting Multi-Role Booking System Deployment..."

# Check if required environment variables are set
check_env_vars() {
    echo "📋 Checking environment variables..."
    
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ Error: $var is not set"
            exit 1
        fi
    done
    
    echo "✅ All required environment variables are set"
}

# Run database migrations
run_migrations() {
    echo "🗄️ Running database migrations..."
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        echo "❌ Error: psql is not installed"
        exit 1
    fi
    
    # Run migration script
    psql "$DATABASE_URL" -f scripts/deploy/migrate-database.sql
    
    echo "✅ Database migrations completed"
}

# Build the application
build_app() {
    echo "🔨 Building application..."
    
    # Install dependencies
    npm ci --production=false
    
    # Run build
    npm run build
    
    echo "✅ Application build completed"
}

# Run tests
run_tests() {
    echo "🧪 Running tests..."
    
    # Run unit tests
    npm run test -- --run
    
    echo "✅ Tests completed"
}

# Deploy to production
deploy_production() {
    echo "🌐 Deploying to production..."
    
    # This would typically involve your deployment platform
    # For Vercel:
    # vercel --prod
    
    # For other platforms, add appropriate deployment commands
    echo "✅ Production deployment initiated"
}

# Main deployment flow
main() {
    echo "Starting deployment process..."
    
    check_env_vars
    run_migrations
    build_app
    run_tests
    deploy_production
    
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📝 Post-deployment checklist:"
    echo "  - Verify all services are running"
    echo "  - Test user registration flows"
    echo "  - Check booking system functionality"
    echo "  - Monitor error logs"
    echo "  - Validate payment processing"
}

# Run main function
main "$@"