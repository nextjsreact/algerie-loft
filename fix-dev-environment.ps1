#!/usr/bin/env powershell
# Fix Development Environment - Complete Solution
# Addresses npm installation issues and gets dev server running

Write-Host "=== FIXING DEVELOPMENT ENVIRONMENT ===" -ForegroundColor Green
Write-Host ""

# Step 1: Clean existing problematic installations
Write-Host "Step 1: Cleaning existing installations..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

if (Test-Path ".next") {
    Write-Host "Removing .next cache..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

if (Test-Path "package-lock.json") {
    Write-Host "Removing package-lock.json..." -ForegroundColor Cyan
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}

# Step 2: Try multiple installation methods
Write-Host ""
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow

# Method 1: npm with specific flags
Write-Host "Trying npm install with Windows-friendly flags..." -ForegroundColor Cyan
$npmResult = Start-Process -FilePath "npm" -ArgumentList "install", "--legacy-peer-deps", "--no-optional", "--force" -Wait -PassThru -NoNewWindow

if ($npmResult.ExitCode -eq 0) {
    Write-Host "✅ npm install successful!" -ForegroundColor Green
} else {
    Write-Host "❌ npm install failed, trying yarn..." -ForegroundColor Red
    
    # Method 2: Try yarn
    $yarnResult = Start-Process -FilePath "yarn" -ArgumentList "install" -Wait -PassThru -NoNewWindow -ErrorAction SilentlyContinue
    
    if ($yarnResult.ExitCode -eq 0) {
        Write-Host "✅ yarn install successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ yarn failed, trying pnpm..." -ForegroundColor Red
        
        # Method 3: Try pnpm
        $pnpmResult = Start-Process -FilePath "pnpm" -ArgumentList "install" -Wait -PassThru -NoNewWindow -ErrorAction SilentlyContinue
        
        if ($pnpmResult.ExitCode -eq 0) {
            Write-Host "✅ pnpm install successful!" -ForegroundColor Green
        } else {
            Write-Host "❌ All package managers failed. Trying direct Next.js installation..." -ForegroundColor Red
            
            # Method 4: Direct Next.js installation
            npm install next@15.5.9 react@18 react-dom@18 --force --no-optional
        }
    }
}

# Step 3: Verify Next.js installation
Write-Host ""
Write-Host "Step 3: Verifying Next.js installation..." -ForegroundColor Yellow

if (Test-Path "node_modules\next\dist\bin\next") {
    Write-Host "✅ Next.js binary found!" -ForegroundColor Green
    
    # Step 4: Test development server
    Write-Host ""
    Write-Host "Step 4: Testing development server..." -ForegroundColor Yellow
    Write-Host "Starting Next.js development server..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    
    # Start the dev server
    & "node_modules\.bin\next" dev --port 3000
    
} else {
    Write-Host "❌ Next.js binary not found. Trying alternative startup..." -ForegroundColor Red
    
    # Alternative: Use npx
    Write-Host "Trying npx next dev..." -ForegroundColor Cyan
    npx next@15.5.9 dev --port 3000
}

Write-Host ""
Write-Host "=== DEVELOPMENT ENVIRONMENT FIX COMPLETE ===" -ForegroundColor Green