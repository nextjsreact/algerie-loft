#!/usr/bin/env python3
"""
Script pour relancer la synchronisation Airbnb après le mapping des listing IDs
Ce script met à jour les réservations en staging pour qu'elles soient remappées
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
print("RESYNCHRONISATION AIRBNB APRÈS MAPPING")
print("=" * 80)

# ÉTAPE 1: Vérifier le mapping
print("\n🔍 Vérification du mapping des lofts...")
response = supabase.table('lofts') \
    .select('id, name, airbnb_listing_id', count='exact') \
    .not_.is_('airbnb_listing_id', 'null') \
    .execute()

lofts_mappes = response.data
print(f"✅ {len(lofts_mappes)} lofts avec mapping Airbnb")

if len(lofts_mappes) == 0:
    print("❌ Aucun loft mappé ! Exécutez d'abord auto-map-airbnb-listings.py")
    sys.exit(1)

# ÉTAPE 2: Réinitialiser le statut de mapping dans staging
print("\n🔄 Réinitialisation du statut de mapping dans staging...")

# Récupérer les listing IDs mappés
mapped_listing_ids = [l['airbnb_listing_id'] for l in lofts_mappes]

# Compter les réservations à remapper
response = supabase.table('airbnb_reservations_staging') \
    .select('id', count='exact') \
    .in_('listing_id', mapped_listing_ids) \
    .eq('mapping_status', 'failed') \
    .execute()

reservations_a_remapper = response.count
print(f"📊 {reservations_a_remapper} réservations à remapper")

if reservations_a_remapper == 0:
    print("✅ Aucune réservation à remapper (déjà fait ou aucune donnée)")
    sys.exit(0)

# Réinitialiser le statut pour forcer le remapping
print("\n🔄 Réinitialisation du statut de mapping...")
try:
    response = supabase.table('airbnb_reservations_staging') \
        .update({
            'mapping_status': 'pending'
        }) \
        .in_('listing_id', mapped_listing_ids) \
        .eq('mapping_status', 'failed') \
        .execute()
    
    print(f"✅ Statut réinitialisé pour {reservations_a_remapper} réservations")
except Exception as e:
    print(f"❌ Erreur lors de la réinitialisation: {str(e)}")
    sys.exit(1)

# ÉTAPE 3: Déclencher le remapping via la fonction Supabase
print("\n🔄 Déclenchement du remapping...")

# Mapping manuel des réservations
print("\n🔄 Mapping manuel des réservations...")

mapped_count = 0
failed_count = 0

for loft in lofts_mappes:
    listing_id = loft['airbnb_listing_id']
    loft_id = loft['id']
    loft_name = loft['name']
    
    # Compter les réservations pour ce loft
    response = supabase.table('airbnb_reservations_staging') \
        .select('id', count='exact') \
        .eq('listing_id', listing_id) \
        .eq('mapping_status', 'pending') \
        .execute()
    
    count = response.count
    
    if count > 0:
        # Créer les réservations dans la table principale
        response = supabase.table('airbnb_reservations_staging') \
            .select('*') \
            .eq('listing_id', listing_id) \
            .eq('mapping_status', 'pending') \
            .execute()
        
        staging_reservations = response.data
        
        for staging_res in staging_reservations:
            try:
                # Créer ou mettre à jour la réservation
                reservation_data = {
                    'loft_id': loft_id,
                    'source': 'airbnb_scraper',
                    'airbnb_confirmation_code': staging_res['airbnb_id'],
                    'guest_name': staging_res['guest_name'],
                    'guest_count': staging_res['guest_count'],
                    'check_in_date': staging_res['check_in_date'],
                    'check_out_date': staging_res['check_out_date'],
                    'nights': staging_res['nights'],
                    'status': staging_res['status'],
                    'total_amount': staging_res['total_amount'],
                    'base_price': staging_res.get('base_price', 0),
                    'cleaning_fee': staging_res.get('cleaning_fee', 0),
                    'service_fee': staging_res.get('service_fee', 0),
                    'taxes': staging_res.get('taxes', 0),
                    'currency_code': staging_res.get('currency_code', 'EUR'),
                    'guest_email': staging_res.get('guest_email'),
                    'guest_phone': staging_res.get('guest_phone'),
                    'guest_nationality': staging_res.get('guest_nationality'),
                    'special_requests': staging_res.get('special_requests')
                }
                
                # Vérifier si la réservation existe déjà
                existing = supabase.table('reservations') \
                    .select('id') \
                    .eq('airbnb_confirmation_code', staging_res['airbnb_id']) \
                    .execute()
                
                if existing.data:
                    # Mettre à jour
                    supabase.table('reservations') \
                        .update(reservation_data) \
                        .eq('id', existing.data[0]['id']) \
                        .execute()
                else:
                    # Créer
                    supabase.table('reservations') \
                        .insert(reservation_data) \
                        .execute()
                
                # Marquer comme mappé dans staging
                supabase.table('airbnb_reservations_staging') \
                    .update({
                        'mapping_status': 'success',
                        'loft_id': loft_id
                    }) \
                    .eq('id', staging_res['id']) \
                    .execute()
                
                mapped_count += 1
                
            except Exception as e:
                print(f"   ⚠️  Erreur pour réservation {staging_res['airbnb_id']}: {str(e)}")
                
                # Marquer comme échoué
                supabase.table('airbnb_reservations_staging') \
                    .update({
                        'mapping_status': 'failed'
                    }) \
                    .eq('id', staging_res['id']) \
                    .execute()
                
                failed_count += 1
        
        print(f"   ✅ {loft_name}: {count} réservations traitées")

print(f"\n✅ Mapping terminé:")
print(f"   • Réservations mappées: {mapped_count}")
print(f"   • Réservations échouées: {failed_count}")

# ÉTAPE 4: Vérifier les résultats
print("\n📊 Vérification des résultats...")

# Compter les réservations mappées
response = supabase.table('reservations') \
    .select('id', count='exact') \
    .eq('source', 'airbnb_scraper') \
    .not_.is_('loft_id', 'null') \
    .execute()

reservations_mappees = response.count

# Compter les réservations non mappées
response = supabase.table('reservations') \
    .select('id', count='exact') \
    .eq('source', 'airbnb_scraper') \
    .is_('loft_id', 'null') \
    .execute()

reservations_non_mappees = response.count

# Compter les réservations en staging par statut
response = supabase.table('airbnb_reservations_staging') \
    .select('mapping_status', count='exact') \
    .execute()

print(f"\n✅ Réservations dans la table principale:")
print(f"   • Avec loft_id: {reservations_mappees}")
print(f"   • Sans loft_id: {reservations_non_mappees}")

# Statistiques staging
response = supabase.table('airbnb_reservations_staging') \
    .select('mapping_status') \
    .execute()

staging_stats = {}
for res in response.data:
    status = res['mapping_status']
    staging_stats[status] = staging_stats.get(status, 0) + 1

print(f"\n📊 Statut dans staging:")
for status, count in staging_stats.items():
    print(f"   • {status}: {count}")

print("\n" + "=" * 80)
print("🎯 PROCHAINES ÉTAPES")
print("=" * 80)
print("1. ✅ Remapping effectué")
print("2. 📊 Vérifier les résultats:")
print("   Exécuter: supabase/migrations/analyze_sync_results.sql")
print("3. 🔍 Débuguer les échecs si nécessaire:")
print("   SELECT * FROM airbnb_reservations_staging WHERE mapping_status = 'failed';")
print("=" * 80)
