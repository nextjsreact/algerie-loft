# Script de Validation du Package de Déploiement
# Partner Dashboard Improvements

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║     VALIDATION DU PACKAGE DE DÉPLOIEMENT - DASHBOARD          ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$totalTests = 0
$passedTests = 0
$failedTests = 0

function Test-FileExists {
    param($path, $description)
    
    $global:totalTests++
    if (Test-Path $path) {
        Write-Host "  ✅ $description" -ForegroundColor Green
        $global:passedTests++
        return $true
    } else {
        Write-Host "  ❌ $description" -ForegroundColor Red
        Write-Host "     Fichier manquant: $path" -ForegroundColor DarkGray
        $global:failedTests++
        return $false
    }
}

# Test 1: Documentation Principale
Write-Host "📚 Test 1: Documentation Principale" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Test-FileExists ".kiro/specs/partner-dashboard-improvements/README.md" "README.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/INDEX.md" "INDEX.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/COMPLETION_SUMMARY.md" "COMPLETION_SUMMARY.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/DEPLOYMENT_READY.md" "DEPLOYMENT_READY.md"

Write-Host ""

# Test 2: Documentation de Déploiement
Write-Host "📋 Test 2: Documentation de Déploiement" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Test-FileExists ".kiro/specs/partner-dashboard-improvements/deployment-runbook.md" "deployment-runbook.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/deployment-checklist.md" "deployment-checklist.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/DEPLOYMENT_PACKAGE.md" "DEPLOYMENT_PACKAGE.md"

Write-Host ""

# Test 3: Documentation de Spec
Write-Host "📝 Test 3: Documentation de Spec" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Test-FileExists ".kiro/specs/partner-dashboard-improvements/requirements.md" "requirements.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/design.md" "design.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/tasks.md" "tasks.md"

Write-Host ""

# Test 4: Scripts d'Automatisation
Write-Host "🛠️  Test 4: Scripts d'Automatisation" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Test-FileExists "scripts/monitor-partner-dashboard.ts" "monitor-partner-dashboard.ts"
Test-FileExists "scripts/verify-partner-dashboard-deployment.ts" "verify-partner-dashboard-deployment.ts"
Test-FileExists "scripts/test-deployment-scripts.ts" "test-deployment-scripts.ts"

Write-Host ""

# Test 5: Scripts NPM
Write-Host "📦 Test 5: Scripts NPM dans package.json" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$requiredScripts = @(
    "deploy:partner-dashboard:staging",
    "deploy:partner-dashboard:prod",
    "monitor:partner-dashboard",
    "monitor:partner-dashboard:staging",
    "monitor:partner-dashboard:prod",
    "verify:partner-dashboard",
    "verify:partner-dashboard:staging",
    "verify:partner-dashboard:prod"
)

foreach ($script in $requiredScripts) {
    $totalTests++
    if ($packageJson.scripts.PSObject.Properties.Name -contains $script) {
        Write-Host "  ✅ $script" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  ❌ $script" -ForegroundColor Red
        $failedTests++
    }
}

Write-Host ""

# Test 6: Résultats des Tests
Write-Host "🧪 Test 6: Fichiers de Test" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Test-FileExists ".kiro/specs/partner-dashboard-improvements/TEST_RESULTS.md" "TEST_RESULTS.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/VALIDATION_GUIDE.md" "VALIDATION_GUIDE.md"

Write-Host ""

# Test 7: Exécution du Script de Test
Write-Host "🚀 Test 7: Exécution du Script de Test" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$totalTests++
try {
    $output = tsx scripts/test-deployment-scripts.ts 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Script de test exécuté avec succès" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  ❌ Script de test a échoué" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ❌ Erreur lors de l'exécution du script de test" -ForegroundColor Red
    Write-Host "     $($_.Exception.Message)" -ForegroundColor DarkGray
    $failedTests++
}

Write-Host ""

# Résumé
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                      RÉSUMÉ DE VALIDATION                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$successRate = [math]::Round(($passedTests / $totalTests) * 100, 1)

Write-Host "  Total de tests: " -NoNewline -ForegroundColor White
Write-Host "$totalTests" -ForegroundColor Cyan

Write-Host "  Tests réussis: " -NoNewline -ForegroundColor White
Write-Host "$passedTests" -ForegroundColor Green

Write-Host "  Tests échoués: " -NoNewline -ForegroundColor White
if ($failedTests -eq 0) {
    Write-Host "$failedTests" -ForegroundColor Green
} else {
    Write-Host "$failedTests" -ForegroundColor Red
}

Write-Host "  Taux de réussite: " -NoNewline -ForegroundColor White
if ($successRate -eq 100) {
    Write-Host "$successRate%" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "$successRate%" -ForegroundColor Yellow
} else {
    Write-Host "$successRate%" -ForegroundColor Red
}

Write-Host ""

# Verdict Final
if ($failedTests -eq 0) {
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                                ║" -ForegroundColor Green
    Write-Host "║                  ✅ VALIDATION RÉUSSIE ✅                      ║" -ForegroundColor Green
    Write-Host "║                                                                ║" -ForegroundColor Green
    Write-Host "║         Le package de déploiement est complet et prêt!         ║" -ForegroundColor Green
    Write-Host "║                                                                ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "  1. Lire: .kiro/specs/partner-dashboard-improvements/INDEX.md" -ForegroundColor White
    Write-Host "  2. Suivre: deployment-checklist.md pour le déploiement" -ForegroundColor White
    Write-Host "  3. Utiliser: npm run monitor:partner-dashboard:staging" -ForegroundColor White
    Write-Host ""
} elseif ($successRate -ge 80) {
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║                                                                ║" -ForegroundColor Yellow
    Write-Host "║              ⚠️  VALIDATION AVEC AVERTISSEMENTS ⚠️             ║" -ForegroundColor Yellow
    Write-Host "║                                                                ║" -ForegroundColor Yellow
    Write-Host "║      Quelques éléments manquent mais le package est OK         ║" -ForegroundColor Yellow
    Write-Host "║                                                                ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  Vérifiez les éléments marqués ❌ ci-dessus" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                                                                ║" -ForegroundColor Red
    Write-Host "║                   ❌ VALIDATION ÉCHOUÉE ❌                     ║" -ForegroundColor Red
    Write-Host "║                                                                ║" -ForegroundColor Red
    Write-Host "║         Des éléments importants sont manquants                 ║" -ForegroundColor Red
    Write-Host "║                                                                ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "❌ Veuillez corriger les éléments marqués ❌ ci-dessus" -ForegroundColor Red
    Write-Host ""
}

# Retourner le code de sortie approprié
if ($failedTests -eq 0) {
    exit 0
} else {
    exit 1
}
