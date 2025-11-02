#!/usr/bin/env pwsh

Write-Host "🧹 Clearing Next.js cache and restarting dev server..." -ForegroundColor Cyan

# Clear Next.js cache
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Cleared .next folder" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next folder not found" -ForegroundColor Yellow
}

# Clear node_modules cache
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Cleared node_modules\.cache folder" -ForegroundColor Green
} else {
    Write-Host "ℹ️  node_modules\.cache folder not found" -ForegroundColor Yellow
}

Write-Host "🎉 Cache cleared successfully!" -ForegroundColor Green
Write-Host "🚀 Starting development server..." -ForegroundColor Cyan

# Start dev server
npm run dev