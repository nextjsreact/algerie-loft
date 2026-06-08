# ============================================================================
# Script PowerShell pour modifier airbnb_scraper.py
# ============================================================================

$SCRAPER_PATH = "d:\Airbnb_transfer_v2\airbnb_scraper.py"
$BACKUP_PATH = "d:\Airbnb_transfer_v2\airbnb_scraper.py.backup"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Modification de airbnb_scraper.py" -ForegroundColor Cyan
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
Write-Host "   Sauvegarde créée: $BACKUP_PATH" -ForegroundColor Green
Write-Host ""

# Lire le contenu
Write-Host "2. Lecture du fichier..." -ForegroundColor Yellow
$content = Get-Content $SCRAPER_PATH -Raw -Encoding UTF8

# Modification 1: Remplacer l'import Supabase
Write-Host "3. Modification 1: Remplacement de l'import Supabase..." -ForegroundColor Yellow
$oldImport = @"
# ── Client Supabase (nouveau en v2) ─────────────────────────
try:
    from supabase_client import (
        upsert_reservations,
        upsert_listings,
        log_sync,
    )
    USE_SUPABASE = True
except Exception as e:
    print(f"⚠️  Supabase désactivé : {e}")
    USE_SUPABASE = False
"@

$newImport = @"
# ── Client API Next.js (v2.0.1) ─────────────────────────────
try:
    from airbnb_api_client import (
        send_to_nextjs_api,
        upsert_reservations,
        upsert_listings,
        log_sync,
    )
    USE_API = True
except Exception as e:
    print(f"⚠️  API Next.js désactivée : {e}")
    USE_API = False
"@

$content = $content -replace [regex]::Escape($oldImport), $newImport
Write-Host "   Import modifié" -ForegroundColor Green
Write-Host ""

# Modification 2: Renommer la fonction push_to_supabase
Write-Host "4. Modification 2: Renommage de push_to_supabase..." -ForegroundColor Yellow
$oldFunction = @"
def push_to_supabase(reservations: list, ical_urls: dict):
    """Envoie les données vers Supabase :
    1. Réservations → table reservations
    2. Annonces + URLs iCal → table listings
    """
    if not USE_SUPABASE:
        print("⚠️  Supabase non configuré — skip push")
        return
    
    print("\n☁️  Push vers Supabase...")
    
    # ── 1. Réservations ──────────────────────────────────────
    count = upsert_reservations(reservations)
    print(f"   ✅ {count} réservations poussées vers Supabase")
    
    # ── 2. Annonces + URLs iCal ───────────────────────────────
    # Construire la liste des annonces uniques depuis les réservations
    listings_map = {}
    for r in reservations:
        lid  = r.get("listing_id", "")
        name = r.get("logement", "")
        if lid and lid not in listings_map:
            listings_map[lid] = {
                "listing_id": lid,
                "nom":        name,
                "ical_url":   ical_urls.get(lid, ""),
                "actif":      True,
            }
    
    if listings_map:
        upsert_listings(list(listings_map.values()))
        with_ical = sum(1 for l in listings_map.values() if l["ical_url"])
        print(f"   ✅ {len(listings_map)} annonces — {with_ical} avec URL iCal")
"@

$newFunction = @"
def push_to_nextjs(reservations: list, ical_urls: dict, sync_type: str = "full"):
    """Envoie les données vers l'API Next.js.
    
    Args:
        reservations: Liste des réservations scrapées
        ical_urls: Dict {listing_id: ical_url} (non utilisé pour l'instant)
        sync_type: Type de synchronisation ("full", "targeted", "ical_watcher", "manual")
    """
    if not USE_API:
        print("⚠️  API Next.js non configurée — skip push")
        return
    
    print("\n☁️  Envoi vers l'API Next.js...")
    
    try:
        result = send_to_nextjs_api(reservations, sync_type=sync_type)
        
        # Afficher les annonces détectées
        listing_ids = list({r.get("listing_id") for r in reservations if r.get("listing_id")})
        with_ical = sum(1 for lid in listing_ids if ical_urls.get(lid))
        print(f"   ℹ️  {len(listing_ids)} annonces détectées — {with_ical} avec URL iCal")
        print(f"   💡 Configurez le mapping dans Supabase (table lofts.airbnb_listing_id)")
        
        return result
        
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi: {e}")
        raise
"@

$content = $content -replace [regex]::Escape($oldFunction), $newFunction
Write-Host "   Fonction renommée" -ForegroundColor Green
Write-Host ""

# Modification 3: Mettre à jour l'appel dans main()
Write-Host "5. Modification 3: Mise à jour de l'appel dans main()..." -ForegroundColor Yellow
$content = $content -replace "push_to_supabase\(reservations, ical_urls\)", "push_to_nextjs(reservations, ical_urls, sync_type='full')"
Write-Host "   Appel mis à jour" -ForegroundColor Green
Write-Host ""

# Modification 4: Mettre à jour les messages finaux
Write-Host "6. Modification 4: Mise à jour des messages..." -ForegroundColor Yellow
$content = $content -replace "if USE_SUPABASE:", "if USE_API:"
$content = $content -replace "Supabase mis à jour", "API Next.js synchronisée"
Write-Host "   Messages mis à jour" -ForegroundColor Green
Write-Host ""

# Modification 5: Supprimer le log de sync (géré par l'API)
Write-Host "7. Modification 5: Suppression du log manuel..." -ForegroundColor Yellow
$oldLog = @"
    # ── Étape 8 : Log de sync ─────────────────────────────────
    duration = time.time() - start_time
    if USE_SUPABASE:
        try:
            log_sync(
                sync_type="full",
                status="success",
                listings_count=len({r["listing_id"] for r in reservations}),
                reservations_count=len(reservations),
                duration=duration,
            )
        except Exception:
            pass
"@

$newLog = @"
    # ── Étape 8 : Résumé final ────────────────────────────────
    duration = time.time() - start_time
    # Le log est maintenant géré automatiquement par l'API Next.js
"@

$content = $content -replace [regex]::Escape($oldLog), $newLog
Write-Host "   Log supprimé (géré par l'API)" -ForegroundColor Green
Write-Host ""

# Sauvegarder le fichier modifié
Write-Host "8. Sauvegarde du fichier modifié..." -ForegroundColor Yellow
$content | Out-File -FilePath $SCRAPER_PATH -Encoding UTF8 -NoNewline
Write-Host "   Fichier sauvegardé" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Modifications terminées avec succès!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fichiers créés:" -ForegroundColor Yellow
Write-Host "  - $SCRAPER_PATH (modifié)" -ForegroundColor White
Write-Host "  - $BACKUP_PATH (sauvegarde)" -ForegroundColor White
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Vérifiez les modifications dans le fichier" -ForegroundColor White
Write-Host "  2. Testez le client API: python d:\Airbnb_transfer_v2\airbnb_api_client.py" -ForegroundColor White
Write-Host "  3. Lancez le scraper: python d:\Airbnb_transfer_v2\airbnb_scraper.py" -ForegroundColor White
Write-Host ""
