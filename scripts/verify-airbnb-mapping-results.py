#!/usr/bin/env python3
"""
Script pour vérifier les résultats du mapping Airbnb
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
    sys.exit(1)

# Créer le client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("VÉRIFICATION DES RÉSULTATS DU MAPPING AIRBNB")
print("=" * 80)

# 1. Lofts avec mapping
print("\n🏠 LOFTS AVEC MAPPING AIRBNB")
print("-" * 80)
response = supabase.table('lofts') \
    .select('name, airbnb_listing_id') \
    .not_.is_('airbnb_listing_id', 'null') \
    .order('name') \
    .execute()

lofts_mappes = response.data
print(f"✅ {len(lofts_mappes)} lofts mappés\n")

for loft in lofts_mappes[:10]:  # Afficher les 10 premiers
    print(f"   • {loft['name']}: {loft['airbnb_listing_id']}")

if len(lofts_mappes) > 10:
    print(f"   ... et {len(lofts_mappes) - 10} autres")

# 2. Réservations dans la table principale
print("\n📊 RÉSERVATIONS DANS LA TABLE PRINCIPALE")
print("-" * 80)

# Avec loft_id
response = supabase.table('reservations') \
    .select('id', count='exact') \
    .eq('source', 'airbnb_scraper') \
    .not_.is_('loft_id', 'null') \
    .execute()

reservations_avec_loft = response.count

# Sans loft_id
response = supabase.table('reservations') \
    .select('id', count='exact') \
    .eq('source', 'airbnb_scraper') \
    .is_('loft_id', 'null') \
    .execute()

reservations_sans_loft = response.count

total_reservations = reservations_avec_loft + reservations_sans_loft

if total_reservations > 0:
    pourcentage_mappes = (reservations_avec_loft / total_reservations) * 100
else:
    pourcentage_mappes = 0

print(f"✅ Avec loft_id:  {reservations_avec_loft:,} ({pourcentage_mappes:.1f}%)")
print(f"❌ Sans loft_id:  {reservations_sans_loft:,}")
print(f"📊 Total:         {total_reservations:,}")

# 3. Réservations par loft (Top 10)
print("\n📈 TOP 10 LOFTS PAR NOMBRE DE RÉSERVATIONS")
print("-" * 80)

response = supabase.table('reservations') \
    .select('loft_id, lofts(name)') \
    .eq('source', 'airbnb_scraper') \
    .not_.is_('loft_id', 'null') \
    .execute()

# Compter par loft
loft_counts = {}
for res in response.data:
    loft_id = res['loft_id']
    loft_name = res['lofts']['name'] if res.get('lofts') else 'Inconnu'
    loft_counts[loft_name] = loft_counts.get(loft_name, 0) + 1

# Trier et afficher le top 10
sorted_lofts = sorted(loft_counts.items(), key=lambda x: x[1], reverse=True)[:10]

for i, (loft_name, count) in enumerate(sorted_lofts, 1):
    print(f"{i:2d}. {loft_name:40s} {count:4d} réservations")

# 4. Statut dans staging
print("\n📋 STATUT DANS STAGING")
print("-" * 80)

response = supabase.table('airbnb_reservations_staging') \
    .select('mapping_status') \
    .execute()

staging_stats = {}
for res in response.data:
    status = res['mapping_status']
    staging_stats[status] = staging_stats.get(status, 0) + 1

total_staging = sum(staging_stats.values())

for status, count in sorted(staging_stats.items(), key=lambda x: x[1], reverse=True):
    pourcentage = (count / total_staging) * 100 if total_staging > 0 else 0
    emoji = "✅" if status == "success" else "⚠️" if status == "pending" else "❌"
    print(f"{emoji} {status:15s} {count:6,} ({pourcentage:5.1f}%)")

print(f"\n📊 Total staging: {total_staging:,}")

# 5. Dernière synchronisation
print("\n⏰ DERNIÈRE SYNCHRONISATION")
print("-" * 80)

response = supabase.table('airbnb_sync_logs') \
    .select('*') \
    .order('started_at', desc=True) \
    .limit(1) \
    .execute()

if response.data:
    last_sync = response.data[0]
    print(f"Date:              {last_sync.get('started_at', 'N/A')}")
    print(f"Type:              {last_sync.get('sync_type', 'N/A')}")
    print(f"Statut:            {last_sync.get('status', 'N/A')}")
    print(f"Réservations reçues: {last_sync.get('reservations_received', 0):,}")
    print(f"Créées:            {last_sync.get('reservations_created', 0):,}")
    print(f"Mises à jour:      {last_sync.get('reservations_updated', 0):,}")
    print(f"Ignorées:          {last_sync.get('reservations_skipped', 0):,}")
    print(f"Échouées:          {last_sync.get('reservations_failed', 0):,}")
    
    if last_sync.get('duration_ms'):
        duration_sec = last_sync['duration_ms'] / 1000
        print(f"Durée:             {duration_sec:.1f} secondes")
else:
    print("❌ Aucune synchronisation trouvée")

# 6. Résumé final
print("\n" + "=" * 80)
print("📊 RÉSUMÉ FINAL")
print("=" * 80)

if reservations_avec_loft > 0:
    print(f"✅ {reservations_avec_loft:,} réservations Airbnb mappées aux lofts")
    print(f"✅ {len(lofts_mappes)} lofts avec mapping Airbnb")
    print(f"✅ Taux de mapping: {pourcentage_mappes:.1f}%")
    
    if reservations_sans_loft > 0:
        print(f"\n⚠️  {reservations_sans_loft:,} réservations sans loft")
        print("   → Vérifier les listing IDs non mappés")
else:
    print("❌ Aucune réservation mappée")
    print("   → Relancer la synchronisation Airbnb")

print("=" * 80)
