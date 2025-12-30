Write-Host "Demarrage avec Next.js 16.1..." -ForegroundColor Green
Write-Host ""
Write-Host "Cela peut prendre quelques minutes la premiere fois" -ForegroundColor Yellow
Write-Host "car npx va telecharger Next.js 16.1" -ForegroundColor Yellow
Write-Host ""

try {
    npx next@16.1.1 dev --port 3000
} catch {
    Write-Host "Erreur lors du demarrage: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Essayez ces solutions:" -ForegroundColor Yellow
    Write-Host "1. Verifiez votre connexion internet"
    Write-Host "2. Executez: npm cache clean --force"
    Write-Host "3. Supprimez node_modules et reinstallez"
}