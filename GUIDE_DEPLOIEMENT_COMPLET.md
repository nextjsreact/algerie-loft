# 🚀 Guide de Déploiement Complet - Loft Algérie

## ✅ Pré-requis Validés

- ✅ **Build de production** : Fonctionnel
- ✅ **Configuration Vercel** : `vercel.json` configuré
- ✅ **Variables d'environnement** : `.env.production` prêt
- ✅ **Base de données** : Supabase configuré

## 🎯 Options de Déploiement

### Option 1: Déploiement Vercel (Recommandé)

#### Étape 1: Connexion à Vercel
```bash
vercel login
```

#### Étape 2: Configuration du projet
```bash
vercel
```
- Sélectionnez votre scope/équipe
- Confirmez le nom du projet : `loft-algerie`
- Confirmez le répertoire : `./`
- Confirmez les paramètres détectés automatiquement

#### Étape 3: Déploiement en production
```bash
vercel --prod
```

### Option 2: Déploiement via GitHub (Automatique)

#### Étape 1: Push vers GitHub
```bash
git add .
git commit -m "Production build ready for deployment"
git push origin main
```

#### Étape 2: Configuration Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Connectez votre repository GitHub
3. Importez le projet `algerie-loft`
4. Vercel détectera automatiquement Next.js

### Option 3: Déploiement Manuel

#### Étape 1: Build local
```bash
npm run build
```

#### Étape 2: Upload via Vercel CLI
```bash
vercel --prod --prebuilt
```

## 🔧 Configuration des Variables d'Environnement

### Variables Critiques à Configurer sur Vercel:

```env
# Base de données Supabase
NEXT_PUBLIC_SUPABASE_URL=https://mhngbluefyucoesgcjoy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Authentication
AUTH_SECRET=29920b6cdea1d1156b95a290d4b3fdca00a3c9d5d7648aa8022dbcb48a648bd7

# Application
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
NODE_ENV=production

# Email (À configurer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
SMTP_FROM=noreply@loft-algerie.com
```

### Comment ajouter les variables sur Vercel:
1. Allez dans votre projet sur vercel.com
2. Settings → Environment Variables
3. Ajoutez chaque variable une par une
4. Sélectionnez "Production" pour l'environnement

## 🌐 Configuration du Domaine

### Domaine Personnalisé (Optionnel)
1. Dans Vercel Dashboard → Settings → Domains
2. Ajoutez votre domaine : `loft-algerie.com`
3. Configurez les DNS selon les instructions Vercel

### Domaine Vercel par Défaut
- Votre app sera accessible sur : `https://loft-algerie.vercel.app`

## 📋 Checklist de Déploiement

### Avant le Déploiement
- [ ] Build local réussi (`npm run build`)
- [ ] Variables d'environnement préparées
- [ ] Base de données Supabase accessible
- [ ] Compte Vercel configuré

### Pendant le Déploiement
- [ ] Connexion Vercel réussie
- [ ] Configuration du projet validée
- [ ] Variables d'environnement ajoutées
- [ ] Build de production réussi

### Après le Déploiement
- [ ] Site accessible via l'URL Vercel
- [ ] Page d'accueil se charge correctement
- [ ] Connexion à la base de données fonctionnelle
- [ ] Authentification testée
- [ ] Fonctionnalités principales testées

## 🔍 Tests Post-Déploiement

### Tests Essentiels
1. **Page d'accueil** : `https://votre-app.vercel.app`
2. **Connexion** : `/login`
3. **Inscription** : `/register`
4. **Dashboard** : `/dashboard`
5. **API Health** : `/api/health`

### Tests Avancés
1. **Réservation complète**
2. **Upload d'images**
3. **Notifications email**
4. **Interface partenaire**
5. **Interface admin**

## 🚨 Dépannage

### Erreurs Communes

#### 1. Build Failed
```bash
# Solution: Vérifier les dépendances
npm install
npm run build
```

#### 2. Variables d'environnement manquantes
- Vérifiez dans Vercel Dashboard → Settings → Environment Variables
- Redéployez après ajout : `vercel --prod`

#### 3. Erreur de base de données
- Vérifiez les URLs Supabase
- Testez la connexion : `/api/health`

#### 4. Erreur 404 sur les routes
- Vérifiez `next.config.mjs`
- Vérifiez la structure des dossiers `app/`

## 📞 Support

### Logs de Déploiement
- Vercel Dashboard → Functions → View Function Logs
- Vercel Dashboard → Deployments → View Build Logs

### Monitoring
- Vercel Analytics (automatique)
- Vercel Speed Insights (automatique)

## 🎉 Commandes Rapides

### Déploiement Express
```bash
# Méthode la plus rapide
vercel --prod

# Avec build préalable
npm run build && vercel --prod --prebuilt

# Via GitHub (push et auto-deploy)
git push origin main
```

### Rollback Rapide
```bash
# Revenir à la version précédente
vercel rollback
```

### Logs en Temps Réel
```bash
# Voir les logs de production
vercel logs --follow
```

## 🔗 Liens Utiles

- **Vercel Dashboard** : https://vercel.com/dashboard
- **Documentation Vercel** : https://vercel.com/docs
- **Supabase Dashboard** : https://supabase.com/dashboard
- **Next.js Deployment** : https://nextjs.org/docs/deployment

---

## 🚀 Démarrage Rapide

**Pour déployer maintenant :**

1. Ouvrez un terminal dans le projet
2. Exécutez : `vercel --prod`
3. Suivez les instructions à l'écran
4. Votre app sera en ligne en quelques minutes !

**URL de votre application :** `https://loft-algerie.vercel.app` (ou votre domaine personnalisé)

---

*Guide créé le 1er janvier 2026 - Build de production validé ✅*