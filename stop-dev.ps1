# Script pour arrêter le serveur Next.js
# Usage: .\stop-dev.ps1

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  ARRÊT DU SERVEUR NEXT.JS" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Trouver le processus sur le port 3000
$port = 3000
Write-Host "Recherche du serveur sur le port $port..." -ForegroundColor Yellow

try {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    
    if ($connections) {
        $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        
        foreach ($pid in $processes) {
            $processInfo = Get-Process -Id $pid -ErrorAction SilentlyContinue
            
            if ($processInfo) {
                Write-Host "Serveur trouvé :" -ForegroundColor Green
                Write-Host "  - PID: $pid" -ForegroundColor White
                Write-Host "  - Nom: $($processInfo.ProcessName)" -ForegroundColor White
                Write-Host ""
                
                Write-Host "Arrêt du serveur..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force
                
                Start-Sleep -Seconds 1
                
                # Vérifier si le processus est bien arrêté
                $stillRunning = Get-Process -Id $pid -ErrorAction SilentlyContinue
                
                if (-not $stillRunning) {
                    Write-Host "✅ Serveur arrêté avec succès !" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ Le serveur n'a pas pu être arrêté complètement" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "❌ Aucun serveur trouvé sur le port $port" -ForegroundColor Red
        Write-Host "Le serveur est peut-être déjà arrêté." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur lors de l'arrêt du serveur" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
