Write-Host "Creation d'un nouveau projet Next.js 16.1..." -ForegroundColor Green

# Créer un nouveau projet Next.js 16.1
npx create-next-app@16.1.1 temp-next16-project --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Projet cree avec succes!" -ForegroundColor Green
    Write-Host "Vous pouvez maintenant copier les fichiers necessaires depuis temp-next16-project/"
} else {
    Write-Host "Erreur lors de la creation du projet" -ForegroundColor Red
}