# ========================================
# FIX: Interface Partners Vide
# ========================================
# Script PowerShell pour Windows
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIX: Interface Partners Vide" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1 : Arrêter le serveur
Write-Host "[1/4] Arrêt du serveur..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "     OK - Serveur arrêté" -ForegroundColor Green
Write-Host ""

# Étape 2 : Nettoyage du cache Next.js
Write-Host "[2/4] Nettoyage du cache Next.js..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "     OK - Cache .next supprimé" -ForegroundColor Green
} else {
    Write-Host "     OK - Pas de cache à supprimer" -ForegroundColor Green
}
Write-Host ""

# Étape 3 : Nettoyage du cache npm
Write-Host "[3/4] Nettoyage du cache npm..." -ForegroundColor Yellow
npm cache clean --force 2>&1 | Out-Null
Write-Host "     OK - Cache npm nettoyé" -ForegroundColor Green
Write-Host ""

# Étape 4 : Redémarrage du serveur
Write-Host "[4/4] Redémarrage du serveur..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Serveur démarré !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testez maintenant :" -ForegroundColor Yellow
Write-Host "  http://localhost:3000/fr/admin/partners" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Démarrer le serveur
npm run dev
