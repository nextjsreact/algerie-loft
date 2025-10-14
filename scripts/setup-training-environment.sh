#!/bin/bash

# Training Environment Setup Automation Script
# Creates a complete training environment with sample data and users

echo "🎓 Training Environment Setup"
echo "=============================="
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

echo "📋 Creating training environment..."
echo "⚠️  This will create a new training environment with:"
echo "   • Sample data (lofts, reservations, transactions)"
echo "   • Training user accounts"
echo "   • Training scenarios"
echo "   • Documentation"
echo

read -p "Continue? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Operation cancelled"
    exit 0
fi

echo
echo "🚀 Starting training environment setup..."

# Execute training environment setup
npx tsx lib/environment-management/automation/training-environment-setup.ts

if [ $? -eq 0 ]; then
    echo
    echo "✅ Training environment setup completed successfully!"
    echo "📚 Check the generated training guide for user accounts and instructions"
else
    echo
    echo "❌ Training environment setup failed!"
    echo "Check the logs above for details"
    exit 1
fi