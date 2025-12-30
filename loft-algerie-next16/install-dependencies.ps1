Write-Host "=== Installation des dependances pour Loft Algerie ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Installation des dependances principales..." -ForegroundColor Yellow

# Dépendances essentielles pour votre projet
$dependencies = @(
    "@supabase/supabase-js@^2.50.3",
    "@supabase/ssr@^0.6.1",
    "next-intl@^4.3.5",
    "next-themes@^0.4.4",
    "framer-motion@^12.23.24",
    "lucide-react@^0.454.0",
    "react-hook-form@latest",
    "@hookform/resolvers@latest",
    "zod@^4.1.12",
    "tailwind-merge@^2.5.5",
    "class-variance-authority@^0.7.1",
    "clsx@^2.1.1",
    "sonner@^1.7.4",
    "react-hot-toast@^2.5.2"
)

Write-Host "Installation avec bun..." -ForegroundColor Green
foreach ($dep in $dependencies) {
    Write-Host "  + $dep" -ForegroundColor Gray
}

bun add $dependencies

Write-Host ""
Write-Host "Installation des dependances de developpement..." -ForegroundColor Yellow

$devDependencies = @(
    "@types/node@^22.15.32",
    "tsx@^4.20.3"
)

bun add -d $devDependencies

Write-Host ""
Write-Host "=== INSTALLATION TERMINEE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Vous pouvez maintenant:" -ForegroundColor Cyan
Write-Host "1. Copier vos fichiers avec: ..\migrate-to-next16.ps1" -ForegroundColor White
Write-Host "2. Demarrer le serveur: bun dev" -ForegroundColor White