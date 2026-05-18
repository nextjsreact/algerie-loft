# 🚀 Intégration Airbnb Python v2.0.0 - Prochaines Étapes

**Date:** 2026-05-19  
**Environnement:** DEV (zlpzuyctjhajdwlxzdzk.supabase.co)  
**Status:** Configuration initiale terminée ✓

---

## ✅ Ce qui a été fait

### 1. Configuration de l'environnement DEV
- ✅ Fichier `.env` mis à jour avec les nouvelles variables Supabase
- ✅ API Key générée pour l'authentification Airbnb : `NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s=`
- ✅ `AIRBNB_SYNC_ENABLED=true` activé

### 2. Infrastructure Backend (déjà en place)
- ✅ 5 migrations SQL créées dans `supabase/migrations/`
- ✅ API endpoint `/api/airbnb/sync` implémenté
- ✅ Service `AirbnbSyncService` complet
- ✅ Traducteur de statuts FR → EN
- ✅ Types TypeScript définis

### 3. Scripts de test créés
- ✅ `supabase/migrations/check_airbnb_tables.sql` - Vérification des tables
- ✅ `test-airbnb-sync.ps1` - Test de l'endpoint API

---

## 🔄 Prochaines Étapes (Par ordre de priorité)

### **ÉTAPE 1 : Appliquer les migrations SQL** (15 min)

Les 5 migrations doivent être appliquées à la base de données DEV :

1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk
2. Aller dans **SQL Editor**
3. Exécuter les migrations dans l'ordre :

```sql
-- Migration 1 : Étendre la table reservations
-- Copier le contenu de : supabase/migrations/005_extend_reservations_for_airbnb.sql

-- Migration 2 : Créer la table de staging
-- Copier le contenu de : supabase/migrations/006_create_airbnb_staging.sql

-- Migration 3 : Ajouter airbnb_listing_id dans lofts
-- Copier le contenu de : supabase/migrations/007_add_airbnb_listing_id_to_lofts.sql

-- Migration 4 : Créer la table de logs
-- Copier le contenu de : supabase/migrations/008_create_airbnb_sync_logs.sql

-- Migration 5 : Créer la table de conflits
-- Copier le contenu de : supabase/migrations/009_create_airbnb_conflicts.sql
```

4. Vérifier que tout s'est bien passé :
```sql
-- Exécuter le script de vérification
-- Copier le contenu de : supabase/migrations/check_airbnb_tables.sql
```

**Résultat attendu :**
- 5 tables créées/modifiées
- Tous les indexes créés
- Aucune erreur

---

### **ÉTAPE 2 : Tester l'endpoint API en local** (10 min)

1. Démarrer le serveur Next.js en local :
```powershell
npm run dev
```

2. Dans un autre terminal, exécuter le script de test :
```powershell
.\test-airbnb-sync.ps1
```

**Résultat attendu :**
- ✓ Succès (200 OK)
- Métriques : `processed: 1, created: 0, skipped: 1` (car listing_id pas encore mappé)
- Warning : "Listing ID 12345678 not mapped to any loft"

---

### **ÉTAPE 3 : Configurer le mapping pour 1 loft de test** (5 min)

Ajouter un mapping pour tester :

```sql
-- Dans Supabase SQL Editor
UPDATE lofts 
SET airbnb_listing_id = '12345678' 
WHERE name = 'Votre Loft de Test';

-- Vérifier
SELECT id, name, airbnb_listing_id 
FROM lofts 
WHERE airbnb_listing_id IS NOT NULL;
```

Puis relancer le test :
```powershell
.\test-airbnb-sync.ps1
```

**Résultat attendu :**
- ✓ Succès (200 OK)
- Métriques : `processed: 1, created: 1, skipped: 0`
- Aucun warning

---

### **ÉTAPE 4 : Vérifier les données dans Supabase** (5 min)

```sql
-- 1. Vérifier la réservation créée
SELECT 
  id,
  loft_id,
  guest_name,
  check_in_date,
  check_out_date,
  total_amount,
  source,
  airbnb_confirmation_code,
  synced_at
FROM reservations
WHERE source = 'airbnb_scraper'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Vérifier le staging
SELECT 
  airbnb_id,
  listing_id,
  mapping_status,
  validation_status,
  reconciliation_status,
  created_at
FROM airbnb_reservations_staging
ORDER BY created_at DESC
LIMIT 5;

-- 3. Vérifier les logs
SELECT 
  sync_batch_id,
  sync_type,
  status,
  reservations_created,
  reservations_updated,
  started_at,
  completed_at
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 5;
```

---

### **ÉTAPE 5 : Modifier le script Python** (1-2h)

Maintenant que l'API fonctionne, modifier le script Python pour envoyer les données :

**Fichier à modifier :** `d:\Airbnb_transfer_v2\airbnb_scraper.py`

**Ajouter ces fonctions :**

```python
import requests
import os
from typing import List, Dict

# Configuration
NEXTJS_API_URL = os.getenv('NEXTJS_API_URL', 'http://localhost:3000/api/airbnb/sync')
NEXTJS_API_KEY = os.getenv('NEXTJS_API_KEY', 'NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s=')

def send_to_nextjs_api(reservations: List[Dict], sync_type: str = 'manual') -> Dict:
    """
    Envoie les réservations à l'API Next.js
    
    Args:
        reservations: Liste des réservations au format Airbnb
        sync_type: Type de sync ('ical_watcher', 'targeted', 'full', 'manual')
    
    Returns:
        Réponse de l'API (dict)
    """
    payload = {
        'reservations': reservations,
        'sync_metadata': {
            'sync_type': sync_type,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'script_version': '2.0.0'
        }
    }
    
    headers = {
        'Authorization': f'Bearer {NEXTJS_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Retry avec backoff exponentiel
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(
                NEXTJS_API_URL,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ Sync réussi: {result['metrics']}")
                return result
            else:
                print(f"✗ Erreur HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Erreur réseau (tentative {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Backoff: 1s, 2s, 4s
            else:
                raise
    
    return None

# Exemple d'utilisation dans votre script existant
def main():
    # ... votre code de scraping existant ...
    
    # Au lieu d'insérer directement dans Supabase :
    # supabase.table('reservations').insert(reservation_data)
    
    # Envoyer à l'API Next.js :
    reservations = [
        {
            'id': 'HMABCD123',
            'listing_id': '12345678',
            'statut': 'Confirmée',
            'voyageur': 'John Doe',
            'nb_voyageurs': 2,
            'date_arrivee': '2026-06-01',
            'date_depart': '2026-06-05',
            'nb_nuits': 4,
            'montant_total': 40000.00,
            'devise': 'DZD',
            # ... autres champs ...
        }
    ]
    
    result = send_to_nextjs_api(reservations, sync_type='targeted')
    
    if result and result['success']:
        print(f"✓ {result['metrics']['created']} réservations créées")
        print(f"✓ {result['metrics']['updated']} réservations mises à jour")
    else:
        print("✗ Échec de la synchronisation")
```

**Variables d'environnement à ajouter dans le script Python :**
```bash
NEXTJS_API_URL=http://localhost:3000/api/airbnb/sync  # En local
# NEXTJS_API_URL=https://loftalgerie.com/api/airbnb/sync  # En production
NEXTJS_API_KEY=NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s=
```

---

### **ÉTAPE 6 : Tester le flux complet** (30 min)

1. Lancer le serveur Next.js : `npm run dev`
2. Lancer le script Python modifié
3. Vérifier que les réservations arrivent dans Supabase
4. Vérifier les logs dans `airbnb_sync_logs`

---

### **ÉTAPE 7 : Créer l'interface admin de mapping** (2-3h)

Créer une page `/admin/airbnb/mapping` pour configurer facilement le mapping `listing_id` → `loft_id`.

**Fonctionnalités :**
- Liste de tous les lofts
- Champ éditable pour `airbnb_listing_id`
- Sauvegarde automatique
- Indicateur visuel (mappé / non mappé)
- Recherche par nom ou listing_id

---

### **ÉTAPE 8 : Créer le dashboard de monitoring** (3-4h)

Créer une page `/admin/airbnb/monitoring` pour suivre les synchronisations.

**Fonctionnalités :**
- Métriques (dernières 24h, 7 jours)
- Liste des derniers syncs
- Graphiques (Chart.js ou Recharts)
- Filtres (date, type, statut)

---

### **ÉTAPE 9 : Configuration Docker** (2-3h)

Créer la configuration Docker pour déployer les services Python :

**Fichiers à créer :**
- `docker-compose.yml` - 3 services (iCal Watcher, Targeted, Full)
- `Dockerfile` - Image Python 3.11
- `entrypoint.sh` - Script de démarrage

---

### **ÉTAPE 10 : Déploiement Oracle Cloud** (2-3h)

Déployer les services Docker sur Oracle Cloud Free Tier.

---

## 📝 Notes Importantes

### API Key à utiliser
```
NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s=
```

### URLs
- **Local:** http://localhost:3000/api/airbnb/sync
- **Production:** https://loftalgerie.com/api/airbnb/sync

### Supabase DEV
- **URL:** https://zlpzuyctjhajdwlxzdzk.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk

---

## 🆘 Troubleshooting

### Erreur "Table does not exist"
→ Les migrations n'ont pas été appliquées. Retourner à l'ÉTAPE 1.

### Erreur "Invalid API key"
→ Vérifier que `AIRBNB_API_SECRET` dans `.env` correspond à la clé utilisée dans le script Python.

### Warning "Listing ID not mapped"
→ Ajouter le mapping dans la table `lofts` (voir ÉTAPE 3).

### Erreur "Rate limit exceeded"
→ Attendre 1 minute ou augmenter la limite dans `app/api/airbnb/sync/route.ts`.

---

## 📚 Documentation

- **Spec complète :** `.kiro/specs/airbnb-python-scraper-integration/`
- **Design :** `.kiro/specs/airbnb-python-scraper-integration/design.md`
- **Tasks :** `.kiro/specs/airbnb-python-scraper-integration/tasks.md`
- **API README :** `app/api/airbnb/sync/README.md`

---

**Prochaine action recommandée :** Commencer par l'ÉTAPE 1 (Appliquer les migrations SQL)
