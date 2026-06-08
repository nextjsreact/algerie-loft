#!/usr/bin/env python3
"""
Script de vérification interactive du mapping Airbnb
Affiche un rapport visuel et interactif
"""

import os
import sys
from datetime import datetime, timedelta
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

def print_header(title):
    """Affiche un en-tête formaté"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def print_section(title):
    """Affiche un titre de section"""
    print(f"\n{title}")
    print("-" * 80)

def print_metric(label, value, status=""):
    """Affiche une métrique formatée"""
    emoji = ""
    if status == "success":
        emoji = "✅"
    elif status == "warning":
        emoji = "⚠️"
    elif status == "error":
        emoji = "❌"
    elif status == "info":
        emoji = "ℹ️"
    
    print(f"{emoji} {label:40s} {value}")

def verify_lofts_mapping():
    """Vérifie le mapping des lofts"""
    print_section("🏠 VÉRIFICATION DES LOFTS")
    
    # Lofts avec mapping
    response = supabase.table('lofts') \
        .select('id', count='exact') \
        .not_.is_('airbnb_listing_id', 'null') \
        .execute()
    
    lofts_mappes = response.count
    
    # Lofts sans mapping
    response = supabase.table('lofts') \
        .select('id', count='exact') \
        .is_('airbnb_listing_id', 'null') \
        .execute()
    
    lofts_non_mappes = response.count
    
    total_lofts = lofts_mappes + lofts_non_mappes
    
    print_metric("Total lofts", f"{total_lofts}", "info")
    print_metric("Lofts avec mapping Airbnb", f"{lofts_mappes}", "success" if lofts_non_mappes == 0 else "warning")
    print_metric("Lofts SANS mapping Airbnb", f"{lofts_non_mappes}", "success" if lofts_non_mappes == 0 else "error")
    
    if lofts_mappes > 0:
        pourcentage = (lofts_mappes / total_lofts) * 100
        print_metric("Taux de mapping", f"{pourcentage:.1f}%", "success" if pourcentage == 100 else "warning")
    
    return lofts_mappes, lofts_non_mappes

def verify_reservations_mapping():
    """Vérifie le mapping des réservations"""
    print_section("📊 VÉRIFICATION DES RÉSERVATIONS")
    
    # Réservations avec loft
    response = supabase.table('reservations') \
        .select('id', count='exact') \
        .eq('source', 'airbnb_scraper') \
        .not_.is_('loft_id', 'null') \
        .execute()
    
    reservations_mappees = response.count
    
    # Réservations sans loft
    response = supabase.table('reservations') \
        .select('id', count='exact') \
        .eq('source', 'airbnb_scraper') \
        .is_('loft_id', 'null') \
        .execute()
    
    reservations_non_mappees = response.count
    
    total_reservations = reservations_mappees + reservations_non_mappees
    
    print_metric("Total réservations Airbnb", f"{total_reservations:,}", "info")
    print_metric("Réservations avec loft", f"{reservations_mappees:,}", "success" if reservations_non_mappees == 0 else "warning")
    print_metric("Réservations SANS loft", f"{reservations_non_mappees:,}", "success" if reservations_non_mappees == 0 else "error")
    
    if total_reservations > 0:
        pourcentage = (reservations_mappees / total_reservations) * 100
        print_metric("Taux de mapping", f"{pourcentage:.1f}%", "success" if pourcentage == 100 else "warning")
    
    return reservations_mappees, reservations_non_mappees

def verify_duplicates():
    """Vérifie les doublons"""
    print_section("🔍 VÉRIFICATION DES DOUBLONS")
    
    response = supabase.table('reservations') \
        .select('airbnb_confirmation_code') \
        .eq('source', 'airbnb_scraper') \
        .not_.is_('airbnb_confirmation_code', 'null') \
        .execute()
    
    codes = [r['airbnb_confirmation_code'] for r in response.data]
    duplicates = len(codes) - len(set(codes))
    
    print_metric("Doublons détectés", f"{duplicates}", "success" if duplicates == 0 else "error")
    
    return duplicates

def show_top_lofts():
    """Affiche le top 10 des lofts"""
    print_section("📈 TOP 10 LOFTS PAR NOMBRE DE RÉSERVATIONS")
    
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
        print(f"  {i:2d}. {loft_name:45s} {count:4d} réservations")

def show_upcoming_reservations():
    """Affiche les réservations à venir"""
    print_section("📅 RÉSERVATIONS À VENIR (7 prochains jours)")
    
    today = datetime.now().date()
    next_week = today + timedelta(days=7)
    
    response = supabase.table('reservations') \
        .select('*, lofts(name)') \
        .eq('source', 'airbnb_scraper') \
        .gte('check_in_date', str(today)) \
        .lte('check_in_date', str(next_week)) \
        .not_.in_('status', ['cancelled', 'canceled']) \
        .order('check_in_date') \
        .execute()
    
    reservations = response.data
    
    if not reservations:
        print("  Aucune réservation à venir dans les 7 prochains jours")
        return
    
    for res in reservations[:10]:  # Limiter à 10
        loft_name = res['lofts']['name'] if res.get('lofts') else 'Inconnu'
        guest_name = res.get('guest_name', 'Inconnu')
        check_in = res.get('check_in_date', 'N/A')
        nights = res.get('nights', 0)
        
        print(f"  • {check_in} - {loft_name:30s} - {guest_name:20s} ({nights} nuits)")
    
    if len(reservations) > 10:
        print(f"  ... et {len(reservations) - 10} autres réservations")

def show_revenue_stats():
    """Affiche les statistiques de revenu"""
    print_section("💰 STATISTIQUES DE REVENU")
    
    response = supabase.table('reservations') \
        .select('total_amount, currency_code, status') \
        .eq('source', 'airbnb_scraper') \
        .execute()
    
    total_revenue = 0
    confirmed_revenue = 0
    
    for res in response.data:
        amount = res.get('total_amount', 0)
        status = res.get('status', '')
        
        total_revenue += amount
        
        if status not in ['cancelled', 'canceled']:
            confirmed_revenue += amount
    
    print_metric("Revenu total (toutes réservations)", f"{total_revenue:,.2f} DZD", "info")
    print_metric("Revenu confirmé (hors annulations)", f"{confirmed_revenue:,.2f} DZD", "success")

def show_sync_info():
    """Affiche les informations de synchronisation"""
    print_section("⏰ DERNIÈRE SYNCHRONISATION")
    
    response = supabase.table('airbnb_sync_logs') \
        .select('*') \
        .order('started_at', desc=True) \
        .limit(1) \
        .execute()
    
    if not response.data:
        print("  ❌ Aucune synchronisation trouvée")
        return
    
    last_sync = response.data[0]
    
    print_metric("Date", last_sync.get('started_at', 'N/A'), "info")
    print_metric("Type", last_sync.get('sync_type', 'N/A'), "info")
    print_metric("Statut", last_sync.get('status', 'N/A'), "success" if last_sync.get('status') == 'success' else "error")
    print_metric("Réservations reçues", f"{last_sync.get('reservations_received', 0):,}", "info")
    print_metric("Créées", f"{last_sync.get('reservations_created', 0):,}", "info")
    print_metric("Mises à jour", f"{last_sync.get('reservations_updated', 0):,}", "info")
    print_metric("Ignorées", f"{last_sync.get('reservations_skipped', 0):,}", "info")
    print_metric("Échouées", f"{last_sync.get('reservations_failed', 0):,}", "warning" if last_sync.get('reservations_failed', 0) > 0 else "info")

def show_summary(lofts_mappes, lofts_non_mappes, reservations_mappees, reservations_non_mappees, duplicates):
    """Affiche le résumé final"""
    print_header("📊 RÉSUMÉ FINAL")
    
    all_good = (
        lofts_non_mappes == 0 and
        reservations_non_mappees == 0 and
        duplicates == 0
    )
    
    if all_good:
        print("\n🎉 FÉLICITATIONS ! Le mapping est parfait !")
        print(f"\n✅ {lofts_mappes} lofts mappés")
        print(f"✅ {reservations_mappees:,} réservations mappées")
        print(f"✅ Aucun doublon détecté")
        print(f"✅ Taux de mapping: 100%")
    else:
        print("\n⚠️ Quelques problèmes détectés :")
        
        if lofts_non_mappes > 0:
            print(f"\n❌ {lofts_non_mappes} lofts sans mapping Airbnb")
            print("   → Exécuter: python scripts\\auto-map-airbnb-listings.py")
        
        if reservations_non_mappees > 0:
            print(f"\n❌ {reservations_non_mappees:,} réservations sans loft")
            print("   → Exécuter: python scripts\\resync-airbnb-after-mapping.py")
        
        if duplicates > 0:
            print(f"\n⚠️ {duplicates} doublons détectés")
            print("   → Voir le guide de vérification pour les supprimer")
    
    print("\n" + "=" * 80)

def main():
    """Fonction principale"""
    print_header("🔍 VÉRIFICATION INTERACTIVE DU MAPPING AIRBNB")
    
    print("\nCe script va vérifier:")
    print("  1. Le mapping des lofts")
    print("  2. Le mapping des réservations")
    print("  3. Les doublons")
    print("  4. Les statistiques")
    
    input("\nAppuyez sur Entrée pour continuer...")
    
    # Vérifications
    lofts_mappes, lofts_non_mappes = verify_lofts_mapping()
    reservations_mappees, reservations_non_mappees = verify_reservations_mapping()
    duplicates = verify_duplicates()
    
    # Statistiques
    show_top_lofts()
    show_upcoming_reservations()
    show_revenue_stats()
    show_sync_info()
    
    # Résumé
    show_summary(lofts_mappes, lofts_non_mappes, reservations_mappees, reservations_non_mappees, duplicates)
    
    print("\n💡 Pour plus de détails, exécutez:")
    print("   • SQL: supabase/migrations/VERIFICATION_COMPLETE_MAPPING.sql")
    print("   • Guide: GUIDE_VERIFICATION_MAPPING.md")

if __name__ == "__main__":
    main()
