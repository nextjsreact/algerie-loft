# 🔧 Guide Environnements Corrigé

## 🚨 SITUATION ACTUELLE

### ✅ Configuration PROD restaurée :
- **Base PROD** : `mhngbluefyucoesgcjoy.supabase.co`
- **Fichiers** : `.env` et `.env.local` pointent vers PROD
- **Utilisateurs** : 10 utilisateurs existants dans PROD
- **Problème** : Mots de passe inconnus

### 📋 Utilisateurs PROD disponibles :
1. `loft.algerie.scl@outlook.com` (dernière connexion: 19 sept 2025)
2. `habib.belkacemi.mosta@gmail.com` (dernière connexion: 22 sept 2025)
3. `nextjsreact@gmail.com` (dernière connexion: 21 sept 2025)
4. `admin@loftalgerie.com` (dernière connexion: 26 août 2025)
5. Et 6 autres utilisateurs...

---

## 🎯 SOLUTIONS POUR ACCÉDER À LA PROD

### Option 1 : Utiliser "Mot de passe oublié"
```
1. Aller sur: http://localhost:3000/fr/login
2. Cliquer sur "Mot de passe oublié"
3. Saisir un email existant (ex: loft.algerie.scl@outlook.com)
4. Suivre le lien de réinitialisation
```

### Option 2 : Créer un nouvel utilisateur via Supabase Dashboard
```
1. Aller sur: https://supabase.com/dashboard
2. Sélectionner le projet PROD (mhngbluefyucoesgcjoy)
3. Authentication > Users > Add user
4. Créer un nouvel utilisateur avec mot de passe connu
```

### Option 3 : Reset d'un utilisateur existant
```bash
# Script pour reset le mot de passe d'un utilisateur existant
npx tsx scripts/reset-prod-user-password.ts
```

---

## 🔄 GESTION DES ENVIRONNEMENTS (SANS CASSER LA PROD)

### Structure des fichiers :
```
.env                    → PROD (ne pas toucher)
.env.local             → PROD (ne pas toucher)
.env.development       → DEV (pour tests)
.env.production        → PROD (sauvegarde)
```

### Pour basculer vers DEV temporairement :
```bash
# Sauvegarder la config PROD actuelle
copy .env.local .env.local.prod.backup

# Basculer vers DEV
copy .env.development .env.local

# Redémarrer
npm run dev
```

### Pour revenir à PROD :
```bash
# Restaurer la config PROD
copy .env.local.prod.backup .env.local

# Redémarrer
npm run dev
```

---

## 🔄 CLONAGE SÉCURISÉ

### Cloner PROD → DEV (sans affecter PROD) :
```bash
# 1. S'assurer d'être en mode DEV
copy .env.development .env.local

# 2. Lancer le clonage
npx tsx scripts/clone-prod-to-dev-safe.ts

# 3. Valider le clonage
npx tsx scripts/validate-clone-success.ts
```

---

## 🎯 PROCHAINES ÉTAPES RECOMMANDÉES

### Immédiat :
1. **Redémarrer le serveur** avec la config PROD restaurée
2. **Essayer les identifiants** que vous connaissiez avant
3. **Utiliser "Mot de passe oublié"** si nécessaire

### Pour les tests futurs :
1. **Créer un utilisateur de test** dans PROD avec mot de passe connu
2. **Utiliser l'environnement DEV** pour les expérimentations
3. **Ne jamais modifier** `.env` et `.env.local` directement

---

## 🚨 RÈGLES À RESPECTER

### ✅ À FAIRE :
- Utiliser `.env.development` pour les tests DEV
- Sauvegarder avant tout changement
- Tester les scripts sur DEV d'abord

### ❌ À NE PAS FAIRE :
- Modifier `.env` et `.env.local` directement
- Lancer des scripts sur PROD sans sauvegarde
- Supprimer des utilisateurs PROD existants

---

## 💡 RÉSUMÉ

**Votre PROD est maintenant restaurée !** 

Les identifiants que vous utilisiez avant devraient fonctionner. Si vous ne vous en souvenez pas, utilisez la fonction "Mot de passe oublié" avec un des emails existants.

**La configuration est revenue à l'état où elle fonctionnait avant mes modifications.**