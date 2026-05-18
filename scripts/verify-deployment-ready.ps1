# Script de vérification - Déploiement v2.0.1
# Vérifie que toutes les corrections sont en place

Write-Host "🔍 Vérification de la configuration Node.js 20..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# 1. Vérifier .nvmrc
Write-Host "1️⃣ Vérification de .nvmrc..." -ForegroundColor Yellow
if (Test-Path ".nvmrc") {
    $nvmrcContent = Get-Content ".nvmrc" -Raw
    if ($nvmrcContent -match "20") {
        Write-Host "   ✅ .nvmrc contient Node 20" -ForegroundColor Green
    } else {
        $errors += ".nvmrc ne contient pas Node 20"
        Write-Host "   ❌ .nvmrc ne contient pas Node 20" -ForegroundColor Red
    }
} else {
    $errors += ".nvmrc n'existe pas"
    Write-Host "   ❌ .nvmrc n'existe pas" -ForegroundColor Red
}

# 2. Vérifier package.json
Write-Host "2️⃣ Vérification de package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw
    if ($packageJson -match '"node":\s*">=20\.9\.0"') {
        Write-Host "   ✅ package.json contient engines.node >= 20.9.0" -ForegroundColor Green
    } else {
        $errors += "package.json ne contient pas engines.node >= 20.9.0"
        Write-Host "   ❌ package.json ne contient pas engines.node >= 20.9.0" -ForegroundColor Red
    }
} else {
    $errors += "package.json n'existe pas"
    Write-Host "   ❌ package.json n'existe pas" -ForegroundColor Red
}

# 3. Vérifier ci-cd.yml
Write-Host "3️⃣ Vérification de .github/workflows/ci-cd.yml..." -ForegroundColor Yellow
if (Test-Path ".github/workflows/ci-cd.yml") {
    $cicdContent = Get-Content ".github/workflows/ci-cd.yml" -Raw
    if ($cicdContent -match "NODE_VERSION:\s*'20'") {
        Write-Host "   ✅ ci-cd.yml contient NODE_VERSION: '20'" -ForegroundColor Green
    } else {
        $errors += "ci-cd.yml ne contient pas NODE_VERSION: '20'"
        Write-Host "   ❌ ci-cd.yml ne contient pas NODE_VERSION: '20'" -ForegroundColor Red
    }
} else {
    $errors += ".github/workflows/ci-cd.yml n'existe pas"
    Write-Host "   ❌ .github/workflows/ci-cd.yml n'existe pas" -ForegroundColor Red
}

# 4. Vérifier test-e2e.yml
Write-Host "4️⃣ Vérification de .github/workflows/test-e2e.yml..." -ForegroundColor Yellow
if (Test-Path ".github/workflows/test-e2e.yml") {
    $e2eContent = Get-Content ".github/workflows/test-e2e.yml" -Raw
    $nodeVersionMatches = ([regex]::Matches($e2eContent, "node-version:\s*'20'")).Count
    if ($nodeVersionMatches -ge 1) {
        Write-Host "   ✅ test-e2e.yml contient node-version: '20' ($nodeVersionMatches occurrence(s))" -ForegroundColor Green
    } else {
        $errors += "test-e2e.yml ne contient pas node-version: '20'"
        Write-Host "   ❌ test-e2e.yml ne contient pas node-version: '20'" -ForegroundColor Red
    }
} else {
    $errors += ".github/workflows/test-e2e.yml n'existe pas"
    Write-Host "   ❌ .github/workflows/test-e2e.yml n'existe pas" -ForegroundColor Red
}

# 5. Vérifier bill-notifications.ts
Write-Host "5️⃣ Vérification de app/actions/bill-notifications.ts..." -ForegroundColor Yellow
if (Test-Path "app/actions/bill-notifications.ts") {
    $billNotifContent = Get-Content "app/actions/bill-notifications.ts" -Raw
    if ($billNotifContent -match "category:\s*utilityType") {
        Write-Host "   ✅ bill-notifications.ts utilise 'category: utilityType'" -ForegroundColor Green
    } else {
        $errors += "bill-notifications.ts n'utilise pas 'category: utilityType'"
        Write-Host "   ❌ bill-notifications.ts n'utilise pas 'category: utilityType'" -ForegroundColor Red
    }
    
    if ($billNotifContent -match "REBUILD v2\.0\.1") {
        Write-Host "   ✅ bill-notifications.ts contient le marker REBUILD v2.0.1" -ForegroundColor Green
    } else {
        $warnings += "bill-notifications.ts ne contient pas le marker REBUILD v2.0.1"
        Write-Host "   ⚠️  bill-notifications.ts ne contient pas le marker REBUILD v2.0.1" -ForegroundColor Yellow
    }
} else {
    $errors += "app/actions/bill-notifications.ts n'existe pas"
    Write-Host "   ❌ app/actions/bill-notifications.ts n'existe pas" -ForegroundColor Red
}

# 6. Vérifier bill-payment-form.tsx
Write-Host "6️⃣ Vérification de components/forms/bill-payment-form.tsx..." -ForegroundColor Yellow
if (Test-Path "components/forms/bill-payment-form.tsx") {
    $formContent = Get-Content "components/forms/bill-payment-form.tsx" -Raw
    if ($formContent -match "CLIENT v2\.0\.1") {
        Write-Host "   ✅ bill-payment-form.tsx contient les logs CLIENT v2.0.1" -ForegroundColor Green
    } else {
        $warnings += "bill-payment-form.tsx ne contient pas les logs CLIENT v2.0.1"
        Write-Host "   ⚠️  bill-payment-form.tsx ne contient pas les logs CLIENT v2.0.1" -ForegroundColor Yellow
    }
} else {
    $errors += "components/forms/bill-payment-form.tsx n'existe pas"
    Write-Host "   ❌ components/forms/bill-payment-form.tsx n'existe pas" -ForegroundColor Red
}

# 7. Vérifier l'état Git
Write-Host "7️⃣ Vérification de l'état Git..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    $warnings += "Il y a des fichiers non commités"
    Write-Host "   ⚠️  Il y a des fichiers non commités" -ForegroundColor Yellow
    Write-Host "   Fichiers:" -ForegroundColor Gray
    $gitStatus | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
} else {
    Write-Host "   ✅ Aucun fichier non commité" -ForegroundColor Green
}

# 8. Vérifier que le commit a été poussé
Write-Host "8️⃣ Vérification du push vers GitHub..." -ForegroundColor Yellow
$gitLog = git log --oneline -1
$gitRemote = git log origin/main --oneline -1 2>$null
if ($gitLog -eq $gitRemote) {
    Write-Host "   ✅ Le dernier commit a été poussé vers GitHub" -ForegroundColor Green
    Write-Host "   Commit: $gitLog" -ForegroundColor Gray
} else {
    $warnings += "Le dernier commit n'a pas été poussé vers GitHub"
    Write-Host "   ⚠️  Le dernier commit n'a pas été poussé vers GitHub" -ForegroundColor Yellow
    Write-Host "   Local:  $gitLog" -ForegroundColor Gray
    Write-Host "   Remote: $gitRemote" -ForegroundColor Gray
}

# Résumé
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ DE LA VÉRIFICATION" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ TOUT EST PRÊT POUR LE DÉPLOIEMENT !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "  1. Attendre 2-5 minutes que le build GitHub Actions se termine" -ForegroundColor White
    Write-Host "  2. Vérifier sur https://github.com/nextjsreact/algerie-loft/actions" -ForegroundColor White
    Write-Host "  3. Attendre que Vercel déploie automatiquement" -ForegroundColor White
    Write-Host "  4. Tester le paiement de facture sur https://www.loftalgerie.com" -ForegroundColor White
    Write-Host ""
} else {
    if ($errors.Count -gt 0) {
        Write-Host "❌ ERREURS CRITIQUES DÉTECTÉES:" -ForegroundColor Red
        $errors | ForEach-Object { Write-Host "   • $_" -ForegroundColor Red }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  AVERTISSEMENTS:" -ForegroundColor Yellow
        $warnings | ForEach-Object { Write-Host "   • $_" -ForegroundColor Yellow }
        Write-Host ""
    }
    
    if ($errors.Count -gt 0) {
        Write-Host "❌ LE DÉPLOIEMENT POURRAIT ÉCHOUER" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "⚠️  LE DÉPLOIEMENT DEVRAIT FONCTIONNER MAIS AVEC DES AVERTISSEMENTS" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
