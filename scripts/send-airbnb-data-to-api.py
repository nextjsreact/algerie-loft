#!/usr/bin/env python3
"""
Script pour envoyer les données Airbnb récupérées par le scraper vers l'API Next.js
Usage: python send-airbnb-data-to-api.py <path_to_json_file>
"""

import json
import sys
import os
import time
from datetime import datetime
from pathlib import Path

# Ajouter le répertoire parent au PYTHONPATH pour importer airbnb_api_client
sys.path.insert(0, str(Path(__file__).parent))

try:
    from dotenv import load_dotenv
    import requests
except ImportError:
    print("❌ Erreur: Modules requis manquants")
    print("   Installez-les avec: pip install requests python-dotenv")
    sys.exit(1)

# Charger les variables d'environnement
load_dotenv()

# Configuration
# Par défaut, utiliser l'API de production (Vercel)
# Pour utiliser localhost, définir NEXTJS_API_URL=http://localhost:3000/api/airbnb/sync
NEXTJS_API_URL = os.getenv("NEXTJS_API_URL", "https://loftalgerie.com/api/airbnb/sync")
AIRBNB_API_SECRET = os.getenv("AIRBNB_API_SECRET")
BATCH_SIZE = 100  # Nombre de réservations par requête (max 100 selon l'API)
RETRY_ATTEMPTS = 3
RETRY_DELAY = 5  # secondes

def send_batch_to_api(reservations_batch, batch_number, total_batches):
    """
    Envoie un batch de réservations à l'API Next.js
    """
    payload = {
        "reservations": reservations_batch,
        "sync_metadata": {
            "sync_type": "manual",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "script_version": "2.0.0"
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {AIRBNB_API_SECRET}"
    }
    
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            print(f"   📤 Envoi batch {batch_number}/{total_batches} ({len(reservations_batch)} réservations) - Tentative {attempt}/{RETRY_ATTEMPTS}")
            
            response = requests.post(
                NEXTJS_API_URL,
                json=payload,
                headers=headers,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    metrics = result.get("metrics", {})
                    print(f"      ✅ Succès: {metrics.get('created', 0)} créées, {metrics.get('updated', 0)} mises à jour, {metrics.get('skipped', 0)} ignorées")
                    
                    # Afficher les warnings s'il y en a
                    warnings = result.get("warnings", [])
                    if warnings:
                        print(f"      ⚠️  {len(warnings)} avertissements")
                        for warning in warnings[:3]:  # Afficher les 3 premiers
                            print(f"         - {warning}")
                    
                    return result
                else:
                    print(f"      ❌ Échec: {result.get('error', 'Unknown error')}")
                    errors = result.get("errors", [])
                    if errors:
                        print(f"         Erreurs: {errors[:3]}")  # Afficher les 3 premières
                    return None
            
            elif response.status_code == 429:
                # Rate limit atteint
                print(f"      ⏳ Rate limit atteint, attente de {RETRY_DELAY * 2} secondes...")
                time.sleep(RETRY_DELAY * 2)
                continue
            
            else:
                print(f"      ❌ Erreur HTTP {response.status_code}: {response.text[:200]}")
                if attempt < RETRY_ATTEMPTS:
                    print(f"      ⏳ Nouvelle tentative dans {RETRY_DELAY} secondes...")
                    time.sleep(RETRY_DELAY)
                    continue
                return None
        
        except requests.exceptions.Timeout:
            print(f"      ⏱️  Timeout après 60 secondes")
            if attempt < RETRY_ATTEMPTS:
                print(f"      ⏳ Nouvelle tentative dans {RETRY_DELAY} secondes...")
                time.sleep(RETRY_DELAY)
                continue
            return None
        
        except requests.exceptions.ConnectionError as e:
            print(f"      ❌ Erreur de connexion: {e}")
            if attempt < RETRY_ATTEMPTS:
                print(f"      ⏳ Nouvelle tentative dans {RETRY_DELAY} secondes...")
                time.sleep(RETRY_DELAY)
                continue
            return None
        
        except Exception as e:
            print(f"      ❌ Erreur inattendue: {e}")
            return None
    
    return None

def validate_reservation(reservation):
    """
    Valide qu'une réservation contient tous les champs requis
    """
    required_fields = [
        'id', 'listing_id', 'statut', 'voyageur', 'nb_voyageurs',
        'date_arrivee', 'date_depart', 'nb_nuits', 'montant_total', 'devise'
    ]
    
    for field in required_fields:
        if field not in reservation or reservation[field] is None or reservation[field] == '':
            return False, f"Champ requis manquant: {field}"
    
    return True, None

def main():
    print("=" * 70)
    print("   Envoi des données Airbnb vers l'API Next.js")
    print("=" * 70)
    print()
    
    # Vérifier les arguments
    if len(sys.argv) < 2:
        print("❌ Usage: python send-airbnb-data-to-api.py <path_to_json_file>")
        print()
        print("Exemple:")
        print("   python send-airbnb-data-to-api.py d:\\Airbnb_transfer_v2\\output\\reservations_airbnb.json")
        sys.exit(1)
    
    json_file_path = sys.argv[1]
    
    # Vérifier que le fichier existe
    if not os.path.exists(json_file_path):
        print(f"❌ Fichier introuvable: {json_file_path}")
        sys.exit(1)
    
    # Vérifier la configuration
    if not AIRBNB_API_SECRET:
        print("❌ AIRBNB_API_SECRET non configuré dans .env")
        sys.exit(1)
    
    print(f"📁 Fichier: {json_file_path}")
    print(f"🌐 API URL: {NEXTJS_API_URL}")
    print(f"📦 Taille batch: {BATCH_SIZE} réservations")
    print()
    
    # Charger le fichier JSON
    print("📖 Chargement du fichier JSON...")
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Erreur lors de la lecture du fichier: {e}")
        sys.exit(1)
    
    # Extraire les réservations
    if isinstance(data, dict) and 'reservations' in data:
        reservations = data['reservations']
    elif isinstance(data, list):
        reservations = data
    else:
        print("❌ Format JSON invalide (attendu: liste ou objet avec clé 'reservations')")
        sys.exit(1)
    
    total_reservations = len(reservations)
    print(f"✅ {total_reservations} réservations chargées")
    print()
    
    # Valider les réservations
    print("🔍 Validation des réservations...")
    valid_reservations = []
    invalid_count = 0
    
    for i, reservation in enumerate(reservations):
        is_valid, error = validate_reservation(reservation)
        if is_valid:
            valid_reservations.append(reservation)
        else:
            invalid_count += 1
            if invalid_count <= 5:  # Afficher les 5 premières erreurs
                print(f"   ⚠️  Réservation {i+1} invalide: {error}")
    
    if invalid_count > 0:
        print(f"   ⚠️  {invalid_count} réservations invalides ignorées")
    
    print(f"✅ {len(valid_reservations)} réservations valides")
    print()
    
    if len(valid_reservations) == 0:
        print("❌ Aucune réservation valide à envoyer")
        sys.exit(1)
    
    # Diviser en batches
    total_batches = (len(valid_reservations) + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"📦 Division en {total_batches} batches de {BATCH_SIZE} réservations max")
    print()
    
    # Statistiques globales
    total_created = 0
    total_updated = 0
    total_skipped = 0
    total_failed = 0
    total_conflicts = 0
    failed_batches = []
    
    # Envoyer chaque batch
    start_time = time.time()
    
    for i in range(0, len(valid_reservations), BATCH_SIZE):
        batch = valid_reservations[i:i + BATCH_SIZE]
        batch_number = (i // BATCH_SIZE) + 1
        
        result = send_batch_to_api(batch, batch_number, total_batches)
        
        if result:
            metrics = result.get("metrics", {})
            total_created += metrics.get("created", 0)
            total_updated += metrics.get("updated", 0)
            total_skipped += metrics.get("skipped", 0)
            total_failed += metrics.get("failed", 0)
            total_conflicts += metrics.get("conflicts", 0)
        else:
            failed_batches.append(batch_number)
            total_failed += len(batch)
        
        # Pause entre les batches pour éviter le rate limiting
        if batch_number < total_batches:
            time.sleep(1)
    
    # Résumé final
    duration = time.time() - start_time
    print()
    print("=" * 70)
    print("   RÉSUMÉ FINAL")
    print("=" * 70)
    print(f"⏱️  Durée totale: {duration:.1f} secondes")
    print(f"✅ Créées:       {total_created}")
    print(f"🔄 Mises à jour: {total_updated}")
    print(f"⏭️  Ignorées:     {total_skipped}")
    print(f"❌ Échouées:     {total_failed}")
    print(f"⚠️  Conflits:     {total_conflicts}")
    
    if failed_batches:
        print()
        print(f"❌ Batches échoués: {failed_batches}")
    
    print("=" * 70)
    
    # Code de sortie
    if total_failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
