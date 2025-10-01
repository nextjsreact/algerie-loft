# 🎯 Guide Simple - Gestion des Environnements

## ✅ SITUATION ACTUELLE

**Vous êtes maintenant en environnement DEV qui fonctionne !**

- **Base DEV** : `wtcbyjdwjrrqyzpvjfze.supabase.co` ✅
- **Connexion** : Fonctionne parfaitement ✅
- **Identifiants** : `user1759066310913@dev.local` / `password123` ✅

---

## 🔄 BASCULER ENTRE ENVIRONNEMENTS

### 🟢 Environnement DEV (Fonctionnel)
```bash
# Basculer vers DEV
copy .env.development .env.local
npm run dev

# Identifiants DEV :
# Email: user1759066310913@dev.local
# Password: password123
```

### 🔴 Environnement PROD (Problème temporaire)
```bash
# Basculer vers PROD (quand le problème sera résolu)
copy .env.local.backup .env.local
npm run dev

# Identifiants PROD : À déterminer après résolution du problème
```

---

## 🔧 CLONAGE DE DONNÉES

### Cloner PROD → DEV (en étant en mode DEV)
```bash
# S'assurer d'être en DEV
copy .env.development .env.local

# Lancer le clonage
npx tsx scripts/clone-prod-to-dev-fixed.ts

# Valider le clonage
npx tsx scripts/validate-clone-success.ts
```

---

## 🚨 PROBLÈME PROD IDENTIFIÉ

### Symptôme :
- Erreur "Database error granting user" en PROD
- Connexion impossible malgré utilisateurs existants

### Cause probable :
- Problème d'infrastructure Supabase PROD
- Quotas dépassés ou configuration RLS

### Solution temporaire :
- **Utiliser l'environnement DEV** (qui fonctionne)
- **Contacter le support Supabase** pour la PROD

---

## 🎯 COMMANDES RAPIDES

### Vérifier l'environnement actuel :
```bash
npx tsx scripts/verify-nextjs-env.ts
```

### Tester la connexion :
```bash
npx tsx scripts/test-dev-working.ts
```

### Basculer rapidement vers DEV :
```bash
copy .env.development .env.local && npm run dev
```

---

## 📋 RÉSUMÉ

**✅ Vous pouvez maintenant travailler normalement en DEV !**

1. **Redémarrez le serveur** : `npm run dev`
2. **Connectez-vous** avec : `user1759066310913@dev.local` / `password123`
3. **Développez normalement** en attendant la résolution du problème PROD
4. **Clonez les données PROD** si nécessaire avec les scripts

**L'environnement DEV est stable et fonctionnel pour continuer votre travail !** 🎉