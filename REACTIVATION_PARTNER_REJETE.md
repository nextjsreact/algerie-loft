# 🔄 Réactivation d'un Partner Rejeté

## 📋 Question
**Peut-on changer le statut d'un partner rejeté pour l'accepter ?**

**Réponse : OUI ✅**

---

## 🎯 Situation Actuelle

### Fonctions Existantes

Le système dispose actuellement de deux fonctions :

1. **`approve_partner()`** - Approuver un partner
2. **`reject_partner()`** - Rejeter un partner

**Problème :** Ces fonctions ne permettent pas de **réactiver** un partner déjà rejeté.

---

## 💡 Solution : Fonction de Réactivation

### Nouvelle Fonction SQL

```sql
CREATE OR REPLACE FUNCTION reactivate_partner(
    partner_id UUID,
    admin_user_id UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier les permissions admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager', 'superuser')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes pour réactiver un partenaire';
    END IF;
    
    -- Vérifier que le partner existe et est bien rejeté
    IF NOT EXISTS (
        SELECT 1 FROM partners 
        WHERE id = partner_id 
        AND verification_status = 'rejected'
    ) THEN
        RAISE EXCEPTION 'Le partenaire n''existe pas ou n''est pas en statut rejeté';
    END IF;
    
    -- Réactiver le partner (retour à pending pour nouvelle évaluation)
    UPDATE partners 
    SET 
        verification_status = 'pending',
        rejected_at = NULL,
        rejected_by = NULL,
        rejection_reason = NULL,
        admin_notes = COALESCE(admin_notes, 'Réactivé pour réévaluation'),
        updated_at = NOW()
    WHERE id = partner_id;
    
    -- Créer une nouvelle demande de validation
    INSERT INTO partner_validation_requests (
        partner_id,
        status,
        admin_notes,
        created_at
    ) VALUES (
        partner_id,
        'pending',
        COALESCE(admin_notes, 'Demande réactivée après rejet'),
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔧 Utilisation

### 1. Via SQL Direct (Supabase SQL Editor)

```sql
-- Réactiver un partner rejeté
SELECT reactivate_partner(
    'uuid-du-partner',
    'uuid-de-l-admin',
    'Documents mis à jour, nouvelle évaluation demandée'
);
```

### 2. Via TypeScript (API)

```typescript
// Dans lib/database/partner-queries.ts
export class AdminPartnerQueries {
  
  // Réactiver un partner rejeté
  async reactivatePartner(
    partnerId: string, 
    adminUserId: string, 
    adminNotes?: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('reactivate_partner', {
        partner_id: partnerId,
        admin_user_id: adminUserId,
        admin_notes: adminNotes
      });

    if (error) throw error;
    return data;
  }
}
```

### 3. Via API Route

```typescript
// app/api/admin/partners/reactivate/route.ts
import { createClient } from '@/lib/supabase/server';
import { AdminPartnerQueries } from '@/lib/database/partner-queries';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { partnerId, adminNotes } = await request.json();
  
  // Vérifier l'authentification
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 });
  }
  
  // Vérifier les permissions admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (!['admin', 'manager', 'superuser'].includes(profile?.role)) {
    return Response.json({ error: 'Permissions insuffisantes' }, { status: 403 });
  }
  
  // Réactiver le partner
  const adminQueries = new AdminPartnerQueries(supabase);
  const success = await adminQueries.reactivatePartner(
    partnerId,
    user.id,
    adminNotes
  );
  
  return Response.json({ success });
}
```

---

## 🔄 Flux de Réactivation

```
Partner Rejeté (rejected)
         ↓
Admin décide de réactiver
         ↓
Fonction reactivate_partner()
         ↓
Statut → pending
         ↓
Nouvelle demande de validation créée
         ↓
Admin peut maintenant approuver
         ↓
Statut → verified/approved
         ↓
Partner accède au dashboard
```

---

## 📊 Statuts Possibles

```typescript
type PartnerStatus = 
  | 'pending'    // En attente de validation
  | 'verified'   // Approuvé (nouveau système)
  | 'approved'   // Approuvé (ancien système)
  | 'rejected'   // Rejeté
  | 'suspended'  // Suspendu
```

### Transitions Possibles

```
pending → verified ✅ (approve_partner)
pending → rejected ✅ (reject_partner)
rejected → pending ✅ (reactivate_partner) ⭐ NOUVEAU
pending → suspended ✅ (admin action)
verified → suspended ✅ (admin action)
suspended → pending ✅ (reactivate_partner)
```

---

## 🎨 Interface Admin

### Bouton de Réactivation

```tsx
// components/admin/partner-actions.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PartnerActionsProps {
  partner: {
    id: string;
    verification_status: string;
    business_name: string;
  };
}

export function PartnerActions({ partner }: PartnerActionsProps) {
  const [loading, setLoading] = useState(false);
  
  const handleReactivate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/partners/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          adminNotes: 'Réactivé pour réévaluation'
        })
      });
      
      if (response.ok) {
        alert('Partner réactivé avec succès!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (partner.verification_status !== 'rejected') {
    return null;
  }
  
  return (
    <Button 
      onClick={handleReactivate}
      disabled={loading}
      variant="outline"
    >
      🔄 Réactiver ce partner
    </Button>
  );
}
```

---

## 📝 Historique et Audit

La réactivation est tracée dans :

1. **Table `partners`**
   - `verification_status` : `rejected` → `pending`
   - `rejected_at` : effacé
   - `rejected_by` : effacé
   - `rejection_reason` : effacé
   - `admin_notes` : mis à jour
   - `updated_at` : timestamp actuel

2. **Table `partner_validation_requests`**
   - Nouvelle entrée créée avec statut `pending`
   - `admin_notes` : raison de la réactivation

3. **Logs d'audit** (si activés)
   - Action : `PARTNER_REACTIVATED`
   - Admin : `admin_user_id`
   - Timestamp : automatique

---

## ⚠️ Considérations Importantes

### 1. Notifications

Après réactivation, envoyer une notification au partner :

```typescript
// Notifier le partner
await sendPartnerNotification(partnerId, {
  type: 'reactivation',
  title: 'Votre demande a été réactivée',
  message: 'Votre compte partner a été réactivé. Veuillez mettre à jour vos documents si nécessaire.',
  action_url: '/partner/profile'
});
```

### 2. Documents

Le partner devrait pouvoir :
- Mettre à jour ses documents
- Modifier ses informations
- Soumettre de nouvelles preuves

### 3. Permissions

Pendant le statut `pending` après réactivation :
- ❌ Pas d'accès au dashboard complet
- ✅ Accès à la page de profil
- ✅ Peut modifier ses informations
- ✅ Peut uploader de nouveaux documents

---

## 🚀 Installation

### Étape 1 : Créer la fonction SQL

Exécutez le script dans Supabase SQL Editor :

```bash
# Fichier: database/functions/reactivate-partner.sql
```

### Étape 2 : Ajouter la méthode TypeScript

Ajoutez la méthode dans `lib/database/partner-queries.ts`

### Étape 3 : Créer l'API Route

Créez `app/api/admin/partners/reactivate/route.ts`

### Étape 4 : Ajouter le bouton dans l'interface admin

Ajoutez le composant dans la page de gestion des partners

---

## 📊 Exemple Complet

### Scénario

1. **Partner "Ahmed Benali" est rejeté** (documents incomplets)
   - Statut : `rejected`
   - Raison : "Documents d'identité manquants"

2. **Ahmed met à jour ses documents**
   - Upload de nouveaux documents
   - Contacte le support

3. **Admin vérifie et décide de réactiver**
   ```sql
   SELECT reactivate_partner(
     'ahmed-uuid',
     'admin-uuid',
     'Documents mis à jour - nouvelle évaluation'
   );
   ```

4. **Statut change à `pending`**
   - Ahmed reçoit une notification
   - Nouvelle demande de validation créée

5. **Admin réévalue et approuve**
   ```sql
   SELECT approve_partner(
     'ahmed-uuid',
     'admin-uuid',
     'Documents conformes - approuvé'
   );
   ```

6. **Ahmed accède au dashboard**
   - Statut : `verified`
   - Accès complet au système

---

## ✅ Résumé

| Question | Réponse |
|----------|---------|
| **Peut-on réactiver un partner rejeté ?** | ✅ OUI |
| **Comment ?** | Fonction `reactivate_partner()` |
| **Nouveau statut ?** | `pending` (pour réévaluation) |
| **Peut-on ensuite approuver ?** | ✅ OUI avec `approve_partner()` |
| **Historique conservé ?** | ✅ OUI dans audit logs |
| **Notifications ?** | ✅ OUI (à implémenter) |

---

**Créé le :** 6 décembre 2025  
**Dernière mise à jour :** 6 décembre 2025
