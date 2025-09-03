# Script PowerShell pour ouvrir la correction française
Write-Host "🇫🇷 Ouverture de la correction française..." -ForegroundColor Green

# Obtenir le chemin absolu du fichier
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlFile = Join-Path $scriptPath "immediate-french-fix.html"

# Vérifier si le fichier existe
if (Test-Path $htmlFile) {
    Write-Host "📂 Fichier trouvé: $htmlFile" -ForegroundColor Yellow
    
    # Ouvrir dans le navigateur par défaut
    Start-Process $htmlFile
    
    Write-Host "✅ Page de correction ouverte dans le navigateur" -ForegroundColor Green
    Write-Host "⏳ Attendez 3 secondes pour la redirection automatique" -ForegroundColor Cyan
    Write-Host "🔄 Si le problème persiste, videz le cache: Ctrl+Shift+R" -ForegroundColor Magenta
} else {
    Write-Host "❌ Fichier non trouvé: $htmlFile" -ForegroundColor Red
    Write-Host "💡 Exécutez d'abord: node scripts/force-french-server.mjs" -ForegroundColor Yellow
}

Write-Host "`n🌍 Langues disponibles après correction:" -ForegroundColor Blue
Write-Host "  🇫🇷 Français (par défaut)" -ForegroundColor Green
Write-Host "  🇩🇿 العربية (disponible)" -ForegroundColor Yellow  
Write-Host "  🇬🇧 English (disponible)" -ForegroundColor Cyan

Read-Host "`nAppuyez sur Entrée pour fermer"