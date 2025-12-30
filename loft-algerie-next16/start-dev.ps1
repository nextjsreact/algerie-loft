Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   DEMARRAGE SERVEUR - NEXT.JS 16.1" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Demarrage du serveur de developpement..." -ForegroundColor Green
Write-Host ""

# Nettoyer le cache Next.js
if (Test-Path ".next") {
    Write-Host "🧹 Nettoyage du cache Next.js..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
}

# Vérifier que Next.js est installé
if (-not (Test-Path "node_modules\.bin\next.exe")) {
    Write-Host "❌ Next.js non trouve, reinstallation..." -ForegroundColor Red
    bun install
}

Write-Host "✅ Demarrage du serveur..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Le serveur sera disponible sur:" -ForegroundColor Blue
Write-Host "   http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📋 Pages a tester:" -ForegroundColor Blue
Write-Host "   • http://localhost:3000 (Accueil)" -ForegroundColor White
Write-Host "   • http://localhost:3000/public (Interface publique)" -ForegroundColor White
Write-Host "   • http://localhost:3000/business (Fonctionnalites metier)" -ForegroundColor White
Write-Host "   • http://localhost:3000/admin (Dashboard admin)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Appuyez sur Ctrl+C pour arreter le serveur" -ForegroundColor Yellow
Write-Host ""

# Démarrer Next.js
try {
    & ".\node_modules\.bin\next.exe" dev
} catch {
    Write-Host "❌ Erreur lors du demarrage:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions alternatives:" -ForegroundColor Yellow
    Write-Host "1. Verifiez que Node.js est installe" -ForegroundColor White
    Write-Host "2. Executez: bun install" -ForegroundColor White
    Write-Host "3. Essayez: bun run dev" -ForegroundColor White
}