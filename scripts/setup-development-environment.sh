#!/bin/bash

# Development Environment Quick Setup Script
# Creates a fast development environment for coding

echo "⚡ Development Environment Quick Setup"
echo "====================================="
echo

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js and try again"
    exit 1
fi

# Check if tsx is available
if ! npx tsx --version &> /dev/null; then
    echo "❌ tsx is not available"
    echo "Installing tsx..."
    npm install -g tsx
fi

echo "📋 Choose setup mode:"
echo "1. Default - Standard development setup with sample data"
echo "2. Minimal - Fastest setup with minimal data"
echo "3. Custom  - Use custom configuration file"
echo

read -p "Enter choice (1-3): " mode

case $mode in
    1)
        setup_mode="default"
        ;;
    2)
        setup_mode="minimal"
        ;;
    3)
        setup_mode="custom"
        read -p "Enter config file path: " config_path
        ;;
    *)
        echo "Invalid choice. Using default mode."
        setup_mode="default"
        ;;
esac

echo
echo "🚀 Starting development environment setup in $setup_mode mode..."

# Execute development environment setup
if [ "$setup_mode" = "custom" ]; then
    npx tsx lib/environment-management/automation/development-environment-setup.ts "$setup_mode" "$config_path"
else
    npx tsx lib/environment-management/automation/development-environment-setup.ts "$setup_mode"
fi

if [ $? -eq 0 ]; then
    echo
    echo "✅ Development environment setup completed successfully!"
    echo "🚀 You can now start developing with: npm run dev"
else
    echo
    echo "❌ Development environment setup failed!"
    echo "Check the logs above for details"
    exit 1
fi