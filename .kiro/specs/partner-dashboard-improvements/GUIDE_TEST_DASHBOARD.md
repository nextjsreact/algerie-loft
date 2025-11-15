# Guide de Test - Partner Dashboard

**Problème détecté**: Vous êtes connecté avec un compte **admin** mais le dashboard nécessite un compte **partner**.

---

## 🚨 Erreurs Observées

```
GET /api/partner/properties?summary=true 401 in 7263ms
GET /api/partner/dashboard/stats 403 in 6374ms
[ROLE DETECTION] User has profile role: admin
```

**Cause**: Les endpoints partner nécessitent le rôle "partner", pas "admin".

---

## ✅ Solutions

### Solution 1: Créer un Compte Partenaire de Test (Recommandé)

#### Étape 1: Créer l'utilisateur dans Supabase

1. Allez sur votre dashboard Supabase
2. Naviguez vers **Authentication** → **Users**
3. Cliquez sur **Add user**
4. Créez un utilisateur:
   - Email: `partner-test@example.com`
   - Password: `Test123456!`
   - Confirmez l'email automatiquement

#### Étape 2: Mettre à jour le rôle

Exécutez ce SQL dans l'éditeur SQL de Supabase:

```sql
-- Mettre à jour le rôle du nouvel utilisateur
UPDATE profiles 
SET role = 'partner'
WHERE email = 'partner-test@example.com';

-- Vérifier
SELECT id, email, role, full_name 
FROM profiles 
WHERE email = 'partner-test@example.com';
```

#### Étape 3: Se connecter avec le compte partner

1. Déconnectez-vous de votre compte admin
2. Connectez-vous avec:
   - Email: `partner-test@example.com`
   - Password: `Test123456!`
3. Naviguez vers `/fr/partner/dashboard`

---

### Solution 2: Modifier Temporairement Votre Compte Admin

⚠️ **ATTENTION**: Cela changera votre rôle d'admin à partner temporairement

```sql
-- Changer votre compte admin en partner (TEMPORAIRE)
UPDATE profiles 
SET role = 'partner'
WHERE id = '728772d1-543b-4e8c-9150-6c84203a0e16';

-- Vérifier
SELECT id, email, role 
FROM profiles 
WHERE id = '728772d1-543b-4e8c-9150-6c84203a0e16';
```

**Pour revenir en admin après les tests**:
```sql
UPDATE profiles 
SET role = 'admin'
WHERE id = '728772d1-543b-4e8c-9150-6c84203a0e16';
```

---

### Solution 3: Modifier les Permissions API (Pour Tests Uniquement)

⚠️ **NE PAS UTILISER EN PRODUCTION**

Vous pouvez temporairement modifier les vérifications de rôle dans les fichiers API:

**Fichiers à modifier**:
- `app/api/partner/dashboard/stats/route.ts`
- `app/api/partner/properties/route.ts`

**Modification temporaire**:
```typescript
// AVANT (ligne de vérification du rôle)
if (profile.role !== 'partner') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}

// APRÈS (pour tests uniquement)
if (profile.role !== 'partner' && profile.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

⚠️ **N'oubliez pas de revenir en arrière après les tests !**

---

## 🧪 Procédure de Test Recommandée

### Étape 1: Créer le Compte Partner de Test

```sql
-- Dans Supabase SQL Editor
UPDATE profiles 
SET role = 'partner'
WHERE email = 'votre-email-de-test@example.com';
```

### Étape 2: Se Connecter

1. Déconnexion du compte admin
2. Connexion avec le compte partner
3. Naviguer vers `/fr/partner/dashboard`

### Étape 3: Vérifier les Fonctionnalités

**Checklist de test**:
- [ ] Dashboard s'affiche sans erreur 401/403
- [ ] Statistiques se chargent
- [ ] Sidebar s'affiche en français
- [ ] Navigation fonctionne
- [ ] Propriétés s'affichent
- [ ] Réservations s'affichent
- [ ] Changement de langue fonctionne (fr, en, ar)
- [ ] Responsive fonctionne sur mobile
- [ ] Aucune erreur dans la console

### Étape 4: Tester les 3 Langues

```
/fr/partner/dashboard - Français
/en/partner/dashboard - English
/ar/partner/dashboard - العربية
```

### Étape 5: Tester le Responsive

1. Ouvrir DevTools (F12)
2. Activer le mode responsive
3. Tester sur différentes tailles:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

---

## 📊 Résultats Attendus

### Sans Erreurs
```
✓ Compiled in 1ms
GET /api/partner/dashboard/stats 200 in 150ms
GET /api/partner/properties?summary=true 200 in 200ms
GET /api/bookings?limit=5 200 in 180ms
```

### Avec Erreurs (Problème de rôle)
```
✗ GET /api/partner/dashboard/stats 403 in 6374ms
✗ GET /api/partner/properties?summary=true 401 in 7263ms
[ROLE DETECTION] User has profile role: admin
```

---

## 🔧 Dépannage

### Problème: Toujours des erreurs 401/403

**Vérifications**:
1. Vérifier le rôle dans la base de données:
```sql
SELECT id, email, role FROM profiles WHERE email = 'votre-email';
```

2. Vider le cache et se reconnecter:
```bash
# Supprimer les cookies du navigateur
# Ou utiliser le mode navigation privée
```

3. Vérifier les logs du serveur:
```
[ROLE DETECTION] User XXX has profile role: partner
```

### Problème: Dashboard vide

**Causes possibles**:
- Pas de propriétés associées au partner
- Pas de réservations

**Solution**: Créer des données de test
```sql
-- Associer une propriété au partner
UPDATE lofts 
SET partner_id = 'votre-partner-id'
WHERE id = 'une-propriete-id';
```

---

## ✅ Validation du Test

### Critères de Succès

- [ ] Connexion avec compte partner réussie
- [ ] Dashboard s'affiche sans erreur
- [ ] Toutes les API retournent 200
- [ ] Les 3 langues fonctionnent
- [ ] Le responsive fonctionne
- [ ] Sidebar traduite correctement
- [ ] Navigation fluide
- [ ] Aucune erreur console

### Si Tous les Critères Sont Remplis

✅ **Le dashboard partenaire fonctionne correctement !**

---

## 📝 Rapport de Test

**Date**: _______________  
**Testeur**: _______________  
**Compte utilisé**: partner-test@example.com

### Résultats

| Test | Résultat | Commentaires |
|------|----------|--------------|
| Connexion partner | ☐ OK ☐ KO | |
| Dashboard affichage | ☐ OK ☐ KO | |
| API stats (200) | ☐ OK ☐ KO | |
| API properties (200) | ☐ OK ☐ KO | |
| Langue FR | ☐ OK ☐ KO | |
| Langue EN | ☐ OK ☐ KO | |
| Langue AR | ☐ OK ☐ KO | |
| Responsive mobile | ☐ OK ☐ KO | |
| Responsive tablet | ☐ OK ☐ KO | |
| Responsive desktop | ☐ OK ☐ KO | |

### Verdict Final

- [ ] ✅ TOUS LES TESTS PASSENT - Dashboard validé
- [ ] ⚠️ TESTS PARTIELS - Quelques ajustements nécessaires
- [ ] ❌ TESTS ÉCHOUÉS - Corrections requises

**Commentaires**:
_________________________________________________________________

---

## 🚀 Prochaines Étapes

Après validation des tests:
1. Documenter les résultats
2. Corriger les problèmes identifiés
3. Procéder au déploiement staging
4. Suivre deployment-checklist.md

---

**Créé le**: ${new Date().toISOString().split('T')[0]}  
**Pour**: Tests du Partner Dashboard  
**Statut**: Guide de test prêt
