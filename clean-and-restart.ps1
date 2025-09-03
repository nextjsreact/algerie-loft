# Script PowerShell pour nettoyer et redémarrer Next.js
Write-Host "🧹 Nettoyage complet de Next.js..." -ForegroundColor Yellow

# Arrêter tous les processus Node.js
Write-Host "Arrêt des processus Node.js..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Attendre un peu
Start-Sleep -Seconds 3

# Supprimer le dossier .next avec gestion d'erreurs
if (Test-Path ".next") {
    Write-Host "Suppression du dossier .next..." -ForegroundColor Blue
    try {
        Remove-Item -Path ".next" -Recurse -Force -ErrorAction Stop
        Write-Host "✅ Dossier .next supprimé" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Tentative de suppression forcée..." -ForegroundColor Yellow
        # Essayer de supprimer fichier par fichier
        Get-ChildItem -Path ".next" -Recurse -Force | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
        Remove-Item -Path ".next" -Force -ErrorAction SilentlyContinue
    }
}

# Supprimer les caches supplémentaires
if (Test-Path "node_modules\.cache") {
    Write-Host "Suppression du cache node_modules..." -ForegroundColor Blue
    Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
}

# Créer un nouveau dossier .next vide
Write-Host "Création d'un nouveau dossier .next..." -ForegroundColor Blue
New-Item -ItemType Directory -Path ".next" -Force | Out-Null

Write-Host "🚀 Nettoyage terminé ! Démarrage du serveur..." -ForegroundColor Green

# Démarrer le serveur de développement
npm run dev