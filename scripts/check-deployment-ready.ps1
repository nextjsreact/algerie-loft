# Script de Vérification Pré-Déploiement
# Vérifie que tout est prêt pour le déploiement

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION PRE-DEPLOIEMENT" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Vérifier Git
Write-Host "1. Verification Git..." -ForegroundColor Yellow
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "   ✅ Git installé" -ForegroundColor Green
    
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "   ⚠️  Fichiers non commités détectés" -ForegroundColor Yellow
        Write-Host "   Conseil: Commiter avant de déployer" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ Tous les fichiers sont commités" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Git non installé" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# 2. Vérifier Node.js
Write-Host "2. Verification Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js installé: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js non installé" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# 3. Vérifier les fichiers critiques
Write-Host "3. Verification fichiers critiques..." -ForegroundColor Yellow

$criticalFiles = @(
    "package.json",
    "vercel.json",
    "supabase/migrations/001_booking_sync_tables.sql",
    "supabase/migrations/002_rls_policies.sql",
    ".github/workflows/airbnb-csv-export.yml"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file manquant" -ForegroundColor Red
        $allGood = $false
    }
}
Write-Host ""

# 4. Vérifier les dépendances
Write-Host "4. Verification dépendances..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules existe" -ForegroundColor Green
    
    $packages = @("resend", "csv-parse", "playwright", "@supabase/supabase-js")
    foreach ($pkg in $packages) {
        if (Test-Path "node_modules/$pkg") {
            Write-Host "   ✅ $pkg installé" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $pkg manquant" -ForegroundColor Red
            $allGood = $false
        }
    }
} else {
    Write-Host "   ❌ node_modules manquant" -ForegroundColor Red
    Write-Host "   Conseil: Exécuter 'npm install'" -ForegroundColor Gray
    $allGood = $false
}
Write-Host ""

# 5. Vérifier les composants du système
Write-Host "5. Verification composants système..." -ForegroundColor Yellow

$components = @(
    "lib/sync/icalFetcher.ts",
    "lib/sync/batchProcessor.ts",
    "lib/sync/conflictDetector.ts",
    "lib/sync/csvParser.ts",
    "lib/sync/reservationMatcher.ts",
    "lib/repositories/bookingRepository.ts",
    "lib/services/alertService.ts",
    "scripts/airbnbExport.ts"
)

$missingComponents = 0
foreach ($component in $components) {
    if (!(Test-Path $component)) {
        Write-Host "   ❌ $component manquant" -ForegroundColor Red
        $missingComponents++
    }
}

if ($missingComponents -eq 0) {
    Write-Host "   ✅ Tous les composants présents ($($components.Count))" -ForegroundColor Green
} else {
    Write-Host "   ❌ $missingComponents composants manquants" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# 6. Vérifier les API routes
Write-Host "6. Verification API routes..." -ForegroundColor Yellow

$routes = @(
    "app/api/cron/sync-ical/route.ts",
    "app/api/sync/trigger/route.ts",
    "app/api/import/csv/route.ts",
    "app/api/settings/playwright-toggle/route.ts",
    "app/api/alerts/test/route.ts"
)

$missingRoutes = 0
foreach ($route in $routes) {
    if (!(Test-Path $route)) {
        Write-Host "   ❌ $route manquant" -ForegroundColor Red
        $missingRoutes++
    }
}

if ($missingRoutes -eq 0) {
    Write-Host "   ✅ Toutes les routes présentes ($($routes.Count))" -ForegroundColor Green
} else {
    Write-Host "   ❌ $missingRoutes routes manquantes" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# 7. Vérifier la documentation
Write-Host "7. Verification documentation..." -ForegroundColor Yellow

$docs = @(
    "docs/BOOKING_SYNC_README.md",
    ".kiro/specs/booking-sync-system/DEPLOY_NOW.md",
    ".kiro/specs/booking-sync-system/DEPLOYMENT_CHECKLIST.md"
)

$missingDocs = 0
foreach ($doc in $docs) {
    if (!(Test-Path $doc)) {
        Write-Host "   ❌ $doc manquant" -ForegroundColor Red
        $missingDocs++
    }
}

if ($missingDocs -eq 0) {
    Write-Host "   ✅ Toute la documentation présente" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  $missingDocs documents manquants" -ForegroundColor Yellow
}
Write-Host ""

# 8. Résumé
Write-Host "=========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  ✅ PRET POUR LE DEPLOIEMENT !" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "  1. Lire: .kiro/specs/booking-sync-system/DEPLOY_NOW.md" -ForegroundColor Cyan
    Write-Host "  2. Configurer Supabase (30 min)" -ForegroundColor Cyan
    Write-Host "  3. Configurer Resend (10 min)" -ForegroundColor Cyan
    Write-Host "  4. Déployer sur Vercel (20 min)" -ForegroundColor Cyan
    Write-Host "  5. Configurer GitHub Actions (15 min)" -ForegroundColor Cyan
    Write-Host "  6. Tester le système (30 min)" -ForegroundColor Cyan
} else {
    Write-Host "  ❌ PROBLEMES DETECTES" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Veuillez corriger les erreurs ci-dessus avant de déployer." -ForegroundColor Yellow
}
Write-Host ""
