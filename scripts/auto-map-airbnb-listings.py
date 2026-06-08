#!/usr/bin/env python3
"""
Script de mapping automatique des listing IDs Airbnb aux lofts
Utilise les données de la base de données pour créer le mapping
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Charger les variables d'environnement
load_dotenv()

# Configuration Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Erreur: Variables d'environnement manquantes")
    print("   NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis")
    sys.exit(1)

# Créer le client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("MAPPING AUTOMATIQUE DES LISTING IDS AIRBNB AUX LOFTS")
print("=" * 80)

# ÉTAPE 1: Récupérer les listing IDs depuis staging
print("\n📋 Récupération des listing IDs depuis staging...")
response = supabase.table('airbnb_reservations_staging') \
    .select('listing_id') \
    .eq('mapping_status', 'failed') \
    .execute()

listing_ids = list(set([r['listing_id'] for r in response.data]))
listing_ids.sort()

print(f"✅ {len(listing_ids)} listing IDs uniques trouvés")

# ÉTAPE 2: Récupérer les lofts disponibles
print("\n🏠 Récupération des lofts disponibles...")
response = supabase.table('lofts') \
    .select('id, name, airbnb_listing_id') \
    .execute()

lofts = response.data
lofts_disponibles = [l for l in lofts if not l['airbnb_listing_id']]

print(f"✅ {len(lofts)} lofts totaux")
print(f"✅ {len(lofts_disponibles)} lofts disponibles pour mapping")

# ÉTAPE 3: Mapping automatique basé sur les noms fournis
print("\n🔄 Début du mapping automatique...")

# Mapping manuel basé sur les informations fournies
MANUAL_MAPPING = {
    '24697659': 'Aida Loft - Forest Vue',
    '26335420962': 'Nada Loft - Forest Vue',
    '21165327782': 'Heaven Loft',
    '177390886573': 'Kifan Loft',
    '12125861612': 'Studio Cosy Hydra',
    '11481184571': 'Loft Moderne Centre-ville Alger',
    '20540592139': 'Studio Élégant Hydra',
    '9835346151': 'Loft Artistique Casbah',
    '2176230638': 'Studio Hydra',
    '79161753263': 'Modern Downtown Loft',
    '4313236890': 'Cozy Studio Near Beach',
    '59611883639': 'Luxury Family Apartment',
    '92671283826': 'Loft Artistique Hydra',
    '47612986998': 'Loft Moderne Centre-Ville',
    '06782151086': 'Studio Haut de Gamme Hydra',
    '46674774805': 'Loft Étudiant Bab Ezzouar',
    '4738557546': 'Penthouse Vue Mer Oran',
    '43112883848': 'Loft Familial Constantine',
}

mapped_count = 0
errors = []

for listing_id, loft_name in MANUAL_MAPPING.items():
    if listing_id not in listing_ids:
        print(f"⚠️  Listing ID {listing_id} non trouvé dans staging, ignoré")
        continue
    
    # Chercher le loft par nom
    matching_lofts = [l for l in lofts if l['name'] == loft_name]
    
    if not matching_lofts:
        errors.append(f"❌ Loft '{loft_name}' non trouvé pour listing_id {listing_id}")
        continue
    
    loft = matching_lofts[0]
    
    # Mettre à jour le loft
    try:
        supabase.table('lofts') \
            .update({'airbnb_listing_id': listing_id}) \
            .eq('id', loft['id']) \
            .execute()
        
        print(f"✅ {loft_name} → {listing_id}")
        mapped_count += 1
    except Exception as e:
        errors.append(f"❌ Erreur lors du mapping de {loft_name}: {str(e)}")

# ÉTAPE 4: Mapper les listing IDs restants aux lofts disponibles
print(f"\n📊 {mapped_count} lofts mappés manuellement")

remaining_listing_ids = [lid for lid in listing_ids if lid not in MANUAL_MAPPING]
print(f"📋 {len(remaining_listing_ids)} listing IDs restants à mapper")

# Récupérer les lofts encore disponibles
response = supabase.table('lofts') \
    .select('id, name, airbnb_listing_id') \
    .is_('airbnb_listing_id', 'null') \
    .execute()

lofts_disponibles = response.data

if remaining_listing_ids and lofts_disponibles:
    print(f"\n🔄 Mapping automatique des {len(remaining_listing_ids)} listing IDs restants...")
    
    for i, listing_id in enumerate(remaining_listing_ids):
        if i >= len(lofts_disponibles):
            errors.append(f"⚠️  Plus de lofts disponibles pour listing_id {listing_id}")
            break
        
        loft = lofts_disponibles[i]
        
        try:
            supabase.table('lofts') \
                .update({'airbnb_listing_id': listing_id}) \
                .eq('id', loft['id']) \
                .execute()
            
            print(f"✅ {loft['name']} → {listing_id}")
            mapped_count += 1
        except Exception as e:
            errors.append(f"❌ Erreur lors du mapping de {loft['name']}: {str(e)}")

# ÉTAPE 5: Afficher les résultats
print("\n" + "=" * 80)
print("RÉSULTATS DU MAPPING")
print("=" * 80)

print(f"\n✅ {mapped_count} lofts mappés avec succès")

if errors:
    print(f"\n❌ {len(errors)} erreurs:")
    for error in errors:
        print(f"   {error}")

# ÉTAPE 6: Vérification
print("\n📊 Vérification du mapping...")
response = supabase.table('lofts') \
    .select('name, airbnb_listing_id') \
    .not_.is_('airbnb_listing_id', 'null') \
    .execute()

print(f"\n✅ {len(response.data)} lofts avec mapping Airbnb:")
for loft in sorted(response.data, key=lambda x: x['name']):
    print(f"   • {loft['name']}: {loft['airbnb_listing_id']}")

# ÉTAPE 7: Compter les réservations qui seront mappées
print("\n📊 Comptage des réservations qui seront mappées...")
mapped_listing_ids = [l['airbnb_listing_id'] for l in response.data]

response = supabase.table('airbnb_reservations_staging') \
    .select('id', count='exact') \
    .in_('listing_id', mapped_listing_ids) \
    .eq('mapping_status', 'failed') \
    .execute()

print(f"✅ {response.count} réservations seront mappées lors de la prochaine sync")

print("\n" + "=" * 80)
print("🎯 PROCHAINES ÉTAPES")
print("=" * 80)
print("1. ✅ Mapping des listing_ids effectué")
print("2. 🔄 Relancer la synchronisation Airbnb:")
print("   python scripts/sync-airbnb-reservations.py")
print("3. ✅ Vérifier les résultats:")
print("   Exécuter supabase/migrations/analyze_sync_results.sql")
print("=" * 80)
