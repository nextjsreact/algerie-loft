#!/bin/bash
# =====================================================
# SSL CERTIFICATE SETUP SCRIPT
# =====================================================
# Automated SSL certificate generation and renewal
# Requirements: 10.1, 10.2
# =====================================================

set -e

# Configuration
DOMAIN="${1:-your-domain.com}"
EMAIL="${2:-admin@your-domain.com}"
SSL_DIR="/etc/nginx/ssl"
CERTBOT_DIR="/etc/letsencrypt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Install certbot if not present
install_certbot() {
    log "Checking for certbot installation..."
    
    if ! command -v certbot &> /dev/null; then
        log "Installing certbot..."
        
        # Detect OS and install accordingly
        if [[ -f /etc/debian_version ]]; then
            apt-get update
            apt-get install -y certbot python3-certbot-nginx
        elif [[ -f /etc/redhat-release ]]; then
            yum install -y epel-release
            yum install -y certbot python3-certbot-nginx
        else
            error "Unsupported operating system"
        fi
    else
        log "Certbot is already installed"
    fi
}

# Create SSL directory
create_ssl_directory() {
    log "Creating SSL directory..."
    mkdir -p "$SSL_DIR"
    chmod 700 "$SSL_DIR"
}

# Generate self-signed certificate for testing
generate_self_signed() {
    log "Generating self-signed certificate for testing..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/privkey.pem" \
        -out "$SSL_DIR/fullchain.pem" \
        -subj "/C=DZ/ST=Algiers/L=Algiers/O=Loft Algerie/OU=IT Department/CN=$DOMAIN"
    
    chmod 600 "$SSL_DIR/privkey.pem"
    chmod 644 "$SSL_DIR/fullchain.pem"
    
    log "Self-signed certificate generated successfully"
}

# Obtain Let's Encrypt certificate
obtain_letsencrypt_cert() {
    log "Obtaining Let's Encrypt certificate for $DOMAIN..."
    
    # Stop nginx temporarily
    systemctl stop nginx 2>/dev/null || docker-compose stop nginx 2>/dev/null || true
    
    # Obtain certificate
    certbot certonly \
        --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN,www.$DOMAIN" \
        --non-interactive
    
    # Copy certificates to nginx directory
    cp "$CERTBOT_DIR/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
    cp "$CERTBOT_DIR/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
    
    # Set proper permissions
    chmod 600 "$SSL_DIR/privkey.pem"
    chmod 644 "$SSL_DIR/fullchain.pem"
    
    log "Let's Encrypt certificate obtained successfully"
}

# Setup certificate renewal
setup_renewal() {
    log "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /usr/local/bin/renew-ssl.sh << 'EOF'
#!/bin/bash
# SSL Certificate Renewal Script

DOMAIN="$1"
SSL_DIR="/etc/nginx/ssl"
CERTBOT_DIR="/etc/letsencrypt"

# Renew certificate
certbot renew --quiet --no-self-upgrade

# Copy renewed certificates
if [[ -f "$CERTBOT_DIR/live/$DOMAIN/fullchain.pem" ]]; then
    cp "$CERTBOT_DIR/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
    cp "$CERTBOT_DIR/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
    
    # Reload nginx
    systemctl reload nginx 2>/dev/null || docker-compose exec nginx nginx -s reload 2>/dev/null || true
    
    echo "Certificate renewed successfully"
fi
EOF

    chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add cron job for automatic renewal
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/renew-ssl.sh $DOMAIN") | crontab -
    
    log "Automatic renewal configured"
}

# Validate SSL configuration
validate_ssl() {
    log "Validating SSL configuration..."
    
    if [[ -f "$SSL_DIR/fullchain.pem" && -f "$SSL_DIR/privkey.pem" ]]; then
        # Check certificate validity
        openssl x509 -in "$SSL_DIR/fullchain.pem" -text -noout > /dev/null
        
        # Check private key
        openssl rsa -in "$SSL_DIR/privkey.pem" -check -noout > /dev/null
        
        # Check if certificate and key match
        cert_hash=$(openssl x509 -noout -modulus -in "$SSL_DIR/fullchain.pem" | openssl md5)
        key_hash=$(openssl rsa -noout -modulus -in "$SSL_DIR/privkey.pem" | openssl md5)
        
        if [[ "$cert_hash" == "$key_hash" ]]; then
            log "SSL certificate validation successful"
        else
            error "Certificate and private key do not match"
        fi
    else
        error "SSL certificate files not found"
    fi
}

# Generate DH parameters for enhanced security
generate_dhparam() {
    log "Generating DH parameters (this may take a while)..."
    
    if [[ ! -f "$SSL_DIR/dhparam.pem" ]]; then
        openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048
        chmod 644 "$SSL_DIR/dhparam.pem"
        log "DH parameters generated successfully"
    else
        log "DH parameters already exist"
    fi
}

# Create security configuration
create_security_config() {
    log "Creating security configuration..."
    
    cat > "$SSL_DIR/security.conf" << 'EOF'
# Security headers
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';" always;

# Hide server information
server_tokens off;
more_clear_headers Server;
EOF

    log "Security configuration created"
}

# Main execution
main() {
    log "Starting SSL setup for domain: $DOMAIN"
    
    check_root
    create_ssl_directory
    
    # Ask user for certificate type
    echo
    echo "Choose certificate type:"
    echo "1) Let's Encrypt (production - requires valid domain)"
    echo "2) Self-signed (development/testing)"
    read -p "Enter choice (1 or 2): " cert_choice
    
    case $cert_choice in
        1)
            install_certbot
            obtain_letsencrypt_cert
            setup_renewal
            ;;
        2)
            generate_self_signed
            ;;
        *)
            error "Invalid choice"
            ;;
    esac
    
    generate_dhparam
    create_security_config
    validate_ssl
    
    log "SSL setup completed successfully!"
    log "Certificate files are located in: $SSL_DIR"
    
    if [[ $cert_choice == 1 ]]; then
        log "Automatic renewal is configured to run daily at 3 AM"
    fi
    
    echo
    echo "Next steps:"
    echo "1. Update your nginx configuration to use the SSL certificates"
    echo "2. Test your SSL configuration with: nginx -t"
    echo "3. Reload nginx: systemctl reload nginx"
    echo "4. Test SSL with: curl -I https://$DOMAIN"
}

# Help function
show_help() {
    echo "Usage: $0 [DOMAIN] [EMAIL]"
    echo
    echo "Arguments:"
    echo "  DOMAIN    Domain name for SSL certificate (default: your-domain.com)"
    echo "  EMAIL     Email for Let's Encrypt notifications (default: admin@your-domain.com)"
    echo
    echo "Examples:"
    echo "  $0 example.com admin@example.com"
    echo "  $0 loftalgerie.com contact@loftalgerie.com"
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"