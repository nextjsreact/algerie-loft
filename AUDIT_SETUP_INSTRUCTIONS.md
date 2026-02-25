# Instructions pour activer l'audit

## Problème identifié

La fonction `set_audit_user_context` existe dans le schéma `audit` mais Supabase RPC ne peut appeler que les fonctions du schéma `public`.

## Solution

Créer des fonctions wrapper dans le schéma `public` qui appellent les fonctions du schéma `audit`.

## Étapes à suivre

### 1. Aller dans Supabase Dashboard

1. Connecte-toi à https://supabase.com
2. Sélectionne ton projet
3. Va dans **SQL Editor** (dans le menu de gauche)

### 2. Exécuter le script SQL

Copie et colle ce script dans l'éditeur SQL et clique sur **Run**:

```sql
-- Create wrapper functions in public schema that call audit schema functions
-- This is needed because Supabase RPC only works with public schema

-- Wrapper for set_audit_user_context
CREATE OR REPLACE FUNCTION public.set_audit_user_context(
    p_user_id UUID,
    p_user_email VARCHAR(255) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    PERFORM audit.set_audit_user_context(p_user_id, p_user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wrapper for clear_audit_user_context
CREATE OR REPLACE FUNCTION public.clear_audit_user_context()
RETURNS VOID AS $$
BEGIN
    PERFORM audit.clear_audit_user_context();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.set_audit_user_context(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_audit_user_context() TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.set_audit_user_context IS 'Wrapper function to set audit context - calls audit.set_audit_user_context';
COMMENT ON FUNCTION public.clear_audit_user_context IS 'Wrapper function to clear audit context - calls audit.clear_audit_user_context';
```

### 3. Vérifier que ça fonctionne

Après avoir exécuté le script, visite cette URL pour vérifier:

```
https://www.loftalgerie.com/api/test-audit
```

Tu devrais voir `"success": true` au lieu de l'erreur.

### 4. Tester la modification de loft

Une fois que l'audit fonctionne, teste la modification d'un loft:

```
https://www.loftalgerie.com/api/test-loft-update?loftId=05a9efd5-bf4f-45d8-aa9e-8c14a61db7a6
```

Tu devrais voir:
- `"success": true`
- `"updateSuccess": true`
- `"auditLogCreated": true`

### 5. Tester en production

Essaie de modifier un loft normalement via l'interface. La modification devrait maintenant fonctionner ET être enregistrée dans l'audit.

## Pourquoi ce problème?

- Les fonctions d'audit ont été créées dans le schéma `audit` pour une meilleure organisation
- Supabase RPC (`supabase.rpc()`) ne peut appeler que les fonctions du schéma `public`
- La solution est de créer des fonctions wrapper dans `public` qui appellent les fonctions dans `audit`

## Fichiers modifiés

- `utils/supabase/server-with-audit.ts` - Appelle `set_audit_user_context` (schéma public)
- `database/create-public-audit-functions.sql` - Script SQL à exécuter
- `app/api/setup-audit-functions/route.ts` - API helper pour obtenir le script
