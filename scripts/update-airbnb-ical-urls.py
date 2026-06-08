#!/usr/bin/env python3
"""
Script pour mettre à jour les URLs iCal Airbnb pour chaque loft
Les URLs iCal permettent la synchronisation automatique des calendriers
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
print("MISE À JOUR DES URLs iCal AIRBNB")
print("=" * 80)

# ÉTAPE 1: Récupérer les lofts avec listing_id
print("\n📋 Récupération des lofts avec mapping Airbnb...")
response = supabase.table('lofts') \
    .select('id, name, airbnb_listing_id, airbnb_ical_url') \
    .not_.is_('airbnb_listing_id', 'null') \
    .execute()

lofts = response.data
print(f"✅ {len(lofts)} lofts trouvés")

# ÉTAPE 2: Générer les URLs iCal
print("\n🔗 Génération des URLs iCal...")

# Format de l'URL iCal Airbnb
# https://www.airbnb.com/calendar/ical/[LISTING_ID].ics

updated_count = 0
already_set_count = 0
errors = []

for loft in lofts:
    listing_id = loft['airbnb_listing_id']
    loft_id = loft['id']
    loft_name = loft['name']
    current_ical_url = loft.get('airbnb_ical_url')
    
    # Générer l'URL iCal
    ical_url = f"https://www.airbnb.com/calendar/ical/{listing_id}.ics"
    
    # Vérifier si l'URL est déjà définie
    if current_ical_url == ical_url:
        already_set_count += 1
        print(f"   ℹ️  {loft_name}: URL déjà définie")
        continue
    
    # Mettre à jour l'URL iCal
    try:
        supabase.table('lofts') \
            .update({'airbnb_ical_url': ical_url}) \
            .eq('id', loft_id) \
            .execute()
        
        print(f"   ✅ {loft_name}: {ical_url}")
        updated_count += 1
    except Exception as e:
        error_msg = f"❌ Erreur pour {loft_name}: {str(e)}"
        errors.append(error_msg)
        print(f"   {error_msg}")

# ÉTAPE 3: Résumé
print("\n" + "=" * 80)
print("RÉSUMÉ")
print("=" * 80)

print(f"\n✅ URLs mises à jour: {updated_count}")
print(f"ℹ️  URLs déjà définies: {already_set_count}")

if errors:
    print(f"\n❌ Erreurs: {len(errors)}")
    for error in errors:
        print(f"   {error}")

# ÉTAPE 4: Vérification
print("\n📊 Vérification finale...")
response = supabase.table('lofts') \
    .select('id, name, airbnb_listing_id, airbnb_ical_url') \
    .not_.is_('airbnb_listing_id', 'null') \
    .execute()

lofts_with_ical = [l for l in response.data if l.get('airbnb_ical_url')]
lofts_without_ical = [l for l in response.data if not l.get('airbnb_ical_url')]

print(f"\n✅ Lofts avec URL iCal: {len(lofts_with_ical)}")
print(f"❌ Lofts SANS URL iCal: {len(lofts_without_ical)}")

if lofts_without_ical:
    print("\n⚠️  Lofts sans URL iCal:")
    for loft in lofts_without_ical[:10]:
        print(f"   • {loft['name']} (listing_id: {loft['airbnb_listing_id']})")

# ÉTAPE 5: Afficher quelques exemples
print("\n📋 Exemples d'URLs iCal générées:")
for loft in lofts_with_ical[:5]:
    print(f"   • {loft['name']}")
    print(f"     {loft['airbnb_ical_url']}")

print("\n" + "=" * 80)
print("🎯 PROCHAINES ÉTAPES")
print("=" * 80)
print("1. ✅ URLs iCal générées et mises à jour")
print("2. 🔄 Configurer la synchronisation automatique iCal")
print("3. 📅 Tester la synchronisation avec un loft")
print("=" * 80)

# ÉTAPE 6: Informations sur la synchronisation iCal
print("\n💡 INFORMATIONS SUR LA SYNCHRONISATION iCal")
print("-" * 80)
print("Les URLs iCal permettent de synchroniser automatiquement les calendriers Airbnb.")
print("\nPour activer la synchronisation automatique:")
print("1. Créer un cron job ou une tâche planifiée")
print("2. Télécharger régulièrement les fichiers .ics")
print("3. Parser les événements et mettre à jour les réservations")
print("\nFormat de l'URL iCal:")
print("https://www.airbnb.com/calendar/ical/[LISTING_ID].ics")
print("\nNote: Les URLs iCal sont publiques et ne nécessitent pas d'authentification.")
print("-" * 80)
