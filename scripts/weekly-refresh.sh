#!/bin/bash

# Weekly Environment Refresh Automation Script
# Executes comprehensive weekly refresh of all environments

echo "🔄 Weekly Environment Refresh"
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

echo "📋 Starting comprehensive weekly refresh..."
echo "⚠️  This process may take several hours"
echo

# Execute weekly refresh
npx tsx lib/environment-management/automation/weekly-refresh.ts run

if [ $? -eq 0 ]; then
    echo
    echo "✅ Weekly refresh completed successfully!"
else
    echo
    echo "❌ Weekly refresh failed!"
    echo "Check the logs above for details"
    exit 1
fi