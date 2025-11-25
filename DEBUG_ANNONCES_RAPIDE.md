# 🚀 DEBUG RAPIDE - ANNONCES URGENTES

## ⚡ SOLUTION EN 3 ÉTAPES

### ÉTAPE 1: Tester le système (2 min)
```sql
-- Dans Supabase SQL Editor, exécutez:
database/migrations/test_announcements_quick.sql
```

Lisez le résumé à la fin. Il vous dira exactement quoi faire.

---

### ÉTAPE 2: Appliquer les corrections

#### Si "Table n'existe pas" ❌
```sql
-- Exécutez:
database/migrations/create_urgent_announcements.sql
```

#### Si "Politiques incomplètes" ⚠️
```sql
-- Exécutez:
database/migrations/fix_announcements_policies_v2.sql
```

#### Si "Rôle insuffisant" ❌
```sql
-- Remplacez YOUR_EMAIL par votre email:
UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';
```

---

### ÉTAPE 3: Tester dans l'interface

1. **Videz le cache du navigateur**: `Ctrl+Shift+Del` → Tout supprimer
2. **Reconnectez-vous** à l'application
3. **Allez sur** `/admin/announcements`
4. **Créez une annonce**

---

## 🔍 DEBUG AVANCÉ (si ça ne marche toujours pas)

### Option A: Fichier HTML de debug
1. **Ouvrez** `debug-announcements-complete.html`
2. **Modifiez** les lignes 95-96 avec vos clés Supabase
3. **Ouvrez** le fichier dans votre navigateur
4. **Suivez** les instructions à l'écran

### Option B: Console du navigateur
1. **Allez sur** `/admin/announcements`
2. **Ouvrez** la console (F12)
3. **Essayez** de créer une annonce
4. **Copiez** l'erreur complète et partagez-la

---

## 📊 CHECKLIST RAPIDE

Avant de créer une annonce, vérifiez:

- [ ] ✅ Table `urgent_announcements` existe
- [ ] ✅ RLS activé avec 5+ politiques
- [ ] ✅ Vous êtes connecté en tant qu'admin/superuser
- [ ] ✅ Cache du navigateur vidé
- [ ] ✅ Session fraîche (reconnexion récente)

---

## 🆘 COMMANDES D'URGENCE

### Tout réinitialiser
```sql
-- Supprimer la table et tout recréer
DROP TABLE IF EXISTS urgent_announcements CASCADE;

-- Puis exécutez:
-- 1. create_urgent_announcements.sql
-- 2. fix_announcements_policies_v2.sql
```

### Vérifier votre rôle
```sql
SELECT id, email, role FROM profiles WHERE email = 'VOTRE_EMAIL';
```

### Forcer le rôle admin
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'VOTRE_EMAIL';
```

### Voir toutes les annonces (bypass RLS)
```sql
-- En tant que superuser dans Supabase SQL Editor
SELECT * FROM urgent_announcements ORDER BY created_at DESC;
```

---

## 💡 PROBLÈMES COURANTS

### "Permission denied for table urgent_announcements"
**Cause:** Politiques RLS incorrectes ou rôle insuffisant  
**Solution:** Exécutez `fix_announcements_policies_v2.sql` ET vérifiez votre rôle

### "Relation urgent_announcements does not exist"
**Cause:** Table pas encore créée  
**Solution:** Exécutez `create_urgent_announcements.sql`

### "Aucune donnée retournée"
**Cause:** Politique SELECT manquante pour les admins  
**Solution:** Exécutez `fix_announcements_policies_v2.sql`

### "Session expirée"
**Cause:** Token JWT expiré ou corrompu  
**Solution:** Déconnexion → Vider cache → Reconnexion

### Erreur silencieuse (pas de message)
**Cause:** Cookies corrompus  
**Solution:** 
```javascript
// Dans la console (F12):
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
});
location.reload();
```

---

## 🎯 RÉSULTAT ATTENDU

Quand tout fonctionne:

```
✅ Table existe
✅ RLS activé
✅ Politiques: 5 ✅
✅ Votre rôle: admin
✅ Peut lire: ✅
🎉 TOUT EST OK! Vous pouvez créer des annonces.
```

Et dans l'interface `/admin/announcements`:
- Formulaire s'affiche
- Soumission réussit
- Annonce apparaît dans la liste
- Aucune erreur dans la console

---

## 📞 BESOIN D'AIDE ?

Si rien ne fonctionne après avoir suivi ce guide:

1. **Exécutez** `test_announcements_quick.sql`
2. **Copiez** tout le résultat
3. **Ouvrez** la console du navigateur (F12)
4. **Essayez** de créer une annonce
5. **Copiez** l'erreur complète
6. **Partagez** les deux résultats

---

## 🔧 FICHIERS UTILES

- `database/migrations/create_urgent_announcements.sql` - Créer la table
- `database/migrations/fix_announcements_policies_v2.sql` - Fixer les politiques
- `database/migrations/test_announcements_quick.sql` - Tester le système
- `debug-announcements-complete.html` - Debug interactif
- `app/[locale]/admin/announcements/page.tsx` - Interface admin
