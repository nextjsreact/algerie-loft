# 🚀 FINALISER LA MIGRATION - INSTRUCTIONS

## ⚠️ IMPORTANT
Cette opération est **IRRÉVERSIBLE** mais nécessaire pour nettoyer la base de données.

---

## 📋 Étape 1 : Ouvrir Supabase

1. Allez sur https://supabase.com/dashboard
2. Connectez-vous
3. Sélectionnez votre projet
4. Cliquez sur **SQL Editor** dans le menu de gauche

---

## 📋 Étape 2 : Copier le Script

Le script à exécuter se trouve dans le fichier : **`finalize-migration.sql`**

Ou copiez directement ce script :

```sql
-- =====================================================
-- FINALISATION DE LA MIGRATION
-- =====================================================

BEGIN;

-- Supprimer les anciennes colonnes
ALTER TABLE lofts DROP COLUMN IF EXISTS owner_id CASCADE;
ALTER TABLE lofts DROP COLUMN IF EXISTS partner_id CASCADE;

-- Renommer new_owner_id en owner_id
ALTER TABLE lofts RENAME COLUMN new_owner_id TO owner_id;

-- Supprimer les anciennes tables
DROP TABLE IF EXISTS loft_owners CASCADE;
DROP TABLE IF EXISTS partner_profiles CASCADE;
DROP TABLE IF EXISTS partners CASCADE;

-- Vérification
SELECT 
  '✅ MIGRATION FINALISÉE!' as status,
  (SELECT COUNT(*) FROM owners) as total_owners,
  (SELECT COUNT(*) FROM lofts) as total_lofts,
  (SELECT COUNT(*) FROM lofts WHERE owner_id IS NOT NULL) as lofts_with_owner;

COMMIT;
```

---

## 📋 Étape 3 : Exécuter

1. Collez le script dans SQL Editor
2. Cliquez sur **"Run"** (ou Ctrl+Enter)
3. Attendez la confirmation

---

## ✅ Résultat Attendu

Vous devriez voir :
```
✅ MIGRATION FINALISÉE!
total_owners: 26
total_lofts: 28
lofts_with_owner: 16
```

---

## 📋 Étape 4 : Après l'Exécution

**Revenez ici et dites-moi "C'est fait"**

Je vais alors :
1. ✅ Adapter la fonction `reactivate_partner` pour utiliser `owners`
2. ✅ Modifier l'interface admin pour utiliser `owners`
3. ✅ Mettre à jour tous les fichiers nécessaires

---

## 🆘 En Cas de Problème

Si vous voyez une erreur, **ne paniquez pas** :
- Copiez le message d'erreur
- Envoyez-le moi
- Je vous aiderai à résoudre

---

## 💾 Backup

Les backups existent déjà :
- `backup-loft-owners.json`
- `backup-partner-profiles.json`

En cas de problème, on peut restaurer.

---

**Prêt ? Exécutez le script dans Supabase et revenez me dire "C'est fait"!** 🚀
