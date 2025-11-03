# 🚀 Étapes d'Exécution - Correction Inscription Client

## ⚠️ Important
Exécutez ces scripts **un par un** dans l'ordre indiqué dans votre **Supabase SQL Editor**.

## 📋 Étape 1: Corriger la Table Customers

1. Ouvrez votre **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Copiez et exécutez le contenu de `database/fix-customers-simple.sql`

```sql
-- Copiez tout le contenu du fichier database/fix-customers-simple.sql
-- et exécutez-le dans Supabase SQL Editor
```

**Résultat attendu :** Message "Customers table recreated successfully! ✅"

## 📋 Étape 2: Installer le Trigger de Synchronisation

1. Dans le même **SQL Editor**
2. Copiez et exécutez le contenu de `database/auto-sync-simple.sql`

```sql
-- Copiez tout le contenu du fichier database/auto-sync-simple.sql
-- et exécutez-le dans Supabase SQL Editor
```

**Résultat attendu :** Message "Auto-sync trigger created successfully! ✅"

## 📋 Étape 3: Vérifier l'Installation

Exécutez cette requête pour vérifier que tout est en place :

```sql
-- Vérifier la structure de la table customers
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier que le trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'sync_client_customers_trigger';
```

**Résultat attendu :**
- Liste des colonnes de la table customers
- Une ligne montrant le trigger `sync_client_customers_trigger`

## 📋 Étape 4: Tester l'Inscription

1. Redémarrez votre application Next.js :
   ```bash
   npm run dev
   ```

2. Essayez de vous inscrire en tant que nouveau client

3. L'inscription devrait maintenant fonctionner sans erreur !

## 🔍 En Cas de Problème

Si vous rencontrez encore des erreurs :

1. **Vérifiez les logs Supabase :**
   - Allez dans Supabase Dashboard > Logs
   - Regardez les erreurs récentes

2. **Vérifiez les politiques RLS :**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'customers';
   ```

3. **Testez manuellement l'insertion :**
   ```sql
   -- Test d'insertion manuelle (remplacez les valeurs)
   INSERT INTO customers (
       id, first_name, last_name, email, status
   ) VALUES (
       gen_random_uuid(), 'Test', 'User', 'test@example.com', 'prospect'
   );
   ```

## ✅ Vérification Finale

Une fois les étapes terminées, vous devriez avoir :

- ✅ Table `customers` avec la bonne structure
- ✅ Trigger `sync_client_customers_trigger` actif
- ✅ Politiques RLS configurées
- ✅ Inscription client fonctionnelle

## 📞 Support

Si le problème persiste, vérifiez :
1. Les variables d'environnement Supabase
2. Les permissions de la base de données
3. Les logs d'erreur détaillés