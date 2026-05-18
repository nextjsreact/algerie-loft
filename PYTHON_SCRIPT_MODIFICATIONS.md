# 🐍 Modifications du Script Python Airbnb Scraper

## 📋 Vue d'Ensemble

Ce document explique comment modifier votre script Python pour supporter **les deux modes** :
- ✅ **Mode Automatique** : Envoi direct à l'API Next.js (temps réel)
- ✅ **Mode Backup** : Export JSON (toujours actif pour sécurité)

---

## 🔧 Code à Ajouter

### 1. Fonction de Sauvegarde JSON (TOUJOURS actif)

```python
import os
import json
from datetime import datetime

def save_to_json(reservations: list, output_dir: str = "data", sync_type: str = "manual"):
    """
    Sauvegarde TOUJOURS les réservations en JSON (backup)
    
    Args:
        reservations: Liste des réservations
        output_dir: Dossier de sortie (défaut: "data")
        sync_type: Type de sync (ical_watcher, targeted, full, manual)
    
    Returns:
        str: Chemin du fichier JSON créé
    """
    # Créer le dossier si nécessaire
    os.makedirs(output_dir, exist_ok=True)
    
    # Nom du fichier avec timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"{output_dir}/reservations_{sync_type}_{timestamp}.json"
    
    # Préparer le payload complet (format API)
    payload = {
        "reservations": reservations,
        "sync_metadata": {
            "sync_type": sync_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "script_version": "2.0.0"
        }
    }
    
    # Sauvegarder
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    
    print(f"✅ JSON sauvegardé: {filename}")
    print(f"   - {len(reservations)} réservation(s)")
    
    return filename
```

---

### 2. Fonction d'Envoi à l'API (OPTIONNEL)

```python
import requests
import time

def send_to_nextjs_api(reservations: list, sync_type: str = 'manual', max_retries: int = 3):
    """
    Envoie les réservations à l'API Next.js (optionnel)
    
    Args:
        reservations: Liste des réservations
        sync_type: Type de sync (ical_watcher, targeted, full, manual)
        max_retries: Nombre maximum de tentatives
    
    Returns:
        bool: True si succès, False si échec
    """
    # Récupérer la configuration
    api_url = os.getenv('NEXTJS_API_URL')
    api_key = os.getenv('NEXTJS_API_KEY')
    
    # Si pas configuré, skip (mode JSON uniquement)
    if not api_url or not api_key:
        print("⚠️  API non configurée (NEXTJS_API_URL ou NEXTJS_API_KEY manquant)")
        print("   Mode JSON uniquement activé")
        return False
    
    # Préparer le payload
    endpoint = f"{api_url}/api/airbnb/sync"
    payload = {
        "reservations": reservations,
        "sync_metadata": {
            "sync_type": sync_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "script_version": "2.0.0"
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    # Retry avec backoff exponentiel
    for attempt in range(max_retries):
        try:
            print(f"📤 Envoi de {len(reservations)} réservations à l'API Next.js (tentative {attempt + 1}/{max_retries})...")
            
            response = requests.post(
                endpoint,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            # Succès
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Synchronisation réussie!")
                print(f"   - Batch ID: {result.get('sync_batch_id', 'N/A')}")
                print(f"   - Créées: {result['metrics']['created']}")
                print(f"   - Mises à jour: {result['metrics']['updated']}")
                print(f"   - Ignorées: {result['metrics']['skipped']}")
                print(f"   - Échouées: {result['metrics']['failed']}")
                print(f"   - Conflits: {result['metrics']['conflicts']}")
                
                # Afficher les avertissements
                if result.get('warnings'):
                    print(f"⚠️  {len(result['warnings'])} avertissement(s):")
                    for warning in result['warnings'][:3]:  # Max 3
                        print(f"   - {warning['warning']}")
                    if len(result['warnings']) > 3:
                        print(f"   ... et {len(result['warnings']) - 3} autre(s)")
                
                # Afficher les erreurs
                if result.get('errors'):
                    print(f"❌ {len(result['errors'])} erreur(s):")
                    for error in result['errors'][:3]:  # Max 3
                        print(f"   - {error['error']}")
                    if len(result['errors']) > 3:
                        print(f"   ... et {len(result['errors']) - 3} autre(s)")
                
                return True
            
            # Rate limit exceeded
            elif response.status_code == 429:
                retry_after = int(response.headers.get('X-RateLimit-Reset', 60))
                print(f"⏳ Rate limit atteint. Attente de {retry_after} secondes...")
                time.sleep(retry_after)
                continue
            
            # Autre erreur HTTP
            else:
                print(f"❌ Erreur HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Message: {error_data.get('error', 'Erreur inconnue')}")
                except:
                    print(f"   Réponse: {response.text[:200]}")
                
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Backoff exponentiel: 1s, 2s, 4s
                    print(f"⏳ Nouvelle tentative dans {wait_time} secondes...")
                    time.sleep(wait_time)
                    continue
                
                return False
        
        except requests.exceptions.Timeout:
            print(f"⏱️  Timeout après 30 secondes")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"⏳ Nouvelle tentative dans {wait_time} secondes...")
                time.sleep(wait_time)
                continue
            return False
        
        except requests.exceptions.ConnectionError:
            print(f"🔌 Erreur de connexion (API inaccessible)")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"⏳ Nouvelle tentative dans {wait_time} secondes...")
                time.sleep(wait_time)
                continue
            return False
        
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"⏳ Nouvelle tentative dans {wait_time} secondes...")
                time.sleep(wait_time)
                continue
            return False
    
    return False
```

---

### 3. Fonction Principale Modifiée

```python
def sync_reservations(sync_type: str = 'manual'):
    """
    Fonction principale de synchronisation
    
    Args:
        sync_type: Type de sync (ical_watcher, targeted, full, manual)
    """
    print(f"\n{'='*60}")
    print(f"🚀 Démarrage du sync Airbnb ({sync_type})")
    print(f"{'='*60}\n")
    
    try:
        # 1. Scraper les données Airbnb
        print("📡 Scraping des réservations Airbnb...")
        reservations = scrape_airbnb_reservations()  # Votre fonction existante
        
        if not reservations:
            print("ℹ️  Aucune réservation trouvée")
            return
        
        print(f"✅ {len(reservations)} réservation(s) récupérée(s)\n")
        
        # 2. TOUJOURS sauvegarder en JSON (backup)
        print("💾 Sauvegarde en JSON (backup)...")
        json_file = save_to_json(reservations, output_dir="data", sync_type=sync_type)
        print()
        
        # 3. ESSAYER d'envoyer à l'API (optionnel)
        print("🌐 Envoi à l'API Next.js...")
        api_success = send_to_nextjs_api(reservations, sync_type=sync_type)
        print()
        
        # 4. Résumé
        print(f"{'='*60}")
        if api_success:
            print("✅ Synchronisation complète réussie")
            print(f"   - JSON backup: {json_file}")
            print(f"   - API sync: ✅ Succès")
        else:
            print("⚠️  Synchronisation partielle")
            print(f"   - JSON backup: {json_file}")
            print(f"   - API sync: ❌ Échec (utilisez l'import manuel)")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ Erreur fatale: {e}")
        import traceback
        traceback.print_exc()
```

---

### 4. Exemple d'Utilisation

```python
# Dans votre script principal (airbnb_scraper.py)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Airbnb Scraper v2.0.0')
    parser.add_argument('--mode', choices=['ical_watcher', 'targeted', 'full', 'manual'], 
                        default='manual', help='Type de synchronisation')
    parser.add_argument('--loft-id', help='ID du loft (pour mode targeted)')
    
    args = parser.parse_args()
    
    # Lancer la synchronisation
    sync_reservations(sync_type=args.mode)
```

---

## 🔐 Configuration des Variables d'Environnement

### Fichier `.env` (à créer dans le dossier du script Python)

```bash
# API Next.js (OPTIONNEL - si absent, mode JSON uniquement)
NEXTJS_API_URL=https://votreapp.vercel.app
NEXTJS_API_KEY=votre-api-key-generee

# Supabase (pour récupérer la liste des lofts si besoin)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...

# Airbnb Credentials
AIRBNB_EMAIL=votre-email@airbnb.com
AIRBNB_PASSWORD=votre-mot-de-passe

# CloakBrowser
CLOAKBROWSER_API_KEY=votre-cloakbrowser-key
```

### Charger les Variables dans Python

```python
from dotenv import load_dotenv
import os

# Charger les variables d'environnement
load_dotenv()

# Vérifier la configuration
api_url = os.getenv('NEXTJS_API_URL')
api_key = os.getenv('NEXTJS_API_KEY')

if api_url and api_key:
    print("✅ Mode API activé")
else:
    print("⚠️  Mode JSON uniquement (API non configurée)")
```

---

## 📊 Comportement selon la Configuration

### Scénario 1: API Configurée (Mode Hybride)
```bash
NEXTJS_API_URL=https://votreapp.vercel.app
NEXTJS_API_KEY=xK8vZ2mP9qR3sT5wY7nL1jH4gF6dA8bC0eM2oQ4uI6k=
```

**Résultat:**
1. ✅ Scrape Airbnb
2. ✅ Sauvegarde JSON (backup)
3. ✅ Envoie à l'API (temps réel)
4. ✅ Synchronisation complète

---

### Scénario 2: API Non Configurée (Mode JSON uniquement)
```bash
# NEXTJS_API_URL et NEXTJS_API_KEY absents ou vides
```

**Résultat:**
1. ✅ Scrape Airbnb
2. ✅ Sauvegarde JSON (backup)
3. ⚠️  Skip API (non configurée)
4. ℹ️  Import manuel via interface admin

---

### Scénario 3: API Down ou Erreur
```bash
NEXTJS_API_URL=https://votreapp.vercel.app
NEXTJS_API_KEY=xK8vZ2mP9qR3sT5wY7nL1jH4gF6dA8bC0eM2oQ4uI6k=
```

**Résultat:**
1. ✅ Scrape Airbnb
2. ✅ Sauvegarde JSON (backup)
3. ❌ Échec API (3 tentatives)
4. ⚠️  JSON disponible pour import manuel

---

## 🧪 Tests

### Test 1: Mode JSON Uniquement

```bash
# Ne pas configurer NEXTJS_API_URL et NEXTJS_API_KEY
python airbnb_scraper.py --mode manual
```

**Attendu:**
- ✅ JSON créé dans `data/reservations_manual_2026-05-18_10-30-00.json`
- ⚠️  Message "API non configurée, mode JSON uniquement"

---

### Test 2: Mode Hybride (API + JSON)

```bash
# Configurer NEXTJS_API_URL et NEXTJS_API_KEY
python airbnb_scraper.py --mode manual
```

**Attendu:**
- ✅ JSON créé dans `data/`
- ✅ Envoi à l'API réussi
- ✅ Message "Synchronisation complète réussie"

---

### Test 3: Import Manuel via Interface Admin

1. Aller sur `https://votreapp.vercel.app/admin/airbnb/import`
2. Uploader le fichier JSON
3. Cliquer sur "Importer les réservations"
4. Vérifier les métriques

---

## 📁 Structure des Fichiers JSON

### Format Attendu

```json
{
  "reservations": [
    {
      "id": "HMABCD123",
      "listing_id": "12345678",
      "statut": "Confirmée",
      "voyageur": "John Doe",
      "nb_voyageurs": 2,
      "date_arrivee": "2026-06-01",
      "date_depart": "2026-06-05",
      "nb_nuits": 4,
      "montant_total": 40000.00,
      "devise": "DZD",
      "base_price": 35000.00,
      "cleaning_fee": 3000.00,
      "service_fee": 1500.00,
      "taxes": 500.00,
      "guest_email": "john@example.com",
      "guest_phone": "+213555123456"
    }
  ],
  "sync_metadata": {
    "sync_type": "manual",
    "timestamp": "2026-05-18T10:30:00Z",
    "script_version": "2.0.0"
  }
}
```

---

## 🎯 Avantages de cette Approche

### ✅ Résilience
- JSON toujours sauvegardé (rien n'est perdu)
- Retry automatique en cas d'échec API
- Import manuel possible à tout moment

### ✅ Flexibilité
- Mode automatique (temps réel)
- Mode manuel (contrôle total)
- Mode hybride (les deux)

### ✅ Audit
- Historique complet en JSON
- Logs dans Supabase
- Traçabilité complète

### ✅ Migration Progressive
- Phase 1: JSON uniquement (test)
- Phase 2: JSON + API (production)
- Phase 3: API prioritaire, JSON backup

---

## 🆘 Troubleshooting

### Problème: "API non configurée"
**Solution:** Ajouter `NEXTJS_API_URL` et `NEXTJS_API_KEY` dans `.env`

### Problème: "Invalid API key"
**Solution:** Vérifier que l'API Key est identique dans `.env` et Vercel

### Problème: "Timeout"
**Solution:** Vérifier que l'API Next.js est accessible (ping, curl)

### Problème: "Rate limit exceeded"
**Solution:** Attendre 1 minute ou réduire la fréquence des syncs

---

## 📚 Prochaines Étapes

1. ✅ Copier les fonctions dans votre script Python
2. ✅ Créer le fichier `.env` avec les variables
3. ✅ Tester en mode JSON uniquement
4. ✅ Configurer l'API et tester en mode hybride
5. ✅ Tester l'import manuel via l'interface admin

---

**Créé le:** 2026-05-18  
**Version:** 1.0.0  
**Compatibilité:** Python 3.11+, Script Airbnb Scraper v2.0.0
