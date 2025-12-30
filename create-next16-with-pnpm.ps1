Write-Host "=== Creation d'un nouveau projet Next.js 16.1 avec pnpm ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier si pnpm est installé
Write-Host "Verification de pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "pnpm version: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "pnpm n'est pas installe. Installation en cours..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "pnpm installe avec succes!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Creation du projet Next.js 16.1..." -ForegroundColor Yellow
Write-Host "Cela peut prendre quelques minutes..." -ForegroundColor Gray

# Créer le projet avec pnpm
pnpm create next-app@16.1.1 loft-algerie-next16 --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== PROJET CREE AVEC SUCCES! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "1. cd loft-algerie-next16" -ForegroundColor White
    Write-Host "2. Copiez vos fichiers depuis l'ancien projet" -ForegroundColor White
    Write-Host "3. pnpm dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Votre configuration contact-info.ts est prete a etre copiee!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERREUR lors de la creation du projet" -ForegroundColor Red
    Write-Host "Essayons avec bun..." -ForegroundColor Yellow
    
    # Fallback vers bun
    Write-Host "Installation de bun..." -ForegroundColor Yellow
    powershell -c "irm bun.sh/install.ps1 | iex"
    
    Write-Host "Creation avec bun..." -ForegroundColor Yellow
    bun create next-app@16.1.1 loft-algerie-next16 --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
}