# 🔧 Solution Finale - Erreur 401 RLS

## 📊 Diagnostic

**Symptômes:**
- ✅ L'insertion SQL directe fonctionne dans Supabase SQL Editor
- ❌ L'insertion depuis l'application Next.js échoue avec erreur 401
- ✅ L'utilisateur est bien détecté comme `superuser`
- ❌ Le client JavaScript Supabase bloque l'insertion

**Conclusion:** Le problème vient du **token JWT en cache** côté client, pas des politiques RLS.

## 🎯 Solution Immédiate

### Option 1 : Forcer le Rafraîchissement du Token (Recommandé)

Ouvrez la console du navigateur (F12) et exécutez :

```javascript
// Forcer la déconnexion et nettoyage complet
await (await import('@supabase/auth-helpers-nextjs')).createClientComponentClient().auth.signOut();
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.href = '/fr/login';
```

Puis reconnectez-vous.

### Option 2 : Navigation Privée

1. Ouvrez une fenêtre de navigation privée/incognito
2. Connectez-vous à l'application
3. Essayez de créer une annonce

Si ça fonctionne en navigation privée, c'est confirmé que le problème vient du cache.

### Option 3 : Attendre l'Expiration du Token

Les tokens JWT Supabase expirent généralement après 1 heure. Attendez et réessayez.

## 🔍 Vérification

Exécutez `test_direct_insert.sql` dans Supabase SQL Editor :

- ✅ Si ça fonctionne → Le problème est bien le cache du client JS
- ❌ Si ça échoue → Le problème est dans les politiques RLS

## 💡 Solution Permanente

Modifiez le code de la page pour forcer le rafraîchissement du token :

```typescript
// Dans app/[locale]/admin/announcements/page.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // FORCER LE RAFRAÎCHISSEMENT DU TOKEN
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    alert('Session expirée. Veuillez vous reconnecter.');
    return;
  }

  // Forcer le rafraîchissement si nécessaire
  await supabase.auth.refreshSession();

  // Reste du code...
  const announcementData = {
    // ...
  };

  try {
    const result = await supabase
      .from('urgent_announcements')
      .insert([announcementData]);
    
    // ...
  } catch (error) {
    // ...
  }
};
```

## 🚨 Si Rien Ne Fonctionne

### Test de Désactivation Temporaire RLS

**⚠️ UNIQUEMENT EN DÉVELOPPEMENT ⚠️**

```sql
-- Désactiver RLS temporairement
ALTER TABLE urgent_announcements DISABLE ROW LEVEL SECURITY;

-- Tester l'insertion depuis l'app

-- Réactiver RLS
ALTER TABLE urgent_announcements ENABLE ROW LEVEL SECURITY;
```

Si ça fonctionne avec RLS désactivé, le problème est dans les politiques.
Si ça échoue toujours, le problème est ailleurs (permissions, table, etc.).

## 📝 Checklist de Dépannage

- [ ] Profil existe avec `role = 'superuser'` ✓
- [ ] Politiques RLS créées correctement ✓
- [ ] Insertion SQL directe fonctionne ✓
- [ ] Déconnexion/reconnexion effectuée
- [ ] Cache navigateur vidé
- [ ] Test en navigation privée
- [ ] Token JWT rafraîchi

## 🎉 Résultat Attendu

Après avoir vidé le cache et reconnecté :

```
✅ Annonce créée avec succès !
```

Au lieu de :

```
❌ Error: new row violates row-level security policy
```

## 📞 Support

Si le problème persiste après toutes ces étapes, partagez :

1. Le résultat de `test_direct_insert.sql`
2. Le résultat de `fix_rls_superuser.sql` (section test final)
3. Une capture d'écran de l'erreur dans la console
