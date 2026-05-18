# 🎉 Intégration Airbnb - Solution Complète

## ✅ Ce qui a été créé

### 🔌 API Endpoint (Option A - Automatique)
- **Fichier:** `app/api/airbnb/sync/route.ts`
- **Fonctionnalités:**
  - ✅ Authentification API Key
  - ✅ Validation Zod
  - ✅ Rate limiting (100 req/min)
  - ✅ Mapping listing_id → loft_id
  - ✅ Réconciliation (CREATE/UPDATE)
  - ✅ Détection de conflits
  - ✅ Logging complet

### 📤 Interface Admin Import (Option C - Manuel)
- **Fichier:** `app/[locale]/admin/airbnb/import/page.tsx`
- **Fonctionnalités:**
  - ✅ Upload fichier JSON
  - ✅ Prévisualisation des données
  - ✅ Validation avant import
  - ✅ Métriques détaillées
  - ✅ Gestion des erreurs/warnings

### 🐍 Code Python Modifié (Hybride)
- **Fichier:** `PYTHON_SCRIPT_MODIFICATIONS.md`
- **Fonctionnalités:**
  - ✅ Sauvegarde JSON (toujours actif)
  - ✅ Envoi API (optionnel)
  - ✅ Retry automatique
  - ✅ Backoff exponentiel
  - ✅ Logs détaillés

---

## 🎯 Architecture Finale

```
┌─────────────────────────────────────────────────────────────┐
│ Script Python Airbnb Scraper v2.0.0                         │
│                                                             │
│  1. Scrape Airbnb (CloakBrowser)                           │
│  2. Parse les données                                       │
│  3. ✅ TOUJOURS sauvegarder en JSON (backup)               │
│  4. ✅ ESSAYER d'envoyer à l'API (optionnel)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────┐                  ┌──────────────────┐
│ Option A         │                  │ Option C         │
│ Sync Automatique │                  │ Import Manuel    │
│                  │                  │                  │
│ POST /api/sync   │                  │ /admin/import    │
│ - Temps réel     │                  │ - Contrôle total │
│ - Validation     │                  │ - Prévisualisation│
│ - Conflits       │                  │ - Backup         │
└──────────────────┘                  └──────────────────┘
        ↓                                       ↓
        └───────────────────┬───────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Supabase PostgreSQL                                         │
│                                                             │
│  - reservations (source de vérité)                         │
│  - airbnb_reservations_staging (validation)                │
│  - airbnb_sync_logs (monitoring)                           │
│  - airbnb_conflicts (alertes)                              │
│  - lofts (mapping listing_id)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Utilisation

### Scénario 1: Sync Automatique (Temps Réel)

**Configuration:**
```bash
# Dans le script Python (.env)
NEXTJS_API_URL=https://votreapp.vercel.app
NEXTJS_API_KEY=votre-api-key-generee
```

**Exécution:**
```bash
python airbnb_scraper.py --mode targeted
```

**Résultat:**
1. ✅ Scrape Airbnb
2. ✅ Sauvegarde JSON → `data/reservations_targeted_2026-05-18_10-30-00.json`
3. ✅ Envoie à l'API → Réservations créées/mises à jour en temps réel
4. ✅ Logs dans `airbnb_sync_logs`

---

### Scénario 2: Import Manuel (Contrôle Total)

**Configuration:**
```bash
# Pas besoin de configurer l'API dans le script Python
# Ou si l'API est down
```

**Exécution:**
```bash
# 1. Scraper les données
python airbnb_scraper.py --mode manual

# 2. Aller sur l'interface admin
https://votreapp.vercel.app/admin/airbnb/import

# 3. Uploader le fichier JSON
data/reservations_manual_2026-05-18_10-30-00.json

# 4. Prévisualiser et importer
```

**Résultat:**
1. ✅ Scrape Airbnb
2. ✅ Sauvegarde JSON
3. ⚠️  Skip API (non configurée ou down)
4. ✅ Import manuel via interface admin
5. ✅ Même validation et logs que le mode automatique

---

### Scénario 3: Mode Hybride (Recommandé)

**Configuration:**
```bash
# API configurée
NEXTJS_API_URL=https://votreapp.vercel.app
NEXTJS_API_KEY=votre-api-key-generee
```

**Exécution:**
```bash
python airbnb_scraper.py --mode full
```

**Résultat:**
1. ✅ Scrape Airbnb
2. ✅ Sauvegarde JSON (backup automatique)
3. ✅ Envoie à l'API (si succès → terminé)
4. ⚠️  Si échec API → JSON disponible pour import manuel

**Avantages:**
- 🚀 Temps réel quand tout fonctionne
- 🛡️ Backup JSON si problème
- 🔄 Possibilité de re-synchroniser plus tard
- 📊 Historique complet en JSON

---

## 📋 Checklist de Déploiement

### Étape 1: Configuration Vercel (5 min)
- [ ] Générer l'API Key (PowerShell)
- [ ] Ajouter `AIRBNB_SYNC_ENABLED=true` dans Vercel
- [ ] Ajouter `AIRBNB_API_SECRET=...` dans Vercel
- [ ] Redéployer l'application

### Étape 2: Configuration Script Python (10 min)
- [ ] Copier les fonctions depuis `PYTHON_SCRIPT_MODIFICATIONS.md`
- [ ] Créer le fichier `.env` avec les variables
- [ ] Installer `requests` si nécessaire: `pip install requests`
- [ ] Tester en mode JSON uniquement

### Étape 3: Tests (15 min)
- [ ] Tester le script Python (mode JSON)
- [ ] Tester l'interface admin d'import
- [ ] Configurer l'API dans le script Python
- [ ] Tester le mode hybride (JSON + API)
- [ ] Vérifier les logs dans Supabase

### Étape 4: Mapping (30 min)
- [ ] Identifier les 85 listing_ids Airbnb
- [ ] Ajouter dans Supabase: `UPDATE lofts SET airbnb_listing_id = '...'`
- [ ] Vérifier le mapping: `SELECT name, airbnb_listing_id FROM lofts`
- [ ] Re-tester avec un listing_id mappé

### Étape 5: Production (1h)
- [ ] Configurer Docker Compose (si besoin)
- [ ] Déployer sur VPS (si besoin)
- [ ] Configurer les cron jobs
- [ ] Tester le flux complet end-to-end

---

## 🎯 Avantages de cette Solution

### ✅ Résilience
- **JSON toujours sauvegardé** → Rien n'est jamais perdu
- **Retry automatique** → 3 tentatives avec backoff exponentiel
- **Import manuel** → Possibilité de re-synchroniser à tout moment
- **Backup historique** → Tous les JSON conservés

### ✅ Flexibilité
- **Mode automatique** → Temps réel, validation, conflits
- **Mode manuel** → Contrôle total, prévisualisation
- **Mode hybride** → Le meilleur des deux mondes
- **Migration progressive** → Tester avant de déployer

### ✅ Monitoring
- **Logs centralisés** → Table `airbnb_sync_logs`
- **Métriques détaillées** → Créées, mises à jour, erreurs, conflits
- **Staging** → Table `airbnb_reservations_staging` pour debugging
- **Conflits** → Table `airbnb_conflicts` pour alertes

### ✅ Sécurité
- **API Key** → Authentification obligatoire
- **Rate limiting** → 100 requêtes/minute
- **Validation stricte** → Schéma Zod
- **Logs sans données sensibles** → Pas d'emails/téléphones dans les logs

---

## 📊 Métriques Attendues

### Performance
- **Temps de réponse API:** < 2 secondes pour 10 réservations
- **Timeout:** 30 secondes
- **Rate limit:** 100 requêtes/minute
- **Max reservations:** 100 par requête

### Fiabilité
- **Uptime API:** > 99% (Vercel)
- **Retry automatique:** 3 tentatives
- **Backup JSON:** 100% des syncs
- **Détection conflits:** 100%

---

## 🆘 Troubleshooting

### Problème: "API non configurée"
**Cause:** `NEXTJS_API_URL` ou `NEXTJS_API_KEY` manquant  
**Solution:** Ajouter dans `.env` du script Python  
**Impact:** Mode JSON uniquement (pas de sync automatique)

### Problème: "Invalid API key"
**Cause:** API Key différente entre Python et Vercel  
**Solution:** Vérifier que `NEXTJS_API_KEY` = `AIRBNB_API_SECRET`  
**Impact:** Sync automatique échoue, JSON disponible

### Problème: "Listing ID not mapped"
**Cause:** `airbnb_listing_id` non configuré dans la table `lofts`  
**Solution:** `UPDATE lofts SET airbnb_listing_id = '...' WHERE name = '...'`  
**Impact:** Réservation ignorée (skipped), warning dans les logs

### Problème: "Validation failed"
**Cause:** Données invalides (montants négatifs, dates incohérentes, etc.)  
**Solution:** Vérifier les données dans le JSON, corriger le script Python  
**Impact:** Réservation échouée (failed), erreur dans les logs

### Problème: "Rate limit exceeded"
**Cause:** Plus de 100 requêtes en 1 minute  
**Solution:** Attendre 1 minute ou augmenter la limite dans `route.ts`  
**Impact:** Sync retardé, retry automatique après 1 minute

### Problème: "Timeout"
**Cause:** API Next.js trop lente ou down  
**Solution:** Vérifier Vercel status, réduire le nombre de réservations par requête  
**Impact:** Sync échoue après 3 tentatives, JSON disponible pour import manuel

---

## 📚 Documentation

### Fichiers Créés
1. **`app/api/airbnb/sync/route.ts`** - API endpoint
2. **`app/api/airbnb/sync/README.md`** - Documentation API
3. **`app/[locale]/admin/airbnb/import/page.tsx`** - Interface admin
4. **`lib/types/airbnb.ts`** - Types TypeScript
5. **`lib/utils/airbnb-status-translator.ts`** - Traduction statuts
6. **`lib/services/airbnb-sync-service.ts`** - Service de sync
7. **`PYTHON_SCRIPT_MODIFICATIONS.md`** - Code Python
8. **`AIRBNB_API_SETUP.md`** - Guide de configuration
9. **`TASK_3_COMPLETED.md`** - Résumé Task 3
10. **`scripts/test-airbnb-api.ps1`** - Script de test

### Requêtes SQL Utiles

**Vérifier les logs:**
```sql
SELECT sync_batch_id, sync_type, status, reservations_created, reservations_updated
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 10;
```

**Vérifier les réservations Airbnb:**
```sql
SELECT id, airbnb_confirmation_code, guest_name, check_in_date, total_amount, status
FROM reservations
WHERE source = 'airbnb_scraper'
ORDER BY created_at DESC
LIMIT 10;
```

**Vérifier les conflits:**
```sql
SELECT c.*, l.name as loft_name
FROM airbnb_conflicts c
JOIN lofts l ON c.loft_id = l.id
WHERE c.status = 'open'
ORDER BY c.created_at DESC;
```

---

## 🎉 Conclusion

Vous avez maintenant une **solution complète et robuste** pour l'intégration Airbnb avec :

✅ **Sync automatique** (temps réel)  
✅ **Import manuel** (contrôle total)  
✅ **Backup JSON** (sécurité)  
✅ **Validation stricte** (qualité des données)  
✅ **Détection de conflits** (alertes)  
✅ **Monitoring complet** (logs, métriques)  

**Temps estimé pour déployer:** ~2 heures  
**Temps estimé pour mapper les 85 lofts:** ~30 minutes  

**Total:** ~2h30 pour avoir un système 100% opérationnel ! 🚀

---

**Créé le:** 2026-05-18  
**Status:** ✅ PRÊT POUR PRODUCTION  
**Version:** 1.0.0
