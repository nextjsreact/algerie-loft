#!/bin/bash

# Daily Environment Refresh Automation Script
# Executes daily refresh of test and training environments

echo "🔄 Daily Environment Refresh"
echo "============================"
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

echo "📋 Starting daily environment refresh..."
echo

# Execute daily refresh
npx tsx lib/environment-management/automation/daily-refresh.ts run

if [ $? -eq 0 ]; then
    echo
    echo "✅ Daily refresh completed successfully!"
else
    echo
    echo "❌ Daily refresh failed!"
    echo "Check the logs above for details"
    exit 1
fi