# Configuration de la Vue Audit Logs

## 🔍 Problème

Supabase REST API n'expose que les schémas `public` et `graphql_public` par défaut. Le schéma `audit` n'est pas accessible via l'API REST.

**Erreur:** `The schema must be one of the following: public, graphql_public`

## ✅ Solution

Créer une **vue** dans le schéma `public` qui pointe vers `audit.audit_logs`. Cela permet d'accéder aux logs d'audit via l'API REST tout en gardant les données dans le schéma `audit`.

## 🚀 Installation

### Étape 1: Créer la vue

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez le contenu de `database/migrations/create-audit-logs-view.sql`
3. Exécutez le script (`Ctrl+Enter`)

### Étape 2: Redémarrer le serveur

```bash
# Ctrl+C pour arrêter
npm run dev
```

## 📊 Ce qui est créé

### Vue: `public.audit_logs_view`

Une vue en lecture seule qui expose toutes les colonnes de `audit.audit_logs`:
- `id` - Identifiant unique
- `table_name` - Table modifiée
- `record_id` - ID de l'enregistrement
- `action` - Type d'action (INSERT, UPDATE, DELETE)
- `old_values` - Valeurs avant modification
- `new_values` - Valeurs après modification
- `changed_fields` - Champs modifiés
- `user_id` - Utilisateur ayant effectué l'action
- `user_email` - Email de l'utilisateur
- `ip_address` - Adresse IP
- `user_agent` - Navigateur/client
- `timestamp` - Date et heure
- `created_at` - Date de création

### Permissions

- ✅ Lecture autorisée pour les utilisateurs authentifiés
- ✅ RLS activé (seulement les superusers)
- ❌ Pas d'écriture (vue en lecture seule)

## 🔐 Sécurité

### RLS (Row Level Security)

La vue hérite des politiques RLS de la table sous-jacente:
```sql
CREATE POLICY "Superusers can view audit logs via view"
  ON audit.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );
```

### Insertions

Les insertions se font toujours directement dans `audit.audit_logs` via:
- Triggers automatiques (pour les modifications de tables)
- Insertions manuelles server-side (APIs admin)

## 📝 Utilisation dans le Code

### Avant (ne fonctionnait pas):
```typescript
// ❌ Schéma audit non exposé via REST API
supabase.schema('audit').from('audit_logs')
```

### Après (fonctionne):
```typescript
// ✅ Lecture via la vue
supabase.from('audit_logs_view').select('*')

// ✅ Écriture directe (server-side uniquement)
supabase.schema('audit').from('audit_logs').insert(...)
```

## 🎯 Fichiers Modifiés

### APIs utilisant la vue (lecture):
1. `app/api/superuser/dashboard/route.ts`
2. `app/api/superuser/audit/route.ts`
3. `app/api/superuser/audit/export/route.ts`
4. `lib/services/audit-service.ts`

### APIs utilisant le schéma direct (écriture):
1. `app/api/admin/disputes/resolve/route.ts`
2. `app/api/admin/property-assignments/bulk/route.ts`
3. `app/api/admin/property-assignments/transfer/route.ts`
4. `app/api/admin/disputes/messages/route.ts`
5. `app/api/admin/lofts/[id]/route.ts`
6. `app/api/admin/lofts/route.ts`

## ✅ Vérification

### 1. Vérifier que la vue existe:
```sql
SELECT * FROM public.audit_logs_view LIMIT 5;
```

### 2. Tester l'API:
```bash
# Dashboard
curl http://localhost:3000/api/superuser/dashboard

# Audit logs
curl http://localhost:3000/api/superuser/audit?page=1&limit=10
```

### 3. Console:
- ✅ Pas d'erreur "schema must be one of"
- ✅ Dashboard charge les logs
- ✅ Interface d'audit fonctionne

## 🔧 Dépannage

### Erreur: "permission denied for view audit_logs_view"
```sql
-- Vérifier les permissions
GRANT SELECT ON public.audit_logs_view TO authenticated;
```

### Erreur: "view does not exist"
```sql
-- Recréer la vue
DROP VIEW IF EXISTS public.audit_logs_view CASCADE;
CREATE VIEW public.audit_logs_view AS
SELECT * FROM audit.audit_logs;
```

### Les insertions ne fonctionnent pas
Les insertions utilisent `.schema('audit')` qui fonctionne en server-side. Si ça ne marche pas:
```sql
-- Vérifier les permissions sur la table
GRANT INSERT ON audit.audit_logs TO authenticated;
```

## 💡 Avantages de cette Approche

1. **Séparation des données** - Les logs restent dans le schéma `audit`
2. **API REST compatible** - La vue est accessible via Supabase REST API
3. **Sécurité maintenue** - RLS fonctionne sur la vue
4. **Performance** - Pas de copie de données, juste une vue
5. **Flexibilité** - Peut ajouter des colonnes calculées dans la vue

## 🎉 Résultat Final

- ✅ Lecture des logs via `audit_logs_view` (REST API)
- ✅ Écriture des logs via `audit.audit_logs` (server-side)
- ✅ Données stockées dans le schéma `audit`
- ✅ Sécurité RLS maintenue
- ✅ Dashboard superuser fonctionnel
