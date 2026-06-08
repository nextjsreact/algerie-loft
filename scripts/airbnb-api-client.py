"""
airbnb_api_client.py - Client pour envoyer les données à l'API Next.js
=======================================================================
Version  : 2.0.1
Date     : Mai 2026

Ce module remplace l'accès direct à Supabase par des appels à l'API Next.js.
À intégrer dans airbnb_scraper.py à la place de supabase_client.py

Dépendances :
    pip install requests python-dotenv

Usage :
    from airbnb_api_client import send_to_nextjs_api
    
    reservations = [...]  # Liste des réservations scrapées
    result = send_to_nextjs_api(reservations, sync_type="full")
"""

import os
import time
import requests
from typing import List, Dict, Any
from datetime import datetime

# Charger les variables d'environnement depuis .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv non installé. Installez avec: pip install python-dotenv")
    pass


# ============================================================================
# CONFIGURATION
# ============================================================================

API_URL = os.environ.get("NEXTJS_API_URL", "http://localhost:3000/api/airbnb/sync")
API_KEY = os.environ.get("NEXTJS_API_KEY", "")

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY = 2  # secondes
TIMEOUT = 30  # secondes


# ============================================================================
# FONCTIONS PRINCIPALES
# ============================================================================

def send_to_nextjs_api(
    reservations: List[Dict[str, Any]], 
    sync_type: str = "full",
    script_version: str = "2.0.1"
) -> Dict[str, Any]:
    """
    Envoie les réservations à l'API Next.js avec retry automatique.
    
    Args:
        reservations: Liste des réservations au format Airbnb
        sync_type: Type de sync ("ical_watcher", "targeted", "full", "manual")
        script_version: Version du script Python
        
    Returns:
        Dict contenant la réponse de l'API avec les métriques
        
    Raises:
        Exception: Si l'envoi échoue après tous les retries
    """
    
    if not API_KEY:
        raise ValueError("NEXTJS_API_KEY non configurée dans .env")
    
    if not reservations:
        print("⚠️  Aucune réservation à envoyer")
        return {"success": False, "error": "No reservations to send"}
    
    # Construire le payload
    payload = {
        "reservations": reservations,
        "sync_metadata": {
            "sync_type": sync_type,
            "timestamp": datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ") if hasattr(datetime, 'UTC') else datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "script_version": script_version
        }
    }
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"\n☁️  Envoi de {len(reservations)} réservations à l'API Next.js...")
    print(f"   URL: {API_URL}")
    print(f"   Type: {sync_type}")
    
    # Retry loop
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(
                API_URL,
                json=payload,
                headers=headers,
                timeout=TIMEOUT
            )
            
            # Succès
            if response.status_code == 200:
                result = response.json()
                _print_success(result)
                return result
            
            # Erreur 4xx ou 5xx
            error_msg = f"HTTP {response.status_code}"
            try:
                error_data = response.json()
                error_msg += f": {error_data.get('error', 'Unknown error')}"
                if 'details' in error_data:
                    error_msg += f"\nDétails: {error_data['details']}"
            except:
                error_msg += f": {response.text[:200]}"
            
            # Rate limit - attendre plus longtemps
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', RETRY_DELAY * 2))
                print(f"   ⚠️  Rate limit atteint - attente {retry_after}s...")
                time.sleep(retry_after)
                continue
            
            # Erreur serveur - retry
            if response.status_code >= 500:
                last_error = error_msg
                if attempt < MAX_RETRIES:
                    wait_time = RETRY_DELAY * attempt
                    print(f"   ⚠️  Tentative {attempt}/{MAX_RETRIES} échouée: {error_msg}")
                    print(f"   ⏳ Nouvelle tentative dans {wait_time}s...")
                    time.sleep(wait_time)
                    continue
            
            # Erreur client (4xx) - ne pas retry
            raise Exception(error_msg)
            
        except requests.exceptions.Timeout:
            last_error = f"Timeout après {TIMEOUT}s"
            if attempt < MAX_RETRIES:
                print(f"   ⚠️  Timeout - tentative {attempt}/{MAX_RETRIES}")
                time.sleep(RETRY_DELAY * attempt)
                continue
                
        except requests.exceptions.ConnectionError as e:
            last_error = f"Erreur de connexion: {str(e)}"
            if attempt < MAX_RETRIES:
                print(f"   ⚠️  Connexion échouée - tentative {attempt}/{MAX_RETRIES}")
                print(f"   💡 Vérifiez que le serveur Next.js est démarré (npm run dev)")
                time.sleep(RETRY_DELAY * attempt)
                continue
                
        except Exception as e:
            last_error = str(e)
            if attempt < MAX_RETRIES:
                print(f"   ⚠️  Erreur - tentative {attempt}/{MAX_RETRIES}: {e}")
                time.sleep(RETRY_DELAY * attempt)
                continue
    
    # Tous les retries ont échoué
    error_msg = f"Échec après {MAX_RETRIES} tentatives. Dernière erreur: {last_error}"
    print(f"\n❌ {error_msg}")
    raise Exception(error_msg)


def _print_success(result: Dict[str, Any]):
    """Affiche les résultats de la synchronisation."""
    metrics = result.get("metrics", {})
    errors = result.get("errors", [])
    warnings = result.get("warnings", [])
    
    print(f"\n✅ Synchronisation réussie!")
    print(f"   Batch ID: {result.get('sync_batch_id', 'N/A')}")
    print(f"\n   📊 Métriques:")
    print(f"      • Traitées:  {metrics.get('processed', 0)}")
    print(f"      • Créées:    {metrics.get('created', 0)}")
    print(f"      • Mises à jour: {metrics.get('updated', 0)}")
    print(f"      • Ignorées:  {metrics.get('skipped', 0)}")
    print(f"      • Échouées:  {metrics.get('failed', 0)}")
    print(f"      • Conflits:  {metrics.get('conflicts', 0)}")
    
    if errors:
        print(f"\n   ⚠️  Erreurs ({len(errors)}):")
        for err in errors[:5]:  # Afficher max 5 erreurs
            print(f"      • [{err.get('reservation_id', 'N/A')}] {err.get('error', 'Unknown')}")
        if len(errors) > 5:
            print(f"      ... et {len(errors) - 5} autres")
    
    if warnings:
        print(f"\n   ⚠️  Avertissements ({len(warnings)}):")
        for warn in warnings[:5]:
            print(f"      • [{warn.get('reservation_id', 'N/A')}] {warn.get('warning', 'Unknown')}")
        if len(warnings) > 5:
            print(f"      ... et {len(warnings) - 5} autres")


# ============================================================================
# FONCTIONS DE COMPATIBILITÉ (pour remplacer supabase_client.py)
# ============================================================================

def upsert_reservations(reservations: List[Dict[str, Any]]) -> int:
    """
    Fonction de compatibilité avec l'ancien supabase_client.py
    Envoie les réservations via l'API Next.js.
    
    Returns:
        Nombre de réservations traitées
    """
    try:
        result = send_to_nextjs_api(reservations, sync_type="full")
        return result.get("metrics", {}).get("processed", 0)
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi: {e}")
        return 0


def upsert_listings(listings: List[Dict[str, Any]]):
    """
    Fonction de compatibilité - Les listings sont maintenant gérés via la table lofts.
    Cette fonction ne fait rien car le mapping se fait manuellement.
    """
    print(f"   ℹ️  {len(listings)} annonces détectées (mapping manuel requis)")
    pass


def log_sync(sync_type: str, status: str, listings_count: int, 
             reservations_count: int, duration: float):
    """
    Fonction de compatibilité - Le log est maintenant géré par l'API Next.js.
    Cette fonction ne fait rien.
    """
    pass


# ============================================================================
# TEST
# ============================================================================

if __name__ == "__main__":
    # Test avec une réservation fictive
    test_reservation = {
        "id": "PYTEST001",
        "listing_id": "12345678",
        "statut": "Confirmee",
        "voyageur": "Test User",
        "nb_voyageurs": 2,
        "date_arrivee": "2026-06-10",
        "date_depart": "2026-06-15",
        "nb_nuits": 5,
        "montant_total": 50000.0,
        "devise": "DZD",
        "base_price": 45000.0,
        "cleaning_fee": 3000.0,
        "service_fee": 1500.0,
        "taxes": 500.0,
        "guest_email": "test@example.com",
        "guest_phone": "+213555000000",
        "guest_nationality": "FR",
        "special_requests": "Test de l'API client Python"
    }
    
    try:
        result = send_to_nextjs_api([test_reservation], sync_type="manual")
        print(f"\n✅ Test réussi!")
    except Exception as e:
        print(f"\n❌ Test échoué: {e}")
