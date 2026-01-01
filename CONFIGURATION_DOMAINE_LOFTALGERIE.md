# 🌐 Configuration du Domaine loftalgerie.com

## ✅ Étapes à suivre pour configurer votre domaine personnalisé

### 1. Configuration sur Vercel (Interface Web)

1. **Allez sur Vercel Dashboard** : https://vercel.com/dashboard
2. **Sélectionnez votre projet** : `algerie-loft`
3. **Allez dans Settings** → **Domains**
4. **Ajoutez votre domaine** : `loftalgerie.com`
5. **Ajoutez aussi** : `www.loftalgerie.com` (optionnel)

### 2. Configuration DNS chez votre registrar

Vous devez configurer ces enregistrements DNS chez votre fournisseur de domaine :

```dns
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

**OU** (méthode recommandée) :

```dns
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www  
Value: cname.vercel-dns.com
```

### 3. Configuration OAuth Supabase

Une fois le domaine configuré, vous devez mettre à jour Supabase :

1. **Allez sur Supabase Dashboard** : https://supabase.com/dashboard
2. **Sélectionnez votre projet** : `mhngbluefyucoesgcjoy`
3. **Authentication** → **URL Configuration**
4. **Site URL** : `https://loftalgerie.com`
5. **Redirect URLs** : Ajoutez :
   - `https://loftalgerie.com/auth/callback`
   - `https://loftalgerie.com/api/auth/callback`
   - `https://www.loftalgerie.com/auth/callback` (si vous utilisez www)

### 4. Variables d'environnement Vercel

Assurez-vous que ces variables sont configurées sur Vercel :

```env
NEXT_PUBLIC_APP_URL=https://loftalgerie.com
NEXT_PUBLIC_SUPABASE_URL=https://mhngbluefyucoesgcjoy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Test de configuration

Une fois tout configuré, testez :

1. **Accès au site** : https://loftalgerie.com
2. **Redirection www** : https://www.loftalgerie.com → https://loftalgerie.com
3. **OAuth Google/Facebook** : Doit rediriger vers loftalgerie.com
4. **Certificat SSL** : Doit être automatiquement configuré par Vercel

## 🚨 Points importants

- **Propagation DNS** : Peut prendre 24-48h
- **Certificat SSL** : Automatique avec Vercel
- **Redirection** : www → non-www (ou inverse selon votre préférence)

## 🔧 Commandes utiles

```bash
# Vérifier la propagation DNS
nslookup loftalgerie.com

# Tester le certificat SSL
curl -I https://loftalgerie.com

# Redéployer après configuration
vercel --prod
```

## 📞 Support

Si vous avez des problèmes :
1. Vérifiez la configuration DNS
2. Attendez la propagation (24-48h)
3. Contactez le support de votre registrar si nécessaire
4. Vérifiez les logs Vercel pour les erreurs

---

**Une fois configuré, vous n'aurez plus jamais à changer les URLs OAuth !** 🎉