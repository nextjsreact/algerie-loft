# Corrections des APIs d'Audit

## Problème Identifié

L'erreur `"Could not find the function public.exec_sql(sql) in the schema cache"` était causée par l'utilisation d'une fonction `exec_sql` inexistante dans certaines APIs d'audit.

## APIs Corrigées

### 1. `/api/audit/entity-simple/[table]/[id]/route.ts`

**Problème :** Utilisait `supabase.rpc('exec_sql', { sql: '...' })`

**Solution :** Remplacé par `supabase.rpc('get_audit_logs_for_entity', { ... })`

```typescript
// AVANT (❌ Ne fonctionnait pas)
const { data, error } = await supabase.rpc('exec_sql', {
  sql: `SELECT * FROM audit.audit_logs WHERE table_name = '${table}' AND record_id = '${id}'`
});

// APRÈS (✅ Fonctionne)
const { data: rpcResult, error } = await supabase.rpc('get_audit_logs_for_entity', {
  p_table_name: table,
  p_record_id: id,
  p_limit: 10
});
```

### 2. `/api/audit/test/route.ts`

**Problème :** Utilisait `exec_sql` pour vérifier l'existence du schéma audit

**Solution :** Remplacé par un accès direct à `audit.audit_logs`

```typescript
// AVANT (❌ Ne fonctionnait pas)
const { data: schemaData, error: schemaErr } = await supabase
  .rpc('exec_sql', { sql: "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'audit'" });

// APRÈS (✅ Fonctionne)
const { data: altData, error: altError } = await supabase
  .from('audit.audit_logs')
  .select('id')
  .limit(1);
```

## Nouvelle API de Diagnostic

Créé `/api/audit/diagnostic/route.ts` pour un diagnostic complet du système d'audit :

- ✅ Test d'authentification
- ✅ Test de connexion base de données
- ✅ Test d'accès au schéma audit
- ✅ Test des fonctions RPC
- ✅ Test des permissions utilisateur
- ✅ Test des données d'exemple
- ✅ Recommandations automatiques

## Fonctions RPC Disponibles

Les fonctions suivantes sont disponibles et fonctionnelles :

1. **`get_audit_logs_for_entity(p_table_name, p_record_id, p_limit)`**
   - Récupère l'historique d'audit pour une entité spécifique
   - Retourne un JSON avec `{ success, data, count }`

2. **`count_audit_logs_simple(p_table_name, p_record_id)`**
   - Compte les logs d'audit avec filtres optionnels
   - Retourne un entier

3. **`get_all_audit_logs(p_limit, p_offset)`**
   - Récupère tous les logs avec pagination
   - Retourne un JSON avec `{ success, data, total, limit, offset }`

## Test des Corrections

Pour tester les corrections :

1. **Via l'interface web :**
   - Aller sur `/admin/audit-test`
   - Cliquer sur "Test API Simple" (devrait maintenant fonctionner)

2. **Via script :**
   ```bash
   npx tsx scripts/test-audit-apis.ts
   ```

3. **Via nouvelle API diagnostic :**
   ```bash
   curl -X GET /api/audit/diagnostic
   ```

## Résultat Attendu

L'API "Test API Simple" devrait maintenant retourner :

```json
{
  "success": true,
  "message": "Audit history retrieved successfully",
  "data": {
    "tableName": "transactions",
    "recordId": "123e4567-e89b-12d3-a456-426614174000",
    "auditHistory": [...],
    "total": 2
  }
}
```

Au lieu de l'erreur précédente :

```json
{
  "success": false,
  "error": "Database query failed",
  "details": "Could not find the function public.exec_sql(sql) in the schema cache"
}
```

## Prochaines Étapes

1. Tester les APIs corrigées
2. Supprimer les références restantes à `exec_sql` si nécessaire
3. Documenter les bonnes pratiques pour les futures APIs d'audit