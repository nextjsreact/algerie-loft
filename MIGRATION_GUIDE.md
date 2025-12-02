# 🎯 Guide de Migration: Table Unifiée "owners"

## Objectif
Créer UNE SEULE table `owners` qui remplace `loft_owners` et `partner_profiles`.

## 📊 Situation Actuelle

### Problèmes:
- ❌ 2 tables parallèles (`loft_owners` + `partner_profiles`)
- ❌ Confusion dans le code
- ❌ Pas de dashboard pour les propriétaires de `loft_owners`
- ❌ Duplication de logique

### Données:
- `loft_owners`: 18 enregistrements
- `partner_profiles`: 8 enregistrements
- Total: 26 propriétaires à migrer

## ✅ Solution: Table Unifiée "owners"

### Structure complète:
```sql
owners (
  -- Identifiants
  id, user_id
  
  -- Informations de base
  name, email, phone, address
  
  -- Business
  business_name, business_type, ownership_type, tax_id
  
  -- Vérification
  verification_status, verification_documents, portfolio_description
  
  -- Bancaire
  bank_details
  
  -- Métadonnées
  created_at, updated_at
)
```

## 🚀 Étapes de Migration

### Phase 1: Préparation (SANS RISQUE)
```bash
# 1. Backup de la base de données
# Faites un backup complet avant de commencer!

# 2. Exécuter l'analyse
node analyze-table-structures.cjs
```

### Phase 2: Création et Migration (RÉVERSIBLE)
```sql
# Exécuter le script de migration
# Fichier: UNIFIED_OWNERS_MIGRATION.sql

-- Étapes 1-3: Créer la table et migrer les données
-- ✅ SANS DANGER: Les anciennes tables restent intactes
```

### Phase 3: Vérification
```sql
-- Vérifier que toutes les données sont migrées
SELECT * FROM owners ORDER BY created_at;

-- Vérifier les comptages
SELECT 'loft_owners' as source, COUNT(*) FROM loft_owners
UNION ALL
SELECT 'partner_profiles', COUNT(*) FROM partner_profiles
UNION ALL
SELECT 'owners', COUNT(*) FROM owners;

-- Résultat attendu:
-- loft_owners: 18
-- partner_profiles: 8
-- owners: 26
```

### Phase 4: Mise à Jour du Code

#### 1. Modifier `app/actions/owners.ts`
```typescript
// AVANT
.from("loft_owners")

// APRÈS
.from("owners")
```

#### 2. Modifier les requêtes de lofts
```typescript
// AVANT
.select('*, owner:loft_owners(name)')

// APRÈS
.select('*, owner:owners(name)')
```

#### 3. Mettre à jour les types
```typescript
// Dans lib/types.ts
export type Owner = {
  id: string
  user_id?: string
  name: string
  email?: string
  phone?: string
  address?: string
  business_name?: string
  business_type?: 'individual' | 'company'
  ownership_type?: 'company' | 'third_party'
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended'
  // ... autres champs
}
```

### Phase 5: Tests
```bash
# 1. Tester la création d'un loft
# - La liste des propriétaires doit afficher les 26 propriétaires

# 2. Tester l'édition d'un loft
# - Le propriétaire actuel doit être sélectionné

# 3. Tester l'affichage d'un loft
# - Le nom du propriétaire doit s'afficher correctement

# 4. Tester le dashboard partenaire
# - Les partenaires doivent pouvoir se connecter
# - Leurs statistiques doivent s'afficher
```

### Phase 6: Finalisation (IRRÉVERSIBLE!)
```sql
-- ⚠️ ATTENTION: Cette étape est IRRÉVERSIBLE!
-- Exécuter SEULEMENT après avoir vérifié que tout fonctionne

-- 1. Basculer vers la nouvelle colonne
ALTER TABLE lofts DROP COLUMN owner_id;
ALTER TABLE lofts RENAME COLUMN new_owner_id TO owner_id;
ALTER TABLE lofts DROP COLUMN partner_id;

-- 2. Supprimer les anciennes tables
DROP TABLE loft_owners CASCADE;
DROP TABLE partner_profiles CASCADE;
DROP TABLE partners CASCADE;
```

## 📝 Checklist de Migration

### Avant la migration:
- [ ] Backup complet de la base de données
- [ ] Analyser les structures avec le script
- [ ] Lire ce guide en entier

### Pendant la migration:
- [ ] Exécuter UNIFIED_OWNERS_MIGRATION.sql (étapes 1-5)
- [ ] Vérifier les comptages (26 propriétaires)
- [ ] Vérifier que new_owner_id est rempli dans lofts

### Après la migration:
- [ ] Mettre à jour app/actions/owners.ts
- [ ] Mettre à jour toutes les requêtes SQL
- [ ] Mettre à jour les types TypeScript
- [ ] Tester création/édition/affichage de lofts
- [ ] Tester le dashboard partenaire
- [ ] Tester les rapports financiers

### Finalisation (optionnelle):
- [ ] Exécuter l'étape 6 du script SQL
- [ ] Supprimer les anciennes tables
- [ ] Nettoyer le code des références aux anciennes tables

## 🎉 Résultat Final

### Avantages:
- ✅ UNE SEULE table pour tous les propriétaires
- ✅ Tous les propriétaires peuvent avoir un dashboard
- ✅ Code simplifié et cohérent
- ✅ Pas de confusion entre les systèmes
- ✅ Facile à maintenir

### Structure:
```
owners (26 propriétaires)
  ├── 18 anciens loft_owners (verification_status: verified)
  └── 8 anciens partner_profiles (verification_status: selon statut)
```

## ⚠️ Points d'Attention

1. **user_id optionnel**: Les propriétaires internes n'ont pas forcément de compte utilisateur
2. **verification_status**: Les anciens loft_owners sont automatiquement "verified"
3. **Compatibilité**: Pendant la transition, les deux systèmes coexistent
4. **Rollback**: Possible tant que l'étape 6 n'est pas exécutée

## 🆘 En cas de problème

Si quelque chose ne fonctionne pas:
1. NE PAS exécuter l'étape 6 (suppression des tables)
2. Les anciennes tables sont toujours là
3. Vous pouvez revenir en arrière en changeant le code
4. Contactez-moi pour assistance

## 📞 Support

Pour toute question sur cette migration, demandez-moi!
