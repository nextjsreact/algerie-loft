@echo off
echo 🚀 Demarrage propre de l'application Loft Algerie...
echo.

REM Supprimer le cache Next.js
if exist ".next" (
    echo 🧹 Suppression du cache Next.js...
    rmdir /s /q ".next"
    echo ✅ Cache supprime
) else (
    echo ℹ️ Aucun cache a supprimer
)

echo.
echo 🚀 Demarrage de l'application...
echo 📱 L'application sera disponible sur: http://localhost:3002
echo 🧹 En cas de probleme de cookies: Ouvrez scripts/clear-cookies.html
echo.

npm run dev