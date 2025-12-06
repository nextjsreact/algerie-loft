# 🔧 Fix : Ambiguïté des Colonnes

## ❌ Erreur

```
column reference "admin_notes" is ambiguous
```

## 🔍 Cause

Dans PostgreSQL, quand un paramètre de fonction a le même nom qu'une colonne de table, il y a ambiguïté.

**Exemple du problème :**
```sql
CREATE FUNCTION reactivate_owner_partner(
    owner_id UUID,
    admin_notes TEXT  -- ← Paramètre
)
...
UPDATE owners 
SET admin_notes = admin_notes  -- ← Ambiguïté !
```

PostgreSQL ne sait pas si `admin_notes` fait référence au paramètre ou à la colonne.

## ✅ Solution

Préfixer les paramètres avec le nom de la fonction :

```sql
UPDATE owners 
SET admin_notes = reactivate_owner_partner.admin_notes  -- ← Clair !
WHERE id = reactivate_owner_partner.owner_id
```

## 🚀 Correction Rapide

**Exécutez dans Supabase SQL Editor :**

**Fichier :** `fix-functions-owner-partner.sql`

Ou copiez-collez ce script :

```sql
-- Fonction de réactivation corrigée
CREATE OR REPLACE FUNCTION reactivate_owner_partner(
    owner_id UUID,
    admin_user_id UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    owner_record RECORD;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = reactivate_owner_partner.admin_user_id 
        AND role IN ('admin', 'manager', 'superuser')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes';
    END IF;
    
    SELECT * INTO owner_record
    FROM owners 
    WHERE id = reactivate_owner_partner.owner_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Le propriétaire/partenaire n''existe pas';
    END IF;
    
    IF owner_record.verification_status != 'rejected' THEN
        RAISE EXCEPTION 'Le propriétaire/partenaire n''est pas en statut rejeté';
    END IF;
    
    UPDATE owners 
    SET 
        verification_status = 'pending',
        rejected_at = NULL,
        rejected_by = NULL,
        rejection_reason = NULL,
        admin_notes = COALESCE(reactivate_owner_partner.admin_notes, 'Réactivé pour réévaluation'),
        updated_at = NOW()
    WHERE id = reactivate_owner_partner.owner_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction d'approbation corrigée
CREATE OR REPLACE FUNCTION approve_owner_partner(
    owner_id UUID,
    admin_user_id UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = approve_owner_partner.admin_user_id 
        AND role IN ('admin', 'manager', 'superuser')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes';
    END IF;
    
    UPDATE owners 
    SET 
        verification_status = 'verified',
        approved_at = NOW(),
        approved_by = approve_owner_partner.admin_user_id,
        admin_notes = approve_owner_partner.admin_notes,
        updated_at = NOW()
    WHERE id = approve_owner_partner.owner_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de rejet corrigée
CREATE OR REPLACE FUNCTION reject_owner_partner(
    owner_id UUID,
    admin_user_id UUID,
    rejection_reason TEXT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = reject_owner_partner.admin_user_id 
        AND role IN ('admin', 'manager', 'superuser')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes';
    END IF;
    
    IF reject_owner_partner.rejection_reason IS NULL OR reject_owner_partner.rejection_reason = '' THEN
        RAISE EXCEPTION 'La raison du rejet est obligatoire';
    END IF;
    
    UPDATE owners 
    SET 
        verification_status = 'rejected',
        rejected_at = NOW(),
        rejected_by = reject_owner_partner.admin_user_id,
        rejection_reason = reject_owner_partner.rejection_reason,
        admin_notes = reject_owner_partner.admin_notes,
        updated_at = NOW()
    WHERE id = reject_owner_partner.owner_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION reactivate_owner_partner(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_owner_partner(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_owner_partner(UUID, UUID, TEXT, TEXT) TO authenticated;
```

**Résultat attendu :** "Success. No rows returned"

## 🧪 Test

Retournez sur l'interface et essayez de réactiver un partner.

✅ Ça devrait fonctionner maintenant !

---

**Temps estimé : 1 minute** ⏱️
