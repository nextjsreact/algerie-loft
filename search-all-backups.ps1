# Script PowerShell pour chercher tous les fichiers de backup

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RECHERCHE COMPLETE DES BACKUPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Dossier backups du projet
Write-Host "[1] Dossier backups du projet:" -ForegroundColor Yellow
$projectBackups = Get-Location | Join-Path -ChildPath "backups"
Write-Host "    $projectBackups" -ForegroundColor Gray
if (Test-Path $projectBackups) {
    $files = Get-ChildItem "$projectBackups\*.sql" -ErrorAction SilentlyContinue
    if ($files) {
        $files | ForEach-Object {
            Write-Host "    ✓ $($_.Name)" -ForegroundColor Green
            Write-Host "      Taille: $([math]::Round($_.Length / 1MB, 2)) MB" -ForegroundColor Gray
            Write-Host "      Date: $($_.LastWriteTime)" -ForegroundColor Gray
        }
    } else {
        Write-Host "    ✗ Aucun fichier .sql trouvé" -ForegroundColor Red
    }
} else {
    Write-Host "    ✗ Dossier n'existe pas" -ForegroundColor Red
}
Write-Host ""

# 2. Dossier temporaire
Write-Host "[2] Dossier temporaire Windows:" -ForegroundColor Yellow
$tempBackups = Join-Path $env:TEMP "supabase-cloner"
Write-Host "    $tempBackups" -ForegroundColor Gray
if (Test-Path $tempBackups) {
    $files = Get-ChildItem "$tempBackups\*.sql" -ErrorAction SilentlyContinue
    if ($files) {
        $files | ForEach-Object {
            Write-Host "    ✓ $($_.Name)" -ForegroundColor Green
            Write-Host "      Taille: $([math]::Round($_.Length / 1MB, 2)) MB" -ForegroundColor Gray
            Write-Host "      Date: $($_.LastWriteTime)" -ForegroundColor Gray
        }
    } else {
        Write-Host "    ✗ Aucun fichier .sql trouvé" -ForegroundColor Red
    }
} else {
    Write-Host "    ✗ Dossier n'existe pas" -ForegroundColor Red
}
Write-Host ""

# 3. Recherche dans le disque C: (fichiers récents)
Write-Host "[3] Recherche de fichiers récents (dernières 24h):" -ForegroundColor Yellow
Write-Host "    Recherche de full_*.sql et backup_*.sql..." -ForegroundColor Gray
$yesterday = (Get-Date).AddDays(-1)
$recentFiles = Get-ChildItem -Path "C:\" -Filter "*.sql" -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { 
        ($_.Name -like "full_*" -or $_.Name -like "backup_*" -or $_.Name -like "dump_*") -and 
        $_.LastWriteTime -gt $yesterday 
    } | 
    Select-Object -First 10

if ($recentFiles) {
    $recentFiles | ForEach-Object {
        Write-Host "    ✓ $($_.FullName)" -ForegroundColor Green
        Write-Host "      Taille: $([math]::Round($_.Length / 1MB, 2)) MB" -ForegroundColor Gray
        Write-Host "      Date: $($_.LastWriteTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "    ✗ Aucun fichier récent trouvé" -ForegroundColor Red
}
Write-Host ""

# 4. Vérifier les permissions
Write-Host "[4] Vérification des permissions:" -ForegroundColor Yellow
if (Test-Path $projectBackups) {
    try {
        $testFile = Join-Path $projectBackups "test_write.tmp"
        "test" | Out-File $testFile -ErrorAction Stop
        Remove-Item $testFile -ErrorAction SilentlyContinue
        Write-Host "    ✓ Permissions d'écriture OK" -ForegroundColor Green
    } catch {
        Write-Host "    ✗ Pas de permissions d'écriture!" -ForegroundColor Red
        Write-Host "      Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RECOMMANDATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Vérifier la base de données:" -ForegroundColor Yellow
Write-Host "   SELECT file_path, file_size FROM backup_records ORDER BY started_at DESC LIMIT 1;" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Vérifier les logs du serveur:" -ForegroundColor Yellow
Write-Host "   Chercher: 'Backup file created at'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Créer un nouveau backup et observer les logs" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
