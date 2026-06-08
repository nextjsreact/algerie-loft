# ============================================================================
# Script pour améliorer l'extraction des données voyageur dans airbnb_scraper.py
# ============================================================================

$SCRAPER_PATH = "d:\Airbnb_transfer_v2\airbnb_scraper.py"
$BACKUP_PATH = "d:\Airbnb_transfer_v2\airbnb_scraper.py.backup2"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Amélioration extraction données voyageur" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le fichier existe
if (-not (Test-Path $SCRAPER_PATH)) {
    Write-Host "Erreur: Fichier non trouvé: $SCRAPER_PATH" -ForegroundColor Red
    exit 1
}

# Créer une sauvegarde
Write-Host "1. Création d'une sauvegarde..." -ForegroundColor Yellow
Copy-Item $SCRAPER_PATH $BACKUP_PATH -Force
Write-Host "   Sauvegarde: $BACKUP_PATH" -ForegroundColor Green
Write-Host ""

# Lire le contenu
Write-Host "2. Lecture du fichier..." -ForegroundColor Yellow
$content = Get-Content $SCRAPER_PATH -Raw -Encoding UTF8

# Ajouter les nouveaux chemins d'extraction pour email
Write-Host "3. Ajout extraction email..." -ForegroundColor Yellow
$oldEmailPattern = 'guest_email = _extract_field\(node,[^)]+default=""\)'
$newEmailExtraction = @'
guest_email = _extract_field(
        node,
        ["guest_user", "email"],
        ["guest", "email"],
        ["guest_details", "email"],
        ["guest_email"],
        ["guestEmail"],
        ["contact_info", "email"],
        ["guest_user", "contact", "email"],
        default=""
    )
'@

if ($content -match $oldEmailPattern) {
    $content = $content -replace $oldEmailPattern, $newEmailExtraction
    Write-Host "   Email extraction améliorée" -ForegroundColor Green
} else {
    Write-Host "   Pattern email non trouvé - ajout manuel requis" -ForegroundColor Yellow
}
Write-Host ""

# Ajouter les nouveaux chemins d'extraction pour téléphone
Write-Host "4. Ajout extraction téléphone..." -ForegroundColor Yellow
$oldPhonePattern = 'guest_phone = _extract_field\(node,[^)]+default=""\)'
$newPhoneExtraction = @'
guest_phone = _extract_field(
        node,
        ["guest_user", "phone"],
        ["guest", "phone"],
        ["guest_details", "phone"],
        ["guest_phone"],
        ["guestPhone"],
        ["contact_info", "phone"],
        ["guest_user", "contact", "phone"],
        ["guest_user", "phone_number"],
        default=""
    )
    
    # Nettoyer le téléphone
    if guest_phone:
        guest_phone = guest_phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
'@

if ($content -match $oldPhonePattern) {
    $content = $content -replace $oldPhonePattern, $newPhoneExtraction
    Write-Host "   Téléphone extraction améliorée" -ForegroundColor Green
} else {
    Write-Host "   Pattern téléphone non trouvé - ajout manuel requis" -ForegroundColor Yellow
}
Write-Host ""

# Ajouter les nouveaux chemins d'extraction pour nationalité
Write-Host "5. Ajout extraction nationalité..." -ForegroundColor Yellow
$oldNationalityPattern = 'guest_nationality = _extract_field\(node,[^)]+default=""\)'
$newNationalityExtraction = @'
guest_nationality = _extract_field(
        node,
        ["guest_user", "nationality"],
        ["guest", "nationality"],
        ["guest_details", "nationality"],
        ["guest_nationality"],
        ["guestNationality"],
        ["guest_user", "country"],
        ["guest_user", "country_code"],
        default=""
    )
    
    # Normaliser la nationalité (2 lettres majuscules)
    if guest_nationality and len(guest_nationality) > 2:
        country_map = {
            "France": "FR", "Algeria": "DZ", "Algérie": "DZ",
            "United States": "US", "United Kingdom": "GB",
            "Germany": "DE", "Spain": "ES", "Italy": "IT",
            "Canada": "CA", "Morocco": "MA", "Tunisia": "TN",
        }
        guest_nationality = country_map.get(guest_nationality, guest_nationality[:2].upper())
'@

if ($content -match $oldNationalityPattern) {
    $content = $content -replace $oldNationalityPattern, $newNationalityExtraction
    Write-Host "   Nationalité extraction améliorée" -ForegroundColor Green
} else {
    Write-Host "   Pattern nationalité non trouvé - ajout manuel requis" -ForegroundColor Yellow
}
Write-Host ""

# Sauvegarder
Write-Host "6. Sauvegarde du fichier..." -ForegroundColor Yellow
$content | Out-File -FilePath $SCRAPER_PATH -Encoding UTF8 -NoNewline
Write-Host "   Fichier sauvegardé" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Amélioration terminée!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "  Les données email/téléphone/nationalité ne sont pas toujours" -ForegroundColor White
Write-Host "  disponibles dans l'API Airbnb. Elles dépendent de:" -ForegroundColor White
Write-Host "    - Le statut de la réservation (confirmée vs pending)" -ForegroundColor White
Write-Host "    - Les paramètres de confidentialité du voyageur" -ForegroundColor White
Write-Host "    - Les restrictions RGPD d'Airbnb" -ForegroundColor White
Write-Host ""
Write-Host "  Si ces champs sont vides, c'est normal!" -ForegroundColor White
Write-Host ""
