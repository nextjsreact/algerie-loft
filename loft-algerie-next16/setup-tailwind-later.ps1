Write-Host "=== Configuration Tailwind CSS (Optionnel) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "ATTENTION: Votre projet fonctionne déjà parfaitement avec du CSS moderne." -ForegroundColor Green
Write-Host "Cette étape est optionnelle et peut être faite plus tard." -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Voulez-vous installer Tailwind CSS maintenant ? (y/N)"

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "Installation de Tailwind CSS..." -ForegroundColor Yellow
    
    # Créer le fichier de configuration Tailwind
    @"
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};

export default config;
"@ | Out-File -FilePath "tailwind.config.ts" -Encoding UTF8
    
    # Mettre à jour PostCSS
    @"
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
"@ | Out-File -FilePath "postcss.config.mjs" -Encoding UTF8
    
    # Mettre à jour globals.css
    @"
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
}
"@ | Out-File -FilePath "src/app/globals.css" -Encoding UTF8
    
    Write-Host ""
    Write-Host "✅ Tailwind CSS configuré !" -ForegroundColor Green
    Write-Host "Redémarrez le serveur avec: bun dev" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✅ Parfait ! Votre projet fonctionne déjà très bien avec du CSS moderne." -ForegroundColor Green
    Write-Host "Vous pouvez toujours installer Tailwind plus tard en relançant ce script." -ForegroundColor Cyan
}