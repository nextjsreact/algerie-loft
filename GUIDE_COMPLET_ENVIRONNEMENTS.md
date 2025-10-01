# 🚀 Guide Complet - Environnements et Clonage

## 📋 1. STRUCTURE DES ENVIRONNEMENTS

### Fichiers d'environnement disponibles :

```
.env                    → Actuellement: DEV (wtcbyjdwjrrqyzpvjfze)
.env.local             → Actuellement: DEV (wtcbyjdwjrrqyzpvjfze)
.env.development       → DEV (wtcbyjdwjrrqyzpvjfze)
.env.production        → PROD (mhngbluefyucoesgcjoy)
.env.prod.backup       → Sauvegarde PROD
.env.local.backup      → Sauvegarde ancien .env.local
```

### Bases de données :

- **DEV** : `wtcbyjdwjrrqyzpvjfze.supabase.co`
- **PROD** : `mhngbluefyucoesgcjoy.supabase.co`

---

## 🔄 2. CHANGER D'ENVIRONNEMENT

### A. Passer en DÉVELOPPEMENT (DEV) :

```bash
# Copier la config DEV
copy .env.development .env
copy .env.development .env.local

# Redémarrer le serveur
npm run dev
```

### B. Passer en PRODUCTION (PROD) :

```bash
# Copier la config PROD
copy .env.production .env
copy .env.production .env.local

# Redémarrer le serveur
npm run dev
```

### C. Vérifier l'environnement actuel :

```bash
npx tsx scripts/verify-nextjs-env.ts
```

---

## 🔄 3. CLONAGE DE BASE DE DONNÉES (A à Z)

### Étape 1 : Vérifier l'état actuel

```bash
# Vérifier les utilisateurs dans DEV
npx tsx scripts/check-dev-users.ts

# Vérifier les utilisateurs dans PROD
npx tsx scripts/check-prod-users.ts
```

### Étape 2 : Clonage PROD → DEV

```bash
# Script de clonage automatique complet
npx tsx scripts/automatic-complete-clone.ts

# OU script de clonage fixé (plus stable)
npx tsx scripts/clone-prod-to-dev-fixed.ts
```

### Étape 3 : Validation du clonage

```bash
# Valider que le clonage a réussi
npx tsx scripts/validate-clone-success.ts

# Validation complète avec détails
npx tsx scripts/comprehensive-validation.ts
```

### Étape 4 : Créer un utilisateur de test (si nécessaire)

```bash
# Créer un utilisateur fonctionnel dans DEV
npx tsx scripts/create-working-user.ts
```

---

## 🎯 4. SCRIPTS DISPONIBLES

### Scripts de clonage :

- `clone-prod-to-dev-fixed.ts` - Clonage stable PROD → DEV
- `automatic-complete-clone.ts` - Clonage automatique complet
- `validate-clone-success.ts` - Validation du clonage
- `comprehensive-validation.ts` - Validation détaillée

### Scripts d'environnement :

- `verify-nextjs-env.ts` - Vérifier la config Next.js
- `check-dev-users.ts` - Vérifier utilisateurs DEV
- `check-prod-users.ts` - Vérifier utilisateurs PROD

### Scripts de debug :

- `debug-complete-login.ts` - Debug connexion complète
- `final-validation-test.ts` - Test final de validation
- `create-working-user.ts` - Créer utilisateur fonctionnel

---

## 🔧 5. PROCÉDURE COMPLÈTE DE CLONAGE

### Scénario : Cloner PROD vers DEV pour les tests

```bash
# 1. Passer en environnement DEV
copy .env.development .env
copy .env.development .env.local

# 2. Vérifier l'état initial
npx tsx scripts/check-dev-users.ts

# 3. Lancer le clonage
npx tsx scripts/clone-prod-to-dev-fixed.ts

# 4. Valider le clonage
npx tsx scripts/validate-clone-success.ts

# 5. Créer un utilisateur de test
npx tsx scripts/create-working-user.ts

# 6. Redémarrer le serveur
npm run dev

# 7. Tester la connexion
# Aller sur: http://localhost:3000/fr/login
# Utiliser les identifiants affichés sur la page
```

---

## ⚙️ 6. COMMANDES SERVEUR

### Démarrer le serveur :

```bash
npm run dev          # Mode développement
npm run build        # Build production
npm run start        # Serveur production
```

### Redémarrer complètement :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

---

## 🎯 7. IDENTIFIANTS ACTUELS

### Environnement DEV :

- **Email :** `user1759066310913@dev.local`
- **Mot de passe :** `password123`
- **Base :** `wtcbyjdwjrrqyzpvjfze.supabase.co`

### Environnement PROD :

- **Utilisateurs existants :** Voir `scripts/check-prod-users.ts`
- **Base :** `mhngbluefyucoesgcjoy.supabase.co`

---

## 🚨 8. POINTS IMPORTANTS

### ⚠️ Attention :

1. **Toujours redémarrer** le serveur après changement d'environnement
2. **Vérifier** quel environnement est actif avec `verify-nextjs-env.ts`
3. **Sauvegarder** avant de faire des clonages
4. **Tester** la connexion après chaque changement

### 🔄 Ordre de priorité Next.js :

1. `.env.development.local` (si NODE_ENV=development)
2. `.env.local` ← **Celui utilisé actuellement**
3. `.env.development` (si NODE_ENV=development)
4. `.env`

---

## 🎉 RÉSUMÉ RAPIDE

### Pour changer d'environnement :

```bash
# DEV
copy .env.development .env.local && npm run dev

# PROD
copy .env.production .env.local && npm run dev
```

### Pour cloner PROD → DEV :

```bash
npx tsx scripts/clone-prod-to-dev-fixed.ts
```

### Pour vérifier tout fonctionne :

```bash
npx tsx scripts/final-validation-test.ts
```

**Votre système est maintenant complètement opérationnel !** 🎉
