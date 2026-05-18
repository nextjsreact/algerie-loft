# 🔒 Sécurité des Environnements - Guide Important

## 🚨 SITUATION ACTUELLE

### ⚠️ ALERTE : Vous travaillez sur la PRODUCTION !

**Fichier actif :** `.env.local`  
**Base de données :** `mhngbluefyucoesgcjoy.supabase.co` (PRODUCTION)  
**Risque :** Toutes les modifications affectent directement les données réelles !

---

## 📊 Environnements Disponibles

### 1. 🔴 PRODUCTION (`.env.local` - ACTUELLEMENT ACTIF)
- **URL Supabase :** `mhngbluefyucoesgcjoy.supabase.co`
- **Usage :** Données réelles, clients réels
- **Risque :** ⚠️ ÉLEVÉ - Modifications irréversibles
- **Quand l'utiliser :** Uniquement pour déploiement final validé

### 2. 🟢 DÉVELOPPEMENT (`.env.development` - RECOMMANDÉ)
- **URL Supabase :** `wtcbyjdwjrrqyzpvjfze.supabase.co`
- **Usage :** Tests, développement, expérimentation
- **Risque :** ✅ FAIBLE - Environnement isolé
- **Quand l'utiliser :** Pour tous les développements et tests

### 3. 🟡 TEST (`.env.test`)
- **URL Supabase :** `mhngbluefyucoesgcjoy.supabase.co` (⚠️ Pointe vers PRODUCTION)
- **Usage :** Tests automatisés
- **Risque :** ⚠️ MOYEN - Partage la base de production
- **Note :** À reconfigurer pour pointer vers l'environnement de développement

---

## 🔄 Comment Basculer vers l'Environnement de Développement

### Option 1 : Renommer les fichiers (RECOMMANDÉ)

```bash
# 1. Sauvegarder la configuration de production
copy .env.local .env.production.backup

# 2. Activer l'environnement de développement
copy .env.development .env.local

# 3. Redémarrer le serveur Next.js
# Arrêter le serveur actuel (Ctrl+C dans le terminal)
npm run dev
```

### Option 2 : Utiliser NODE_ENV (Alternative)

```bash
# Démarrer en mode développement
set NODE_ENV=development
npm run dev
```

**Note :** Next.js charge automatiquement `.env.development` si `NODE_ENV=development`

---

## ✅ Vérification de l'Environnement Actif

### Méthode 1 : Vérifier dans le code
Ajoutez temporairement dans votre page :
```typescript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Environment:', process.env.NODE_ENV);
```

### Méthode 2 : Vérifier dans Supabase
1. Ouvrez https://supabase.com/dashboard
2. Vérifiez quel projet est actif :
   - **Production :** `mhngbluefyucoesgcjoy` (Algerie Loft Production)
   - **Développement :** `wtcbyjdwjrrqyzpvjfze` (Algerie Loft Dev)

---

## 🛡️ Mesures de Sécurité Recommandées

### 1. ✅ Toujours Développer en DEV
- Utilisez `.env.development` pour tous les tests
- Ne basculez vers `.env.local` (production) que pour le déploiement final

### 2. ✅ Sauvegardes Avant Modifications
```bash
# Créer une sauvegarde de la base de production
# Via Supabase Dashboard > Database > Backups
```

### 3. ✅ Tester en DEV Avant PROD
1. Développer et tester en environnement de développement
2. Valider toutes les fonctionnalités
3. Créer une sauvegarde de production
4. Déployer en production
5. Vérifier immédiatement après déploiement

### 4. ✅ Utiliser des Données de Test
- Créez des lofts de test avec des noms comme "TEST - Star Loft"
- Utilisez des emails de test comme "test@example.com"
- Utilisez des listing_ids de test comme "99999999"

### 5. ✅ Activer les Logs en DEV
```env
# Dans .env.development
NEXT_PUBLIC_DEBUG_MODE=true
LOG_LEVEL=debug
```

---

## 🔧 Configuration Recommandée pour l'Intégration Airbnb

### Environnement de Développement

1. **Créer un loft de test dans la base DEV**
```sql
-- Exécuter dans Supabase DEV (wtcbyjdwjrrqyzpvjfze)
INSERT INTO lofts (name, address, airbnb_listing_id, status)
VALUES (
  'TEST - Star Loft',
  'Adresse de test',
  '12345678',
  'active'
);
```

2. **Tester l'import avec des données fictives**
- Utilisez `test-data/reservations_test.json`
- Vérifiez que tout fonctionne correctement
- Testez les cas d'erreur

3. **Valider les migrations SQL**
- Appliquez les migrations 005-009 en DEV d'abord
- Vérifiez qu'elles fonctionnent correctement
- Puis appliquez-les en PROD

### Environnement de Production

1. **Créer une sauvegarde complète**
2. **Appliquer les migrations SQL validées**
3. **Mapper les vrais listing_ids Airbnb**
4. **Tester avec 1-2 réservations réelles**
5. **Activer l'import automatique**

---

## 📋 Checklist Avant Déploiement en Production

- [ ] Toutes les fonctionnalités testées en DEV
- [ ] Aucune erreur dans les logs
- [ ] Sauvegarde de la base de production créée
- [ ] Migrations SQL validées en DEV
- [ ] Documentation à jour
- [ ] Plan de rollback préparé
- [ ] Monitoring activé (Sentry, logs)
- [ ] Tests avec données réelles en DEV
- [ ] Validation par l'équipe

---

## 🚨 Que Faire en Cas de Problème en Production

### 1. Arrêter Immédiatement
```bash
# Désactiver l'intégration Airbnb
# Dans .env.local
AIRBNB_SYNC_ENABLED=false
```

### 2. Restaurer la Sauvegarde
```bash
# Via Supabase Dashboard > Database > Backups
# Sélectionner la sauvegarde la plus récente avant le problème
```

### 3. Analyser les Logs
```sql
-- Vérifier les logs de synchronisation
SELECT * FROM airbnb_sync_logs
ORDER BY created_at DESC
LIMIT 10;

-- Vérifier les erreurs dans staging
SELECT * FROM airbnb_reservations_staging
WHERE validation_status = 'invalid'
OR reconciliation_status = 'failed'
ORDER BY created_at DESC;
```

### 4. Nettoyer les Données de Test
```sql
-- Supprimer les réservations de test en production
DELETE FROM reservations
WHERE airbnb_confirmation_code LIKE 'HMTEST%';

-- Supprimer les entrées staging de test
DELETE FROM airbnb_reservations_staging
WHERE airbnb_id LIKE 'HMTEST%';
```

---

## 📝 Actions Immédiates Recommandées

### 1. 🔴 URGENT : Basculer vers l'environnement de développement

```bash
# Dans le terminal PowerShell
cd C:\Users\SERVICE-INFO\IA\algerie-loft

# Sauvegarder la config actuelle
copy .env.local .env.production.backup

# Activer l'environnement de développement
copy .env.development .env.local

# Redémarrer le serveur
# Arrêter le serveur actuel (Ctrl+C)
npm run dev
```

### 2. ✅ Nettoyer les données de test en production

```sql
-- Exécuter dans Supabase PRODUCTION (mhngbluefyucoesgcjoy)
-- Supprimer les 2 réservations de test créées
DELETE FROM reservations
WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002');

-- Supprimer les entrées staging de test
DELETE FROM airbnb_reservations_staging
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3';

-- Supprimer les conflits de test
DELETE FROM airbnb_conflicts
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Supprimer les logs de test
DELETE FROM airbnb_sync_logs
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3';
```

### 3. ✅ Reconfigurer l'environnement de test

Modifier `.env.test` pour pointer vers l'environnement de développement au lieu de la production.

---

## 🎯 Résumé

| Action | Priorité | Statut |
|--------|----------|--------|
| Basculer vers DEV | 🔴 URGENT | ⏳ À faire |
| Nettoyer les données de test en PROD | 🔴 URGENT | ⏳ À faire |
| Tester en DEV | 🟡 Important | ⏳ À faire |
| Valider avant PROD | 🟡 Important | ⏳ À faire |
| Créer sauvegarde PROD | 🟢 Recommandé | ⏳ À faire |

---

**Auteur :** Kiro AI Assistant  
**Date :** 2026-05-18  
**Version :** 1.0.0
