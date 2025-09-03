# Script PowerShell pour résoudre automatiquement les problèmes d'upload de photos
# Usage: .\scripts\fix-photo-upload.ps1

Write-Host "🔧 Script de Résolution - Upload Photos Lofts" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Exécutez ce script depuis la racine du projet" -ForegroundColor Red
    exit 1
}

Write-Host "`n1️⃣ Vérification de l'environnement..." -ForegroundColor Yellow

# Vérifier les variables d'environnement
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Fichier .env.local non trouvé" -ForegroundColor Red
    Write-Host "Créez le fichier .env.local avec vos variables Supabase" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Fichier .env.local trouvé" -ForegroundColor Green
}

# Vérifier si Supabase CLI est installé
try {
    $supabaseVersion = supabase --version 2>$null
    if ($supabaseVersion) {
        Write-Host "✅ Supabase CLI installé: $supabaseVersion" -ForegroundColor Green
        $hasSupabaseCLI = $true
    } else {
        Write-Host "⚠️  Supabase CLI non installé" -ForegroundColor Yellow
        $hasSupabaseCLI = $false
    }
} catch {
    Write-Host "⚠️  Supabase CLI non installé" -ForegroundColor Yellow
    $hasSupabaseCLI = $false
}

Write-Host "`n2️⃣ Test de connexion à l'API..." -ForegroundColor Yellow

# Tester l'API de vérification
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/check-db" -Method GET -ErrorAction Stop
    $apiData = $response.Content | ConvertFrom-Json
    
    if ($apiData.success) {
        Write-Host "✅ API de vérification accessible" -ForegroundColor Green
        
        # Analyser les résultats
        $checks = $apiData.checks
        
        if (-not $checks.database.connected) {
            Write-Host "❌ Base de données non connectée" -ForegroundColor Red
        } else {
            Write-Host "✅ Base de données connectée" -ForegroundColor Green
        }
        
        if (-not $checks.database.loft_photos_table) {
            Write-Host "❌ Table loft_photos manquante" -ForegroundColor Red
            $needsMigration = $true
        } else {
            Write-Host "✅ Table loft_photos existe" -ForegroundColor Green
            $needsMigration = $false
        }
        
        if (-not $checks.storage.loft_photos_bucket) {
            Write-Host "❌ Bucket loft-photos manquant" -ForegroundColor Red
            $needsBucket = $true
        } else {
            Write-Host "✅ Bucket loft-photos existe" -ForegroundColor Green
            $needsBucket = $false
        }
        
    } else {
        Write-Host "❌ Erreur API: $($apiData.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Impossible de contacter l'API. Assurez-vous que le serveur Next.js fonctionne." -ForegroundColor Red
    Write-Host "Démarrez le serveur avec: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n3️⃣ Résolution des problèmes..." -ForegroundColor Yellow

# Exécuter la migration si nécessaire
if ($needsMigration) {
    Write-Host "Exécution de la migration..." -ForegroundColor Yellow
    
    if ($hasSupabaseCLI) {
        try {
            Write-Host "Tentative avec Supabase CLI..." -ForegroundColor Cyan
            supabase db push
            Write-Host "✅ Migration exécutée avec Supabase CLI" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erreur avec Supabase CLI: $_" -ForegroundColor Red
            Write-Host "Exécutez manuellement la migration dans l'interface Supabase" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Supabase CLI non disponible" -ForegroundColor Yellow
        Write-Host "Exécutez manuellement la migration:" -ForegroundColor Cyan
        Write-Host "1. Allez dans l'interface Supabase" -ForegroundColor White
        Write-Host "2. Naviguez vers SQL Editor" -ForegroundColor White
        Write-Host "3. Copiez le contenu de scripts/supabase_migrations/27-create-loft-photos-table.sql" -ForegroundColor White
        Write-Host "4. Exécutez le SQL" -ForegroundColor White
    }
}

# Instructions pour le bucket
if ($needsBucket) {
    Write-Host "`nCréation du bucket de stockage nécessaire:" -ForegroundColor Yellow
    Write-Host "1. Allez dans votre interface Supabase" -ForegroundColor White
    Write-Host "2. Naviguez vers Storage" -ForegroundColor White
    Write-Host "3. Cliquez sur 'New bucket'" -ForegroundColor White
    Write-Host "4. Nom: loft-photos" -ForegroundColor White
    Write-Host "5. Cochez 'Public bucket'" -ForegroundColor White
    Write-Host "6. Cliquez sur 'Save'" -ForegroundColor White
}

Write-Host "`n4️⃣ Test final..." -ForegroundColor Yellow

# Attendre un peu pour que les changements prennent effet
Start-Sleep -Seconds 2

# Re-tester l'API
try {
    $finalResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/check-db" -Method GET -ErrorAction Stop
    $finalData = $finalResponse.Content | ConvertFrom-Json
    
    if ($finalData.success) {
        $finalChecks = $finalData.checks
        $allGood = $finalChecks.database.connected -and 
                   $finalChecks.database.loft_photos_table -and 
                   $finalChecks.storage.accessible -and 
                   $finalChecks.storage.loft_photos_bucket
        
        if ($allGood) {
            Write-Host "🎉 Tous les tests sont passés avec succès!" -ForegroundColor Green
            Write-Host "L'upload de photos devrait maintenant fonctionner." -ForegroundColor Green
        } else {
            Write-Host "⚠️  Certains problèmes persistent:" -ForegroundColor Yellow
            foreach ($rec in $finalData.recommendations) {
                Write-Host "   $rec" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "❌ Impossible de faire le test final" -ForegroundColor Red
}

Write-Host "`n📋 Étapes suivantes:" -ForegroundColor Cyan
Write-Host "1. Allez sur http://localhost:3000/simple-test pour tester" -ForegroundColor White
Write-Host "2. Si les tests passent, essayez l'upload dans l'application" -ForegroundColor White
Write-Host "3. En cas de problème, consultez les logs de la console (F12)" -ForegroundColor White

Write-Host "`n✅ Script terminé!" -ForegroundColor Green