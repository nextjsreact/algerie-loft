# Script de demarrage rapide - Tableau de Bord Executif (PowerShell)
# Ce script automatise le deploiement complet du systeme executive

Write-Host "Demarrage du deploiement du Tableau de Bord Executif..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Verifier les variables d'environnement
if (-not $env:NEXT_PUBLIC_SUPABASE_URL -or -not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "Variables d'environnement Supabase manquantes" -ForegroundColor Red
    Write-Host "Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont definies" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

Write-Host "Variables d'environnement verifiees" -ForegroundColor Green

# Etape 1: Afficher le script SQL a executer
Write-Host ""
Write-Host "ETAPE 1: Configuration de la base de donnees" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Yellow
Write-Host "Copiez et executez le contenu suivant dans votre Supabase SQL Editor:" -ForegroundColor White
Write-Host ""
Write-Host "--- DÉBUT DU SCRIPT SQL ---" -ForegroundColor Magenta

if (Test-Path "scripts\add-executive-role.sql") {
    Get-Content "scripts\add-executive-role.sql" | Write-Host -ForegroundColor Gray
} else {
    Write-Host "❌ Fichier scripts\add-executive-role.sql non trouvé" -ForegroundColor Red
}

Write-Host "--- FIN DU SCRIPT SQL ---" -ForegroundColor Magenta
Write-Host ""

Read-Host "Appuyez sur Entree apres avoir execute le script SQL dans Supabase"

# Etape 2: Test automatise
Write-Host ""
Write-Host "ETAPE 2: Test automatise du deploiement" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Execution du test automatise..." -ForegroundColor White
    if (Test-Path "scripts\test-executive-dashboard.js") {
        node "scripts\test-executive-dashboard.js"
    } else {
        Write-Host "Fichier de test non trouve" -ForegroundColor Yellow
    }
} else {
    Write-Host "Node.js non trouve, test automatise ignore" -ForegroundColor Yellow
}

# Etape 3: Instructions finales
Write-Host ""
Write-Host "ETAPE 3: Deploiement termine !" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes :" -ForegroundColor Cyan
Write-Host "1. Demarrez votre serveur de developpement : " -NoNewline -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor Yellow
Write-Host "2. Connectez-vous avec le compte executive :" -ForegroundColor White
Write-Host "   Email: " -NoNewline -ForegroundColor White
Write-Host "executive@loftmanager.com" -ForegroundColor Green
Write-Host "   Mot de passe: " -NoNewline -ForegroundColor White
Write-Host "executive123" -ForegroundColor Green
Write-Host "3. Accedez au tableau de bord : " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000/executive" -ForegroundColor Blue
Write-Host ""
Write-Host "Configuration optionnelle :" -ForegroundColor Cyan
Write-Host "- Configurez les alertes automatiques (voir EXECUTIVE_DASHBOARD_SETUP.md)" -ForegroundColor Gray
Write-Host "- Personnalisez les seuils d'alerte selon vos besoins" -ForegroundColor Gray
Write-Host "- Changez les mots de passe par defaut" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation complete : " -NoNewline -ForegroundColor White
Write-Host "EXECUTIVE_DASHBOARD_SETUP.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "Votre tableau de bord executif est pret a l'emploi !" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

Read-Host "Appuyez sur Entree pour terminer"