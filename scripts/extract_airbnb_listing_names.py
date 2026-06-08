#!/usr/bin/env python3
"""
Script pour extraire les noms des annonces Airbnb depuis le fichier JSON
et créer automatiquement le mapping avec les lofts
"""

import json
import sys
from collections import defaultdict
from difflib import SequenceMatcher

def similarity(a, b):
    """Calcule la similarité entre deux chaînes (0-1)"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def extract_listing_names(json_file):
    """Extrait les noms des annonces depuis le fichier JSON"""
    print("=" * 70)
    print("   Extraction des Noms d'Annonces Airbnb")
    print("=" * 70)
    print(f"📁 Fichier: {json_file}\n")
    
    # Charger le fichier JSON
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"✅ {len(data)} réservations chargées\n")
    
    # Grouper par listing_id
    listings = defaultdict(lambda: {
        'count': 0,
        'names': set(),
        'sample_guests': [],
        'date_range': {'min': None, 'max': None}
    })
    
    for reservation in data:
        listing_id = reservation.get('listing_id', 'unknown')
        
        # Compter les réservations
        listings[listing_id]['count'] += 1
        
        # Extraire les noms possibles
        if 'listing_name' in reservation:
            listings[listing_id]['names'].add(reservation['listing_name'])
        if 'listing_title' in reservation:
            listings[listing_id]['names'].add(reservation['listing_title'])
        if 'annonce' in reservation:
            listings[listing_id]['names'].add(reservation['annonce'])
        
        # Échantillon de voyageurs
        if len(listings[listing_id]['sample_guests']) < 3:
            listings[listing_id]['sample_guests'].append(reservation.get('voyageur', 'N/A'))
        
        # Plage de dates
        check_in = reservation.get('date_arrivee', '')
        check_out = reservation.get('date_depart', '')
        if check_in:
            if not listings[listing_id]['date_range']['min'] or check_in < listings[listing_id]['date_range']['min']:
                listings[listing_id]['date_range']['min'] = check_in
        if check_out:
            if not listings[listing_id]['date_range']['max'] or check_out > listings[listing_id]['date_range']['max']:
                listings[listing_id]['date_range']['max'] = check_out
    
    # Trier par nombre de réservations
    sorted_listings = sorted(listings.items(), key=lambda x: x[1]['count'], reverse=True)
    
    print("=" * 70)
    print("📊 LISTING IDS PAR ORDRE DE PRIORITÉ")
    print("=" * 70)
    print()
    
    for i, (listing_id, info) in enumerate(sorted_listings, 1):
        print(f"{i}. Listing ID: {listing_id}")
        print(f"   📦 Réservations: {info['count']}")
        
        if info['names']:
            print(f"   🏠 Noms trouvés:")
            for name in info['names']:
                print(f"      - {name}")
        else:
            print(f"   ⚠️  Nom non trouvé dans les données")
        
        if info['sample_guests']:
            print(f"   👤 Échantillon voyageurs: {', '.join(info['sample_guests'][:3])}")
        
        if info['date_range']['min'] and info['date_range']['max']:
            print(f"   📅 Période: {info['date_range']['min']} → {info['date_range']['max']}")
        
        print()
    
    return sorted_listings

def generate_mapping_sql(listings, lofts):
    """Génère les requêtes SQL de mapping"""
    print("=" * 70)
    print("📝 REQUÊTES SQL DE MAPPING")
    print("=" * 70)
    print()
    
    # Lofts disponibles
    loft_names = [
        "Aida Loft - Forest Vue", "Amel loft", "Amilis Loft", "Ania loft", "Anna loft",
        # Ajoutez les 53 autres noms de lofts ici
    ]
    
    for i, (listing_id, info) in enumerate(listings[:10], 1):  # Top 10
        print(f"-- {i}. Listing ID: {listing_id} ({info['count']} réservations)")
        
        if info['names']:
            names_str = ' / '.join(info['names'])
            print(f"--    Noms Airbnb: {names_str}")
            
            # Essayer de trouver une correspondance
            best_match = None
            best_score = 0
            for loft_name in loft_names:
                for airbnb_name in info['names']:
                    score = similarity(loft_name, airbnb_name)
                    if score > best_score:
                        best_score = score
                        best_match = loft_name
            
            if best_score > 0.6:  # Seuil de similarité
                print(f"--    🎯 Correspondance suggérée: {best_match} (similarité: {best_score:.2f})")
                print(f"UPDATE lofts SET airbnb_listing_id = '{listing_id}' WHERE name = '{best_match}';")
            else:
                print(f"--    ⚠️  Pas de correspondance automatique trouvée")
                print(f"UPDATE lofts SET airbnb_listing_id = '{listing_id}' WHERE name = 'NOM_DU_LOFT_ICI';")
        else:
            print(f"--    ⚠️  Nom non trouvé - Vérifier manuellement sur Airbnb")
            print(f"UPDATE lofts SET airbnb_listing_id = '{listing_id}' WHERE name = 'NOM_DU_LOFT_ICI';")
        
        print()

def main():
    if len(sys.argv) < 2:
        print("❌ Usage: python extract_airbnb_listing_names.py <path_to_json_file>")
        print("Exemple:")
        print("python extract_airbnb_listing_names.py d:\\Airbnb_transfer_v2\\output\\reservations_airbnb.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    try:
        listings = extract_listing_names(json_file)
        generate_mapping_sql(listings, [])
        
        print("=" * 70)
        print("✅ EXTRACTION TERMINÉE")
        print("=" * 70)
        print()
        print("🎯 Prochaines étapes:")
        print("1. Copier les requêtes UPDATE ci-dessus")
        print("2. Compléter les noms de lofts manquants")
        print("3. Exécuter les requêtes dans Supabase SQL Editor")
        print("4. Relancer la synchronisation")
        print()
        
    except FileNotFoundError:
        print(f"❌ Fichier introuvable: {json_file}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"❌ Erreur de parsing JSON: {json_file}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erreur: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
