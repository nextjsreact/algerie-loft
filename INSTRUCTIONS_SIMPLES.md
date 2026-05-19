# 🚀 Instructions Simples - Test API Airbnb

## ⚡ 2 Étapes Seulement

### **ÉTAPE 1 : Démarrer le serveur** (Terminal 1)

```powershell
npm run dev
```

**Attendez ce message :**
```
✓ Ready in 3.2s
○ Local: http://localhost:3000
```

**⚠️ NE FERMEZ PAS CE TERMINAL !**

---

### **ÉTAPE 2 : Tester l'API** (Terminal 2 - NOUVEAU)

Ouvrez un **NOUVEAU terminal** (ne fermez pas le premier) :

```powershell
.\test-airbnb-sync.ps1
```

---

## ✅ Résultat Attendu

```
============================================
Test de l'endpoint Airbnb Sync API
============================================

Succes!

Metriques:
  - Processed: 1
  - Created: 0
  - Updated: 1
  - Skipped: 0
  - Failed: 0
  - Conflicts: 0

Sync Batch ID: 550e8400-...

============================================
Test termine
============================================
```

---

## ❌ Si Erreur 401

**Cause :** Le serveur Next.js n'est pas démarré

**Solution :**
1. Vérifiez que le Terminal 1 affiche "Ready"
2. Si non, lancez `npm run dev` dans le Terminal 1
3. Attendez "Ready"
4. Relancez le test dans le Terminal 2

---

## 📊 Vérifier dans la Base de Données

Après le test réussi :

1. Ouvrir : https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk
2. SQL Editor
3. Exécuter :

```sql
-- Dernière réservation
SELECT 
  guest_name,
  check_in_date,
  airbnb_confirmation_code,
  synced_at
FROM reservations
WHERE source = 'airbnb_scraper'
ORDER BY updated_at DESC
LIMIT 1;

-- Dernier log
SELECT 
  status,
  reservations_updated,
  started_at
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 1;
```

---

## ✅ C'est Tout !

Si le test passe, votre API est **100% opérationnelle** !

**Prochaine étape :** Mapper plus de lofts (voir `configure_airbnb_mapping.sql`)
