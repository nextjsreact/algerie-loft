# Script de test pour l'API Airbnb Sync (PowerShell)
# Usage: .\scripts\test-airbnb-api.ps1 -Environment local|production

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("local", "production")]
    [string]$Environment = "local"
)

# Configuration
if ($Environment -eq "local") {
    $ApiUrl = "http://localhost:3000"
    Write-Host "🧪 Testing LOCAL API: $ApiUrl" -ForegroundColor Cyan
} else {
    $ApiUrl = "https://votreapp.vercel.app"
    Write-Host "🧪 Testing PRODUCTION API: $ApiUrl" -ForegroundColor Cyan
}

# Lire l'API Key depuis .env.local
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^AIRBNB_API_SECRET=(.+)$") {
            $ApiKey = $matches[1]
        }
    }
}

if (-not $ApiKey) {
    Write-Host "❌ AIRBNB_API_SECRET not found in .env.local" -ForegroundColor Red
    Write-Host "Please add: AIRBNB_API_SECRET=your-api-key" -ForegroundColor Yellow
    exit 1
}

$ApiKeyPreview = $ApiKey.Substring(0, [Math]::Min(10, $ApiKey.Length))
Write-Host "🔑 Using API Key: $ApiKeyPreview..." -ForegroundColor Green

# Test 1: Vérifier que l'endpoint existe
Write-Host ""
Write-Host "📋 Test 1: Check endpoint availability" -ForegroundColor Yellow
Write-Host "----------------------------------------"
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/airbnb/sync" -Method GET -ErrorAction SilentlyContinue
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 405) {
        Write-Host "✅ Endpoint exists (405 Method Not Allowed for GET)" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected response: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Test 2: Tester sans authentification
Write-Host ""
Write-Host "📋 Test 2: Test without authentication" -ForegroundColor Yellow
Write-Host "----------------------------------------"
$body = @{
    reservations = @()
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/airbnb/sync" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    $errorResponse | ConvertTo-Json -Depth 10 | Write-Host
    if ($errorResponse.error -match "Missing or invalid Authorization header") {
        Write-Host "✅ Authentication required (as expected)" -ForegroundColor Green
    } else {
        Write-Host "❌ Authentication should be required" -ForegroundColor Red
    }
}

# Test 3: Tester avec une API Key invalide
Write-Host ""
Write-Host "📋 Test 3: Test with invalid API key" -ForegroundColor Yellow
Write-Host "----------------------------------------"
$headers = @{
    "Authorization" = "Bearer invalid-key"
}

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/airbnb/sync" -Method POST -Body $body -ContentType "application/json" -Headers $headers -ErrorAction Stop
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    $errorResponse | ConvertTo-Json -Depth 10 | Write-Host
    if ($errorResponse.error -match "Invalid API key") {
        Write-Host "✅ Invalid API key rejected (as expected)" -ForegroundColor Green
    } else {
        Write-Host "❌ Invalid API key should be rejected" -ForegroundColor Red
    }
}

# Test 4: Tester avec un payload invalide
Write-Host ""
Write-Host "📋 Test 4: Test with invalid payload" -ForegroundColor Yellow
Write-Host "----------------------------------------"
$invalidBody = @{
    invalid = "payload"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $ApiKey"
}

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/airbnb/sync" -Method POST -Body $invalidBody -ContentType "application/json" -Headers $headers -ErrorAction Stop
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    $errorResponse | ConvertTo-Json -Depth 10 | Write-Host
    if ($errorResponse.error -match "Validation failed") {
        Write-Host "✅ Invalid payload rejected (as expected)" -ForegroundColor Green
    } else {
        Write-Host "❌ Invalid payload should be rejected" -ForegroundColor Red
    }
}

# Test 5: Tester avec une réservation valide (listing_id non mappé)
Write-Host ""
Write-Host "📋 Test 5: Test with valid reservation (unmapped listing_id)" -ForegroundColor Yellow
Write-Host "----------------------------------------"
$validBody = @{
    reservations = @(
        @{
            id = "HMTEST123"
            listing_id = "99999999"
            statut = "Confirmée"
            voyageur = "Test User"
            nb_voyageurs = 2
            date_arrivee = "2026-06-01"
            date_depart = "2026-06-05"
            nb_nuits = 4
            montant_total = 40000.00
            devise = "DZD"
            base_price = 35000.00
            cleaning_fee = 3000.00
            service_fee = 1500.00
            taxes = 500.00
            guest_email = "test@example.com"
            guest_phone = "+213555123456"
        }
    )
    sync_metadata = @{
        sync_type = "manual"
        timestamp = "2026-05-18T10:00:00Z"
        script_version = "2.0.0"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/airbnb/sync" -Method POST -Body $validBody -ContentType "application/json" -Headers $headers -ErrorAction Stop
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($response.warnings -and ($response.warnings | Where-Object { $_.warning -match "not mapped" })) {
        Write-Host "✅ Unmapped listing_id detected (as expected)" -ForegroundColor Green
        Write-Host "ℹ️  To fix: Add airbnb_listing_id to lofts table" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Check response above" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        $_.ErrorDetails.Message | Write-Host
    }
}

# Test 6: Vérifier les logs dans Supabase
Write-Host ""
Write-Host "📋 Test 6: Check sync logs in Supabase" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Write-Host "ℹ️  Run this SQL query in Supabase:" -ForegroundColor Cyan
Write-Host ""
Write-Host "SELECT sync_batch_id, sync_type, status, reservations_received, reservations_created, reservations_skipped" -ForegroundColor White
Write-Host "FROM airbnb_sync_logs" -ForegroundColor White
Write-Host "ORDER BY started_at DESC" -ForegroundColor White
Write-Host "LIMIT 5;" -ForegroundColor White
Write-Host ""

# Résumé
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎉 Tests completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check Supabase logs (airbnb_sync_logs table)"
Write-Host "2. Add airbnb_listing_id to lofts table"
Write-Host "3. Re-run test with mapped listing_id"
Write-Host ""
