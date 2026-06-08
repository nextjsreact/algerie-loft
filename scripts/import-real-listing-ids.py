#!/usr/bin/env python3
"""
Script pour importer les vrais Listing IDs Airbnb depuis un fichier CSV
Format du CSV: loft_name,listing_id
"""

import os
import sys
import csv
from dotenv import load_dotenv
from supabase import create_client, Client

# Charger les variables d'environnement
load_dotenv()

# Configuration Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Erreur: Variables d'environnement manquantes")
    sys.exit(1)

# Créer le client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("IMPORT DES VRAIS LISTING IDS AIRBNB")
print("=" * 80)

# Vérifier les arguments
if len(sys.argv) < 2:
    print("\n❌ Usage: python import-real-listing-ids.py <fichier_csv>")
    print("\nFormat du CSV:")
    print("  loft_name,listing_id")
    print("  Aida Loft - Forest Vue,12345678")
    print("  Golden loft,87654321")
    print("  ...")
    print("\nExemple:")
    print("  python import-real-listing-ids.py airbnb_listing_ids.csv")
    sys.exit(1)

csv_file = sys.argv[1]

# Vérifier que le fichier existe
if not os.path.exists(csv_file):
    print(f"\n❌ Fichier introuvable: {csv_file}")
    sys.exit(1)

print(f"\n📁 Fichier: {csv_file}")

# Lire le fichier CSV
print("\n📖 Lecture du fichier CSV...")
listing_ids_map = {}

try:
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            loft_name = row.get('loft_name', '').strip()
            listing_id = row.get('listing_id', '').strip()
            
            if loft_name and listing_id:
                listing_ids_map[loft_name] = listing_id
    
    print(f"✅ {len(listing_ids_map)} listing IDs chargés")
except Exception as e:
    print(f"❌ Erreur lecture CSV: {str(e)}")
    sys.exit(1)

if len(listing_ids_map) == 0:
    print("❌ Aucun listing ID trouvé dans le fichier")
    sys.exit(1)

# Afficher un aperçu
print("\n📋 Aperçu des données:")
for i, (loft_name, listing_id) in enumerate(list(listing_ids_map.items())[:5]):
    print(f"   • {loft_name}: {listing_id}")
if len(listing_ids_map) > 5:
    print(f"   ... et {len(listing_ids_map) - 5} autres")

# Demander confirmation
print("\n⚠️  Cette opération va mettre à jour les listing IDs dans la base de données.")
confirmation = input("Continuer ? (oui/non): ").strip().lower()

if confirmation not in ['oui', 'yes', 'y', 'o']:
    print("❌ Opération annulée")
    sys.exit(0)

# Mettre à jour les listing IDs
print("\n🔄 Mise à jour des listing IDs...")

updated_count = 0
not_found_count = 0
errors = []

for loft_name, listing_id in listing_ids_map.items():
    try:
        # Chercher le loft par nom
        response = supabase.table('lofts') \
            .select('id, name') \
            .eq('name', loft_name) \
            .execute()
        
        if not response.data:
            not_found_count += 1
            print(f"   ⚠️  Loft non trouvé: {loft_name}")
            continue
        
        loft_id = response.data[0]['id']
        
        # Générer l'URL iCal
        ical_url = f"https://www.airbnb.com/calendar/ical/{listing_id}.ics"
        
        # Mettre à jour
        supabase.table('lofts') \
            .update({
                'airbnb_listing_id': listing_id,
                'airbnb_ical_url': ical_url
            }) \
            .eq('id', loft_id) \
            .execute()
        
        print(f"   ✅ {loft_name}: {listing_id}")
        updated_count += 1
        
    except Exception as e:
        error_msg = f"❌ Erreur pour {loft_name}: {str(e)}"
        errors.append(error_msg)
        print(f"   {error_msg}")

# Résumé
print("\n" + "=" * 80)
print("RÉSUMÉ")
print("=" * 80)

print(f"\n✅ Listing IDs mis à jour: {updated_count}")
print(f"⚠️  Lofts non trouvés: {not_found_count}")

if errors:
    print(f"\n❌ Erreurs: {len(errors)}")
    for error in errors:
        print(f"   {error}")

# Vérification
print("\n📊 Vérification finale...")
response = supabase.table('lofts') \
    .select('id, name, airbnb_listing_id, airbnb_ical_url') \
    .not_.is_('airbnb_listing_id', 'null') \
    .execute()

lofts_with_listing_id = response.data

print(f"\n✅ {len(lofts_with_listing_id)} lofts avec listing ID")

# Tester une URL iCal
if lofts_with_listing_id:
    print("\n🧪 Test d'une URL iCal...")
    test_loft = lofts_with_listing_id[0]
    test_url = test_loft['airbnb_ical_url']
    
    print(f"   Loft: {test_loft['name']}")
    print(f"   URL: {test_url}")
    
    try:
        import requests
        response = requests.get(test_url, timeout=10)
        if response.status_code == 200:
            print(f"   ✅ URL iCal valide ! ({len(response.content)} bytes)")
        else:
            print(f"   ❌ Erreur HTTP {response.status_code}")
            print(f"   ⚠️  Le listing ID est peut-être incorrect")
    except Exception as e:
        print(f"   ❌ Erreur test: {str(e)}")

print("\n" + "=" * 80)
print("🎯 PROCHAINES ÉTAPES")
print("=" * 80)
print("1. ✅ Listing IDs importés")
print("2. 🧪 Tester la synchronisation iCal:")
print("   python scripts\\sync-airbnb-ical.py")
print("3. ⏰ Configurer une tâche planifiée si le test réussit")
print("=" * 80)
