# Script de Validation du Package de Deploiement
# Partner Dashboard Improvements

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VALIDATION DU PACKAGE DE DEPLOIEMENT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$totalTests = 0
$passedTests = 0
$failedTests = 0

function Test-FileExists {
    param($path, $description)
    
    $global:totalTests++
    if (Test-Path $path) {
        Write-Host "  OK $description" -ForegroundColor Green
        $global:passedTests++
        return $true
    } else {
        Write-Host "  ERREUR $description" -ForegroundColor Red
        Write-Host "     Fichier manquant: $path" -ForegroundColor DarkGray
        $global:failedTests++
        return $false
    }
}

# Test 1: Documentation Principale
Write-Host "Test 1: Documentation Principale" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor DarkGray

Test-FileExists ".kiro/specs/partner-dashboard-improvements/README.md" "README.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/INDEX.md" "INDEX.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/COMPLETION_SUMMARY.md" "COMPLETION_SUMMARY.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/DEPLOYMENT_READY.md" "DEPLOYMENT_READY.md"

Write-Host ""

# Test 2: Documentation de Deploiement
Write-Host "Test 2: Documentation de Deploiement" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor DarkGray

Test-FileExists ".kiro/specs/partner-dashboard-improvements/deployment-runbook.md" "deployment-runbook.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/deployment-checklist.md" "deployment-checklist.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/DEPLOYMENT_PACKAGE.md" "DEPLOYMENT_PACKAGE.md"

Write-Host ""

# Test 3: Documentation de Spec
Write-Host "Test 3: Documentation de Spec" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor DarkGray

Test-FileExists ".kiro/specs/partner-dashboard-improvements/requirements.md" "requirements.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/design.md" "design.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/tasks.md" "tasks.md"

Write-Host ""

# Test 4: Scripts d'Automatisation
Write-Host "Test 4: Scripts d'Automatisation" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor DarkGray

Test-FileExists "scripts/monitor-partner-dashboard.ts" "monitor-partner-dashboard.ts"
Test-FileExists "scripts/verify-partner-dashboard-deployment.ts" "verify-partner-dashboard-deployment.ts"
Test-FileExists "scripts/test-deployment-scripts.ts" "test-deployment-scripts.ts"

Write-Host ""

# Test 5: Scripts NPM
Write-Host "Test 5: Scripts NPM dans package.json" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor DarkGray

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
        Write-Host "  OK $script" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  ERREUR $script" -ForegroundColor Red
        $failedTests++
    }
}

Write-Host ""

# Test 6: Resultats des Tests
Write-Host "Test 6: Fichiers de Test" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor DarkGray

Test-FileExists ".kiro/specs/partner-dashboard-improvements/TEST_RESULTS.md" "TEST_RESULTS.md"
Test-FileExists ".kiro/specs/partner-dashboard-improvements/VALIDATION_GUIDE.md" "VALIDATION_GUIDE.md"

Write-Host ""

# Resume
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUME DE VALIDATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$successRate = [math]::Round(($passedTests / $totalTests) * 100, 1)

Write-Host "  Total de tests: $totalTests" -ForegroundColor White
Write-Host "  Tests reussis: " -NoNewline -ForegroundColor White
Write-Host "$passedTests" -ForegroundColor Green
Write-Host "  Tests echoues: " -NoNewline -ForegroundColor White
if ($failedTests -eq 0) {
    Write-Host "$failedTests" -ForegroundColor Green
} else {
    Write-Host "$failedTests" -ForegroundColor Red
}
Write-Host "  Taux de reussite: " -NoNewline -ForegroundColor White
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
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  VALIDATION REUSSIE!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    Write-Host "Le package de deploiement est complet et pret!`n" -ForegroundColor Green
    Write-Host "Prochaines etapes:" -ForegroundColor Yellow
    Write-Host "  1. Lire: .kiro/specs/partner-dashboard-improvements/INDEX.md" -ForegroundColor White
    Write-Host "  2. Suivre: deployment-checklist.md" -ForegroundColor White
    Write-Host "  3. Utiliser: npm run monitor:partner-dashboard:staging`n" -ForegroundColor White
} elseif ($successRate -ge 80) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  VALIDATION AVEC AVERTISSEMENTS" -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Yellow
    Write-Host "Quelques elements manquent mais le package est OK`n" -ForegroundColor Yellow
    Write-Host "Verifiez les elements marques ERREUR ci-dessus`n" -ForegroundColor Yellow
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  VALIDATION ECHOUEE" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Host "Des elements importants sont manquants`n" -ForegroundColor Red
    Write-Host "Veuillez corriger les elements marques ERREUR ci-dessus`n" -ForegroundColor Red
}

# Retourner le code de sortie approprie
if ($failedTests -eq 0) {
    exit 0
} else {
    exit 1
}
