# 🚀 Guide de Déploiement - LoftAlgerie

## Déploiement sur Vercel

### Méthode 1: Déploiement Automatique via GitHub (Recommandé)

1. **Connecter à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez-vous avec votre compte GitHub
   - Cliquez sur "New Project"
   - Sélectionnez votre repository `loft-algerie`

2. **Configuration du Projet**
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Variables d'Environnement**
   Dans les paramètres Vercel, ajoutez :
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

4. **Déployer**
   - Cliquez sur "Deploy"
   - Vercel va automatiquement déployer à chaque push sur `main`

### Méthode 2: Déploiement via CLI

1. **Installer Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login Vercel**
   ```bash
   vercel login
   ```

3. **Configurer les Variables d'Environnement**
   Créez un fichier `.env.local` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Déployer**
   ```bash
   # Déploiement de développement
   vercel

   # Déploiement de production
   vercel --prod

   # Ou utiliser notre script
   npm run deploy:vercel
   ```

### Méthode 3: Déploiement Rapide

```bash
# Clone et déploie en une commande
git clone https://github.com/Habibmosta/loft-algerie.git
cd loft-algerie
npm install
# Configurez .env.local
npm run deploy:vercel
```

## Configuration Post-Déploiement

### 1. Domaine Personnalisé (Optionnel)
- Dans Vercel Dashboard → Settings → Domains
- Ajoutez votre domaine personnalisé
- Configurez les DNS selon les instructions

### 2. Variables d'Environnement de Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret
```

### 3. Configuration Supabase
- Ajoutez votre domaine Vercel dans Supabase → Authentication → URL Configuration
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

## Surveillance et Monitoring

### Analytics Vercel
- Activez Vercel Analytics dans le dashboard
- Surveillez les performances et erreurs

### Logs
```bash
# Voir les logs en temps réel
vercel logs your-app-url

# Logs d'une fonction spécifique
vercel logs your-app-url --function=api/lofts/availability
```

## Optimisations de Performance

### 1. Images
- Utilisez `next/image` pour l'optimisation automatique
- Configurez les domaines d'images dans `next.config.js`

### 2. Caching
- Les API routes sont automatiquement cachées
- Utilisez `revalidate` pour les données dynamiques

### 3. Bundle Analysis
```bash
# Analyser la taille du bundle
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

## Rollback et Versions

### Rollback Rapide
```bash
# Lister les déploiements
vercel ls

# Promouvoir un déploiement précédent
vercel promote deployment-url
```

### Branches de Déploiement
- `main` → Production automatique
- `develop` → Preview automatique
- Feature branches → Preview URLs

## Troubleshooting

### Erreurs Communes

1. **Build Failed**
   ```bash
   # Vérifier localement
   npm run build
   npm run start
   ```

2. **Variables d'Environnement**
   - Vérifiez dans Vercel Dashboard → Settings → Environment Variables
   - Redéployez après modification

3. **Erreurs Supabase**
   - Vérifiez les URLs et clés
   - Confirmez les permissions RLS

### Support
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs

---

## 🎯 Checklist de Déploiement

- [ ] Repository GitHub à jour
- [ ] Variables d'environnement configurées
- [ ] Build local réussi
- [ ] Tests passent
- [ ] Supabase configuré
- [ ] Domaine configuré (si applicable)
- [ ] Analytics activées
- [ ] Monitoring en place

🎉 **Votre application LoftAlgerie est maintenant en ligne !**