# ============================================================================
# Script: Configuration Multi-Comptes GitHub
# Description: Configure SSH pour gérer plusieurs comptes GitHub par projet
# ============================================================================

Write-Host "🔧 Configuration Multi-Comptes GitHub" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Créer le fichier de configuration SSH
Write-Host "📝 Étape 1: Création du fichier de configuration SSH..." -ForegroundColor Yellow

$sshConfigPath = "$env:USERPROFILE\.ssh\config"
$sshConfigContent = @"
# Configuration SSH pour plusieurs comptes GitHub

# Compte principal nextjsreact (pour algerie-loft)
Host github-nextjsreact
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes

# Compte secondaire tigdittgolf-lab (pour autres projets)
Host github-tigdittgolf
    HostName github.com
    User git
    IdentityFile ~/.ssh/tempo_id_rsa
    IdentitiesOnly yes

# Configuration par défaut pour GitHub
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
"@

# Sauvegarder l'ancien fichier si il existe
if (Test-Path $sshConfigPath) {
    $backupPath = "$sshConfigPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $sshConfigPath $backupPath
    Write-Host "   ✅ Ancien fichier sauvegardé: $backupPath" -ForegroundColor Green
}

# Créer le nouveau fichier
Set-Content -Path $sshConfigPath -Value $sshConfigContent -Encoding UTF8
Write-Host "   ✅ Fichier de configuration créé: $sshConfigPath" -ForegroundColor Green
Write-Host ""

# Étape 2: Vérifier les clés SSH
Write-Host "🔑 Étape 2: Vérification des clés SSH..." -ForegroundColor Yellow

$key1 = "$env:USERPROFILE\.ssh\id_ed25519"
$key2 = "$env:USERPROFILE\.ssh\tempo_id_rsa"

if (Test-Path $key1) {
    Write-Host "   ✅ Clé nextjsreact trouvée: $key1" -ForegroundColor Green
} else {
    Write-Host "   ❌ Clé nextjsreact manquante: $key1" -ForegroundColor Red
}

if (Test-Path $key2) {
    Write-Host "   ✅ Clé tigdittgolf trouvée: $key2" -ForegroundColor Green
} else {
    Write-Host "   ❌ Clé tigdittgolf manquante: $key2" -ForegroundColor Red
}
Write-Host ""

# Étape 3: Afficher la clé publique pour GitHub
Write-Host "📋 Étape 3: Clé publique à ajouter sur GitHub..." -ForegroundColor Yellow
Write-Host "   Copiez cette clé et ajoutez-la sur https://github.com/settings/keys" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "$key1.pub") {
    $publicKey = Get-Content "$key1.pub"
    Write-Host "   Clé publique nextjsreact:" -ForegroundColor White
    Write-Host "   $publicKey" -ForegroundColor Gray
    Write-Host ""
}

# Étape 4: Configurer ce projet (algerie-loft)
Write-Host "🔄 Étape 4: Configuration du projet algerie-loft..." -ForegroundColor Yellow

$currentRemote = git remote get-url origin 2>$null
if ($currentRemote) {
    Write-Host "   URL actuelle: $currentRemote" -ForegroundColor Gray
    
    # Changer pour SSH avec le bon host
    git remote set-url origin git@github-nextjsreact:nextjsreact/algerie-loft.git
    
    $newRemote = git remote get-url origin
    Write-Host "   ✅ Nouvelle URL: $newRemote" -ForegroundColor Green
} else {
    Write-Host "   ❌ Impossible de trouver le remote origin" -ForegroundColor Red
}
Write-Host ""

# Étape 5: Tester la connexion
Write-Host "🧪 Étape 5: Test de connexion SSH..." -ForegroundColor Yellow
Write-Host "   Test de connexion à GitHub avec le compte nextjsreact..." -ForegroundColor Cyan
Write-Host ""

ssh -T git@github-nextjsreact 2>&1 | Out-String | Write-Host

Write-Host ""
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Vérifiez que la clé SSH est ajoutée sur https://github.com/settings/keys" -ForegroundColor White
Write-Host "   2. Testez avec: git push" -ForegroundColor White
Write-Host "   3. Pour vos autres projets, utilisez:" -ForegroundColor White
Write-Host "      git remote set-url origin git@github-tigdittgolf:tigdittgolf-lab/nom-repo.git" -ForegroundColor Gray
Write-Host ""
