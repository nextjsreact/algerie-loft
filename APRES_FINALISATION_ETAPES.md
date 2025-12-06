# 📋 Après Finalisation - Étapes à Suivre

## ✅ Vous avez exécuté `finalize-migration.sql` dans Supabase

Maintenant, voici ce qu'il faut faire :

---

## 🔧 Étape 1 : Exécuter les Nouvelles Fonctions SQL

### Dans Supabase SQL Editor, exécutez :

**Fichier:** `database/functions/reactivate-owner-partner.sql`

Ce script crée 3 fonctions pour la table `owners` :
- `reactivate_owner_partner()` - Réactiver un owner/partner rejeté
- `approve_owner_partner()` - Approuver
- `reject_owner_partner()` - Rejeter

---

## 🔧 Étape 2 : Mettre à Jour l'Interface Admin

Je vais modifier les fichiers suivants pour utiliser la table `owners` :

### Fichiers à Modifier :

1. **API Routes** (5 fichiers)
   - `app/api/admin/partners/route.ts` → Lire depuis `owners`
   - `app/api/admin/partners/approve/route.ts` → Appeler `approve_owner_partner`
   - `app/api/admin/partners/reject/route.ts` → Appeler `reject_owner_partner`
   - `app/api/admin/partners/reactivate/route.ts` → Appeler `reactivate_owner_partner`
   - `app/api/admin/partners/suspend/route.ts` → Mettre à jour `owners`

2. **Composants** (3 fichiers)
   - `components/admin/partners-management.tsx` → Filtrer `user_id IS NOT NULL`
   - `components/admin/partner-status-dialog.tsx` → OK (pas de changement)
   - `components/admin/partner-details-dialog.tsx` → OK (pas de changement)

3. **TypeScript**
   - `lib/database/partner-queries.ts` → Nouvelles fonctions

---

## 🎯 Distinction Owner vs Partner

Dans la table `owners` unifiée :

```typescript
// Partner (avec compte utilisateur)
user_id IS NOT NULL

// Propriétaire interne (sans compte)
user_id IS NULL
```

L'interface admin affichera **uniquement les partners** (ceux avec `user_id`).

---

## 📊 Structure Finale

```
Table: owners
├── user_id = NULL → Propriétaire interne (géré par admin)
└── user_id = UUID → Partner (peut se connecter)
    ├── verification_status: pending
    ├── verification_status: verified
    ├── verification_status: rejected ← Peut être réactivé
    └── verification_status: suspended
```

---

## ✅ Checklist

- [ ] Finalisation exécutée dans Supabase
- [ ] Fonctions SQL `reactivate-owner-partner.sql` exécutées
- [ ] Dites-moi "C'est fait" pour que je modifie l'interface
- [ ] Test de l'interface `/admin/partners`
- [ ] Vérification que tout fonctionne

---

## 🚀 Prochaine Action

**Dites-moi quand vous avez :**
1. ✅ Exécuté `finalize-migration.sql`
2. ✅ Exécuté `reactivate-owner-partner.sql`

Et je modifierai immédiatement tous les fichiers nécessaires! 🎯
