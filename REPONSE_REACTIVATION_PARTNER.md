# ✅ Réponse : Réactivation d'un Partner Rejeté

## 🎯 Question
**Est-ce qu'un partner à qui on a rejeté sa demande, on peut lui changer sa demande pour être accepté ?**

---

## ✅ Réponse : OUI, Absolument !

Vous pouvez **réactiver un partner rejeté** et lui donner une nouvelle chance d'être approuvé.

---

## 🚀 Solution Implémentée

J'ai créé une **fonction complète de réactivation** qui permet à un admin de :

1. ✅ Réactiver un partner rejeté
2. ✅ Le remettre en statut `pending` pour réévaluation
3. ✅ Créer une nouvelle demande de validation
4. ✅ Ensuite l'approuver normalement

---

## 📁 Fichiers Créés

### 1. **Documentation Complète**
- `REACTIVATION_PARTNER_REJETE.md` - Guide complet avec exemples

### 2. **Fonction SQL**
- `database/functions/reactivate-partner.sql` - Fonction PostgreSQL

### 3. **Méthode TypeScript**
- Ajoutée dans `lib/database/partner-queries.ts`

---

## 🔧 Comment Utiliser

### Option 1 : Via SQL (Supabase SQL Editor)

```sql
-- Réactiver un partner rejeté
SELECT reactivate_partner(
    'uuid-du-partner',
    'uuid-de-l-admin',
    'Documents mis à jour, nouvelle évaluation demandée'
);
```

### Option 2 : Via TypeScript

```typescript
import { AdminPartnerQueries } from '@/lib/database/partner-queries';

const adminQueries = new AdminPartnerQueries(supabase);

// Réactiver le partner
await adminQueries.reactivatePartner(
  partnerId,
  adminUserId,
  'Documents conformes maintenant'
);

// Ensuite l'approuver
await adminQueries.approvePartner(
  partnerId,
  adminUserId,
  'Approuvé après réévaluation'
);
```

---

## 🔄 Flux Complet

```
1. Partner inscrit
   ↓
2. Admin rejette (documents incomplets)
   Status: rejected ❌
   ↓
3. Partner met à jour ses documents
   ↓
4. Admin réactive le partner
   reactivate_partner() → Status: pending 🔄
   ↓
5. Admin réévalue
   ↓
6. Admin approuve
   approve_partner() → Status: verified ✅
   ↓
7. Partner accède au dashboard 🎉
```

---

## 📊 Changements de Statut

| Avant | Action | Après |
|-------|--------|-------|
| `rejected` | `reactivate_partner()` | `pending` |
| `pending` | `approve_partner()` | `verified` |

---

## 🎨 Ce qui se Passe lors de la Réactivation

1. **Statut change** : `rejected` → `pending`
2. **Informations de rejet effacées** :
   - `rejected_at` → NULL
   - `rejected_by` → NULL
   - `rejection_reason` → NULL
3. **Note admin ajoutée** : Raison de la réactivation
4. **Nouvelle demande créée** : Dans `partner_validation_requests`
5. **Timestamp mis à jour** : `updated_at`

---

## 💡 Cas d'Usage Typiques

### Scénario 1 : Documents Incomplets
```
Partner rejeté → Met à jour documents → Admin réactive → Admin approuve
```

### Scénario 2 : Erreur Administrative
```
Partner rejeté par erreur → Admin réactive → Admin approuve immédiatement
```

### Scénario 3 : Nouvelle Tentative
```
Partner rejeté → Améliore son dossier → Admin réactive → Réévaluation
```

---

## 🔐 Sécurité

- ✅ Seuls les **admins, managers et superusers** peuvent réactiver
- ✅ Vérification que le partner existe
- ✅ Vérification que le statut est bien `rejected`
- ✅ Historique conservé dans les logs
- ✅ Fonction sécurisée avec `SECURITY DEFINER`

---

## 📝 Installation

### Étape 1 : Exécuter le SQL
```bash
# Dans Supabase SQL Editor
# Copier/coller le contenu de:
database/functions/reactivate-partner.sql
```

### Étape 2 : Utiliser dans le Code
```typescript
// La méthode est déjà ajoutée dans:
lib/database/partner-queries.ts

// Utilisation:
const adminQueries = new AdminPartnerQueries(supabase);
await adminQueries.reactivatePartner(partnerId, adminId, notes);
```

---

## ✨ Avantages

1. **Flexibilité** : Permet de corriger des erreurs
2. **Seconde chance** : Partners peuvent améliorer leur dossier
3. **Traçabilité** : Historique complet des actions
4. **Sécurité** : Permissions strictes
5. **Simplicité** : Une seule fonction à appeler

---

## 🎯 Résumé Final

| Question | Réponse |
|----------|---------|
| Peut-on réactiver un partner rejeté ? | ✅ **OUI** |
| Comment ? | Fonction `reactivate_partner()` |
| Nouveau statut après réactivation ? | `pending` |
| Peut-on ensuite l'approuver ? | ✅ **OUI** avec `approve_partner()` |
| Historique conservé ? | ✅ **OUI** |
| Qui peut le faire ? | Admin, Manager, Superuser |

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `REACTIVATION_PARTNER_REJETE.md` - Guide complet
- `DIFFERENCE_PARTNER_PROPRIETAIRE.md` - Comprendre les partners
- `database/functions/reactivate-partner.sql` - Code SQL

---

**Créé le :** 6 décembre 2025  
**Auteur :** Kiro AI Assistant  
**Status :** ✅ Prêt à utiliser
