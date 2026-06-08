# Script pour démarrer le serveur Next.js en DEV
# Usage: .\start-dev.ps1

Write-Host "🚀 Démarrage du serveur Next.js..." -ForegroundColor Cyan
Write-Host ""

# Aller dans le dossier du projet
Set-Location $PSScriptRoot

# Démarrer Next.js directement
.\node_modules\.bin\next.cmd dev
