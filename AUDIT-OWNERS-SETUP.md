# Configuration de l'Audit pour la Table Owners

## Résumé

La table `owners` n'était **PAS auditée** dans le système. Les modifications (INSERT, UPDATE, DELETE) sur les propriétaires n'étaient pas enregistrées dans les logs d'audit.

## Modifications Effectuées

### 1. Script SQL pour Ajouter les Triggers d'Audit
**Fichier**: `database/add-audit-triggers-owners.sql`

Ce script crée le trigger d'audit pour la table `owners`:
```sql
CREATE TRIGGER audit_trigger_owners
    AFTER INSERT OR UPDATE OR DELETE ON owners
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();
```

### 2. Mise à Jour du Type TypeScript
**Fichier**: `lib/types.ts`

Ajout de `'owners'` au type `AuditableTable`:
```typescript
export type AuditableTable = 'transactions' | 'tasks' | 'reservations' | 'lofts' | 'owners';
```

### 3. Mise à Jour de l'API d'Audit
**Fichiers modifiés**:
- `app/api/audit/logs/route.ts` - Ajout de 'owners' aux tables valides
- `app/api/audit/entity/[table]/[id]/route.ts` - Ajout de 'owners' aux tables valides

### 4. Mise à Jour des Composants UI
**Fichier**: `components/audit/audit-filters.tsx`

Ajout de 'owners' dans la liste des tables filtrables:
```typescript
const tableNames: Array<{ value: AuditableTable; label: string }> = [
  { value: 'transactions', label: t('tables.transactions') },
  { value: 'tasks', label: t('tables.tasks') },
  { value: 'reservations', label: t('tables.reservations') },
  { value: 'lofts', label: t('tables.lofts') },
  { value: 'owners', label: t('tables.owners') }
]
```

**Fichier**: `components/audit/audit-example.tsx`

Mise à jour de l'interface pour accepter 'owners' comme type d'entité.

### 5. Traductions
**Fichiers modifiés**:
- `messages/fr.json` - Ajout de "owners": "Propriétaire"
- `messages/en.json` - Ajout de "owners": "Owner"
- `messages/ar.json` - Ajout de "owners": "مالك"

### 6. Scripts de Vérification
**Fichier**: `scripts/check-audit-triggers-owners.sql`

Script pour vérifier si le trigger d'audit existe sur la table owners.

## Actions Requises

### 1. Exécuter le Script SQL sur Supabase
Vous devez exécuter le script suivant dans l'éditeur SQL de Supabase:

```sql
-- Fichier: database/add-audit-triggers-owners.sql

DROP TRIGGER IF EXISTS audit_trigger_owners ON owners;

CREATE TRIGGER audit_trigger_owners
    AFTER INSERT OR UPDATE OR DELETE ON owners
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();
```

### 2. Vérifier l'Installation
Après avoir exécuté le script, vérifiez avec:

```sql
-- Fichier: scripts/check-audit-triggers-owners.sql

SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'owners'
AND n.nspname = 'public'
AND NOT t.tgisinternal
ORDER BY t.tgname;
```

Vous devriez voir un trigger nommé `audit_trigger_owners`.

### 3. Tester l'Audit
Après avoir exécuté le script SQL:

1. Allez sur `/owners` et modifiez un propriétaire
2. Allez sur `/settings/audit`
3. Filtrez par table "Propriétaire" (owners)
4. Vous devriez voir les modifications enregistrées

## État Actuel des Tables Auditées

Avant cette modification:
- ✅ transactions
- ✅ tasks
- ✅ reservations
- ✅ lofts
- ❌ owners (NON audité)

Après cette modification (une fois le script SQL exécuté):
- ✅ transactions
- ✅ tasks
- ✅ reservations
- ✅ lofts
- ✅ owners (audité)

## Réponse à Votre Question

**Question**: Est-ce que dans /settings/audit, les mises à jour des propriétaires (modifier, effacer) sont auditées ou pas?

**Réponse**: NON, les modifications des propriétaires n'étaient PAS auditées. Le trigger d'audit n'existait pas sur la table `owners`. 

J'ai préparé tous les fichiers nécessaires pour activer l'audit sur cette table. Vous devez maintenant exécuter le script SQL `database/add-audit-triggers-owners.sql` dans Supabase pour activer l'audit des propriétaires.

## Prochaines Étapes

1. Ouvrez Supabase Dashboard
2. Allez dans SQL Editor
3. Exécutez le contenu du fichier `database/add-audit-triggers-owners.sql`
4. Testez en modifiant un propriétaire
5. Vérifiez dans `/settings/audit` que les modifications apparaissent
