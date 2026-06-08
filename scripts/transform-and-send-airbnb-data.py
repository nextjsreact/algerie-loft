#!/usr/bin/env python3
"""
Script pour transformer et envoyer les données Airbnb du scraper vers l'API Next.js
Ce script convertit le format du scraper Python vers le format attendu par l'API
"""

import json
import sys
import os
import time
from datetime import datetime
from pathlib import Path

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
NEXTJS_API_URL = os.getenv("NEXTJS_API_URL", "http://localhost:3000/api/airbnb/sync")
AIRBNB_API_SECRET = os.getenv("AIRBNB_API_SECRET")
BATCH_SIZE = 100
RETRY_ATTEMPTS = 3
RETRY_DELAY = 5

def transform_reservation(scraper_data):
    """
    Transforme une réservation du format scraper vers le format API
    """
    # Extraire les données de base
    reservation_id = scraper_data.get('id', '')
    listing_id = str(scraper_data.get('listing_id', ''))
    
    # Transformer le statut (garder en français, l'API le traduira)
    statut = scraper_data.get('statut', 'Inconnu')
    
    # Données voyageur
    voyageur = scraper_data.get('voyageur', 'Inconnu')
    nb_voyageurs = scraper_data.get('nb_voyageurs', 1)
    
    # Dates
    date_arrivee = scraper_data.get('date_arrivee', '')
    date_depart = scraper_data.get('date_depart', '')
    nb_nuits = scraper_data.get('nb_nuits', 1)
    
    # Montants
    montant_total = float(scraper_data.get('montant_total', 0.0))
    devise = scraper_data.get('devise', 'EUR')
    
    # Coordonnées voyageur (optionnelles)
    guest_email = scraper_data.get('email', '') or ''
    guest_phone = scraper_data.get('telephone', '') or ''
    guest_nationality = scraper_data.get('nationalite', '') or ''
    special_requests = scraper_data.get('demandes_speciales', '') or ''
    
    # Construire l'objet au format API
    api_reservation = {
        'id': reservation_id,
        'listing_id': listing_id,
        'statut': statut,
        'voyageur': voyageur,
        'nb_voyageurs': nb_voyageurs,
        'date_arrivee': date_arrivee,
        'date_depart': date_depart,
        'nb_nuits': nb_nuits,
        'montant_total': montant_total,
        'devise': devise,
    }
    
    # Ajouter les champs optionnels s'ils existent
    if guest_email:
        api_reservation['guest_email'] = guest_email
    if guest_phone:
        api_reservation['guest_phone'] = guest_phone
    if guest_nationality:
        api_reservation['guest_nationality'] = guest_nationality
    if special_requests:
        api_reservation['special_requests'] = special_requests
    
    # Ajouter les détails de prix (optionnels, on met 0 si non disponibles)
    api_reservation['base_price'] = montant_total  # On utilise le montant total comme base
    api_reservation['cleaning_fee'] = 0.0
    api_reservation['service_fee'] = 0.0
    api_reservation['taxes'] = 0.0
    
    return api_reservation

def send_batch_to_api(reservations_batch, batch_number, total_batches):
    """
    Envoie un batch de réservations à l'API Next.js
    """
    payload = {
        "reservations": reservations_batch,
        "sync_metadata": {
            "sync_type": "manual",
            "timestamp": datetime.now().isoformat() + "Z",
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
                    
                    warnings = result.get("warnings", [])
                    if warnings:
                        print(f"      ⚠️  {len(warnings)} avertissements")
                    
                    return result
                else:
                    error_msg = result.get('error', 'Unknown error')
                    details = result.get('details', [])
                    print(f"      ❌ Échec: {error_msg}")
                    if details and attempt == RETRY_ATTEMPTS:
                        print(f"         Détails: {details[:3]}")
                    return None
            
            elif response.status_code == 429:
                print(f"      ⏳ Rate limit atteint, attente de {RETRY_DELAY * 2} secondes...")
                time.sleep(RETRY_DELAY * 2)
                continue
            
            elif response.status_code == 400:
                error_data = response.json()
                print(f"      ❌ Erreur de validation: {error_data.get('error', 'Unknown')}")
                if 'details' in error_data and attempt == RETRY_ATTEMPTS:
                    print(f"         Détails: {error_data['details'][:3]}")
                return None
            
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

def main():
    print("=" * 70)
    print("   Transformation et Envoi des données Airbnb vers l'API Next.js")
    print("=" * 70)
    print()
    
    # Vérifier les arguments
    if len(sys.argv) < 2:
        print("❌ Usage: python transform-and-send-airbnb-data.py <path_to_json_file>")
        print()
        print("Exemple:")
        print("   python transform-and-send-airbnb-data.py d:\\Airbnb_transfer_v2\\output\\reservations_airbnb.json")
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
    
    # Extraire les réservations (format scraper: {reservations: [...], Count: X})
    if isinstance(data, dict) and 'reservations' in data:
        scraper_reservations = data['reservations']
    elif isinstance(data, list):
        scraper_reservations = data
    else:
        print("❌ Format JSON invalide")
        sys.exit(1)
    
    total_reservations = len(scraper_reservations)
    print(f"✅ {total_reservations} réservations chargées")
    print()
    
    # Transformer les réservations
    print("🔄 Transformation des réservations au format API...")
    api_reservations = []
    skipped_count = 0
    
    for i, scraper_res in enumerate(scraper_reservations):
        try:
            # Vérifier les champs requis
            if not scraper_res.get('id') or not scraper_res.get('listing_id'):
                skipped_count += 1
                continue
            
            if not scraper_res.get('date_arrivee') or not scraper_res.get('date_depart'):
                skipped_count += 1
                continue
            
            api_res = transform_reservation(scraper_res)
            api_reservations.append(api_res)
        except Exception as e:
            print(f"   ⚠️  Erreur transformation réservation {i+1}: {e}")
            skipped_count += 1
    
    if skipped_count > 0:
        print(f"   ⚠️  {skipped_count} réservations ignorées (données incomplètes)")
    
    print(f"✅ {len(api_reservations)} réservations transformées")
    print()
    
    if len(api_reservations) == 0:
        print("❌ Aucune réservation valide à envoyer")
        sys.exit(1)
    
    # Diviser en batches
    total_batches = (len(api_reservations) + BATCH_SIZE - 1) // BATCH_SIZE
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
    
    for i in range(0, len(api_reservations), BATCH_SIZE):
        batch = api_reservations[i:i + BATCH_SIZE]
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
        
        # Pause entre les batches
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
    if total_failed > 0 and total_created == 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
