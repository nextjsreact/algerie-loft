# ============================================================================
# Script de test pour l'endpoint POST /api/airbnb/sync
# ============================================================================
# Ce script teste l'intégration Airbnb en envoyant une réservation de test

# Configuration
$API_URL = "http://localhost:3000/api/airbnb/sync"
$API_KEY = "NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s="

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Test de l'endpoint Airbnb Sync API" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Payload de test
$payload = @{
    reservations = @(
        @{
            id = "HMTEST$(Get-Random -Minimum 1000 -Maximum 9999)"
            listing_id = "12345678"
            statut = "Confirmée"
            voyageur = "John Doe (TEST)"
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
            guest_email = "john.doe.test@example.com"
            guest_phone = "+213555123456"
            guest_nationality = "FR"
            special_requests = "Test de l'intégration Airbnb"
        }
    )
    sync_metadata = @{
        sync_type = "manual"
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        script_version = "2.0.0-test"
    }
} | ConvertTo-Json -Depth 10

Write-Host "Payload:" -ForegroundColor Yellow
Write-Host $payload -ForegroundColor Gray
Write-Host ""

# Envoyer la requête
Write-Host "Envoi de la requête à $API_URL..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $API_URL `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $API_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $payload `
        -ErrorAction Stop

    Write-Host ""
    Write-Host "✓ Succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Réponse:" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    Write-Host ""
    
    # Afficher les métriques
    Write-Host "Métriques:" -ForegroundColor Cyan
    Write-Host "  - Processed: $($response.metrics.processed)" -ForegroundColor White
    Write-Host "  - Created: $($response.metrics.created)" -ForegroundColor Green
    Write-Host "  - Updated: $($response.metrics.updated)" -ForegroundColor Yellow
    Write-Host "  - Skipped: $($response.metrics.skipped)" -ForegroundColor Gray
    Write-Host "  - Failed: $($response.metrics.failed)" -ForegroundColor Red
    Write-Host "  - Conflicts: $($response.metrics.conflicts)" -ForegroundColor Magenta
    Write-Host ""
    
    # Afficher les erreurs
    if ($response.errors.Count -gt 0) {
        Write-Host "Erreurs:" -ForegroundColor Red
        foreach ($error in $response.errors) {
            Write-Host "  - [$($error.reservation_id)] $($error.error)" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    # Afficher les avertissements
    if ($response.warnings.Count -gt 0) {
        Write-Host "Avertissements:" -ForegroundColor Yellow
        foreach ($warning in $response.warnings) {
            Write-Host "  - [$($warning.reservation_id)] $($warning.warning)" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    Write-Host "Sync Batch ID: $($response.sync_batch_id)" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "✗ Erreur!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Détails:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Test terminé" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
