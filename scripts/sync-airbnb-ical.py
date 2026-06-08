#!/usr/bin/env python3
"""
Script de synchronisation automatique via iCal Airbnb
Télécharge et parse les fichiers .ics pour synchroniser les calendriers
"""

import os
import sys
import requests
from datetime import datetime, timedelta
from icalendar import Calendar
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
print("SYNCHRONISATION AUTOMATIQUE iCal AIRBNB")
print("=" * 80)

# ÉTAPE 1: Récupérer les lofts avec URLs iCal
print("\n📋 Récupération des lofts avec URLs iCal...")
response = supabase.table('lofts') \
    .select('id, name, airbnb_listing_id, airbnb_ical_url') \
    .not_.is_('airbnb_ical_url', 'null') \
    .execute()

lofts = response.data
print(f"✅ {len(lofts)} lofts à synchroniser")

if len(lofts) == 0:
    print("❌ Aucun loft avec URL iCal configurée")
    print("   Exécutez d'abord: python scripts\\update-airbnb-ical-urls.py")
    sys.exit(1)

# ÉTAPE 2: Synchroniser chaque loft
print("\n🔄 Synchronisation des calendriers...")

total_events = 0
total_created = 0
total_updated = 0
total_errors = 0
failed_lofts = []

for loft in lofts:
    loft_id = loft['id']
    loft_name = loft['name']
    ical_url = loft['airbnb_ical_url']
    
    print(f"\n   📅 {loft_name}...")
    
    try:
        # Télécharger le fichier iCal
        response = requests.get(ical_url, timeout=30)
        response.raise_for_status()
        
        # Parser le fichier iCal
        cal = Calendar.from_ical(response.content)
        
        events = []
        for component in cal.walk():
            if component.name == "VEVENT":
                events.append(component)
        
        print(f"      ✅ {len(events)} événements trouvés")
        total_events += len(events)
        
        # Traiter chaque événement
        for event in events:
            try:
                # Extraire les informations
                summary = str(event.get('summary', 'Réservation Airbnb'))
                dtstart = event.get('dtstart').dt
                dtend = event.get('dtend').dt
                uid = str(event.get('uid', ''))
                
                # Convertir en dates si nécessaire
                if hasattr(dtstart, 'date'):
                    check_in_date = dtstart.date()
                else:
                    check_in_date = dtstart
                
                if hasattr(dtend, 'date'):
                    check_out_date = dtend.date()
                else:
                    check_out_date = dtend
                
                # Calculer le nombre de nuits
                nights = (check_out_date - check_in_date).days
                
                # Vérifier si la réservation existe déjà
                existing = supabase.table('reservations') \
                    .select('id') \
                    .eq('loft_id', loft_id) \
                    .eq('check_in_date', str(check_in_date)) \
                    .eq('check_out_date', str(check_out_date)) \
                    .eq('source', 'airbnb_ical') \
                    .execute()
                
                reservation_data = {
                    'loft_id': loft_id,
                    'source': 'airbnb_ical',
                    'guest_name': summary,
                    'check_in_date': str(check_in_date),
                    'check_out_date': str(check_out_date),
                    'nights': nights,
                    'status': 'confirmed',
                    'guest_count': 1,  # Par défaut
                    'total_amount': 0,  # Non disponible via iCal
                    'currency_code': 'DZD',
                    'airbnb_confirmation_code': uid[:50] if uid else None
                }
                
                if existing.data:
                    # Mettre à jour
                    supabase.table('reservations') \
                        .update(reservation_data) \
                        .eq('id', existing.data[0]['id']) \
                        .execute()
                    total_updated += 1
                else:
                    # Créer
                    supabase.table('reservations') \
                        .insert(reservation_data) \
                        .execute()
                    total_created += 1
                
            except Exception as e:
                print(f"      ⚠️  Erreur événement: {str(e)}")
                total_errors += 1
        
    except requests.exceptions.RequestException as e:
        print(f"      ❌ Erreur téléchargement: {str(e)}")
        failed_lofts.append(loft_name)
        total_errors += 1
    except Exception as e:
        print(f"      ❌ Erreur parsing: {str(e)}")
        failed_lofts.append(loft_name)
        total_errors += 1

# ÉTAPE 3: Résumé
print("\n" + "=" * 80)
print("RÉSUMÉ DE LA SYNCHRONISATION")
print("=" * 80)

print(f"\n📊 Statistiques:")
print(f"   • Lofts synchronisés: {len(lofts) - len(failed_lofts)}/{len(lofts)}")
print(f"   • Événements traités: {total_events}")
print(f"   • Réservations créées: {total_created}")
print(f"   • Réservations mises à jour: {total_updated}")
print(f"   • Erreurs: {total_errors}")

if failed_lofts:
    print(f"\n❌ Lofts en échec ({len(failed_lofts)}):")
    for loft_name in failed_lofts:
        print(f"   • {loft_name}")

print("\n" + "=" * 80)
print("🎯 PROCHAINES ÉTAPES")
print("=" * 80)
print("1. ✅ Synchronisation iCal effectuée")
print("2. 📅 Vérifier les réservations dans l'application")
print("3. ⏰ Configurer une tâche planifiée pour synchroniser régulièrement")
print("=" * 80)

print("\n💡 CONFIGURATION DE LA SYNCHRONISATION AUTOMATIQUE")
print("-" * 80)
print("Pour synchroniser automatiquement toutes les heures:")
print("\nWindows (Planificateur de tâches):")
print("  1. Ouvrir le Planificateur de tâches")
print("  2. Créer une tâche de base")
print("  3. Déclencheur: Quotidien, toutes les heures")
print("  4. Action: python c:\\...\\scripts\\sync-airbnb-ical.py")
print("\nLinux/Mac (crontab):")
print("  0 * * * * cd /path/to/project && python scripts/sync-airbnb-ical.py")
print("-" * 80)
