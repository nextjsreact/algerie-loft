# ============================================================================
# SCRIPT : Obtenir la liste de tous les lofts
# ============================================================================
# Ce script récupère tous les noms de lofts depuis la base de données
# ============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "           LISTE DE TOUS LES LOFTS DISPONIBLES" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Charger les variables d'environnement
$envFile = ".env.development"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Erreur: Variables d'environnement manquantes" -ForegroundColor Red
    Write-Host "   Vérifiez que .env.development contient:" -ForegroundColor Yellow
    Write-Host "   - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Yellow
    Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔍 Récupération des lofts depuis Supabase..." -ForegroundColor Yellow
Write-Host ""

try {
    # Récupérer tous les lofts
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type" = "application/json"
    }
    
    $url = "$supabaseUrl/rest/v1/lofts?select=id,name,airbnb_listing_id&order=name.asc"
    
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    
    Write-Host "✅ $($response.Count) lofts trouvés" -ForegroundColor Green
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Afficher les lofts
    $numero = 1
    foreach ($loft in $response) {
        $status = if ($loft.airbnb_listing_id) { "✅ Mappé ($($loft.airbnb_listing_id))" } else { "❌ Non mappé" }
        Write-Host "$numero. $($loft.name)" -ForegroundColor White
        Write-Host "   UUID: $($loft.id)" -ForegroundColor Gray
        Write-Host "   Status: $status" -ForegroundColor $(if ($loft.airbnb_listing_id) { "Green" } else { "Red" })
        Write-Host ""
        $numero++
    }
    
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Statistiques
    $mapped = ($response | Where-Object { $_.airbnb_listing_id }).Count
    $unmapped = $response.Count - $mapped
    
    Write-Host "📊 STATISTIQUES" -ForegroundColor Cyan
    Write-Host "   Total: $($response.Count) lofts" -ForegroundColor White
    Write-Host "   Mappés: $mapped lofts" -ForegroundColor Green
    Write-Host "   Non mappés: $unmapped lofts" -ForegroundColor Red
    Write-Host ""
    
    # Exporter vers un fichier CSV
    $csvPath = "lofts-list.csv"
    $response | Select-Object @{Name='Numero';Expression={$script:num++}}, name, id, airbnb_listing_id | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
    
    Write-Host "💾 Liste exportée vers: $csvPath" -ForegroundColor Green
    Write-Host ""
    
    # Générer le template de mapping
    Write-Host "📝 TEMPLATE DE MAPPING" -ForegroundColor Cyan
    Write-Host "   Copiez ces lignes dans apply_airbnb_mapping.sql:" -ForegroundColor Yellow
    Write-Host ""
    
    $unmappedLofts = $response | Where-Object { -not $_.airbnb_listing_id }
    foreach ($loft in $unmappedLofts) {
        Write-Host "UPDATE lofts SET airbnb_listing_id = 'LISTING_ID_ICI' WHERE id = '$($loft.id)'; -- $($loft.name)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erreur lors de la récupération des lofts" -ForegroundColor Red
    Write-Host "   Message: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
