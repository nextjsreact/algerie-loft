# 🚀 Exécution de la Migration - Instructions

## ⚠️ IMPORTANT
La migration automatique a échoué à cause d'un problème de connexion.
Vous devez exécuter les scripts SQL **manuellement** dans Supabase SQL Editor.

## 📝 Étapes à suivre

### 1. Ouvrir Supabase SQL Editor
1. Allez sur https://supabase.com
2. Ouvrez votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche

### 2. Exécuter les scripts dans l'ordre

#### Script 1: Créer la table
```
Fichier: 01-create-owners-table.sql
```
- Copiez tout le contenu du fichier
- Collez dans SQL Editor
- Cliquez sur "Run"
- ✅ Vérifiez que vous voyez: "Table owners créée avec succès!"

#### Script 2: Migrer les données
```
Fichier: 02-migrate-data.sql
```
- Copiez tout le contenu du fichier
- Collez dans SQL Editor
- Cliquez sur "Run"
- ✅ Vérifiez les comptages:
  - loft_owners_count: 18
  - partner_profiles_count: 8
  - owners_count: 26

#### Script 3: Mettre à jour la table lofts
```
Fichier: 03-update-lofts-table.sql
```
- Copiez tout le contenu du fichier
- Collez dans SQL Editor
- Cliquez sur "Run"
- ✅ Vérifiez que new_owner_id est rempli pour tous les lofts

#### Script 4: Ajouter les politiques RLS
```
Fichier: 04-add-rls-policies.sql
```
- Copiez tout le contenu du fichier
- Collez dans SQL Editor
- Cliquez sur "Run"
- ✅ Vérifiez: "Politiques RLS ajoutées avec succès!"

### 3. Vérification finale

Exécutez cette requête dans SQL Editor:
```sql
-- Vérifier que tout est OK
SELECT 
  'Migration réussie!' as status,
  (SELECT COUNT(*) FROM owners) as total_owners,
  (SELECT COUNT(*) FROM owners WHERE user_id IS NOT NULL) as with_user_account,
  (SELECT COUNT(*) FROM owners WHERE user_id IS NULL) as without_user_account,
  (SELECT COUNT(*) FROM lofts WHERE new_owner_id IS NOT NULL) as lofts_migrated;
```

Résultat attendu:
- total_owners: 26
- with_user_account: 8
- without_user_account: 18
- lofts_migrated: (nombre de vos lofts)

## 4. Mise à jour du code

Une fois la migration terminée, je mettrai à jour le code pour utiliser la nouvelle table `owners`.

## ❓ Besoin d'aide?

Si vous rencontrez un problème:
1. Copiez le message d'erreur
2. Dites-moi à quelle étape vous êtes
3. Je vous aiderai à résoudre le problème

## 📞 Prêt?

Dites-moi quand vous avez terminé les 4 scripts, et je mettrai à jour le code! 🚀
