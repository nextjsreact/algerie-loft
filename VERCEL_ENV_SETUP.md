# Configuration des Variables d'Environnement Vercel

## Variables Supabase à configurer sur Vercel

### 1. Variables publiques (accessibles côté client)
```
NEXT_PUBLIC_SUPABASE_URL=https://mhngbluefyucoesgcjoy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obmdibHVlZnl1Y29lc2djam95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzE3MjIsImV4cCI6MjA2MTcwNzcyMn0.buEObYOAzS8eCKZ6tti0gER1Xh1pjmEAMbDJVnX5WDU
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

### 2. Variables privées (côté serveur uniquement)
```
DATABASE_URL=postgresql://postgres.mhngbluefyucoesgcjoy:Canada!2025Mosta@db.mhngbluefyucoesgcjoy.supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obmdibHVlZnl1Y29lc2djam95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjEzMTcyMiwiZXhwIjoyMDYxNzA3NzIyfQ.GWP_COePfH8YlwuEX7zRc55U5p4XSlCJE5hJehGIurw
AUTH_SECRET=[GÉNÉRER_UNE_CLÉ_SÉCURISÉE]
```

## Étapes pour configurer sur Vercel

### Via l'interface Vercel :
1. Allez sur votre projet Vercel
2. Settings → Environment Variables
3. Ajoutez chaque variable avec les valeurs ci-dessus
4. Redéployez le projet

### Via Vercel CLI :
```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Ajouter les variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel env add DATABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add AUTH_SECRET

# Redéployer
vercel --prod
```

## Génération d'AUTH_SECRET sécurisé

```bash
# Générer une clé aléatoire de 32 caractères
openssl rand -base64 32
```

Ou utilisez ce générateur en ligne : https://generate-secret.vercel.app/32

## Vérification

Après configuration, vérifiez que :
- ✅ Les variables publiques sont accessibles côté client
- ✅ Les variables privées ne sont pas exposées
- ✅ La connexion Supabase fonctionne en production
- ✅ L'authentification fonctionne correctement

## Notes importantes

⚠️ **Sécurité** :
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- Utiliser une `AUTH_SECRET` unique et sécurisée
- Vérifier que `DATABASE_URL` contient les bonnes credentials

⚠️ **URL de production** :
- Remplacer `NEXT_PUBLIC_APP_URL` par votre vraie URL Vercel
- Mettre à jour les redirections OAuth si nécessaire