# 🔍 GUIDE DE DEBUG - SYSTÈME D'ANNONCES

## 🎯 OBJECTIF
Identifier et résoudre le problème d'insertion dans `urgent_announcements` de manière méthodique.

---

## 📋 ÉTAPE 1: Préparer le fichier de debug

1. **Ouvrez** `debug-announcements-complete.html`
2. **Modifiez les lignes 95-96** avec vos vraies clés Supabase:
   ```javascript
   const SUPABASE_URL = 'https://VOTRE-PROJET.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```
3. **Sauvegardez** le fichier

---

## 🚀 ÉTAPE 2: Exécuter le debug

1. **Ouvrez** `debug-announcements-complete.html` dans votre navigateur
2. **Connectez-vous** à votre application (si pas déjà connecté)
3. **Rechargez** la page de debug
4. **Lisez attentivement** chaque section:
   - ✅ = Tout va bien
   - ⚠️ = Attention requise
   - ❌ = Problème identifié

---

## 🔍 ÉTAPE 3: Interpréter les résultats

### Scénario A: "Table n'existe pas"
```
❌ TABLE N'EXISTE PAS
```

**Solution:**
1. Allez dans Supabase Dashboard → SQL Editor
2. Exécutez `database/migrations/create_urgent_announcements.sql`
3. Rechargez la page de debug

---

### Scénario B: "Insertion impossible" (RLS)
```
❌ INSERTION IMPOSSIBLE
Code: 42501 ou PGRST301
```

**Solution:**
1. Allez dans Supabase Dashboard → SQL Editor
2. Exécutez `database/migrations/fix_announcements_policies.sql`
3. Si ça ne marche pas, exécutez `database/migrations/fix_rls_superuser.sql`
4. Rechargez la page de debug

---

### Scénario C: "Aucune donnée retournée"
```
✅ Insertion réussie mais ❌ Aucune donnée retournée
```

**Cause:** La politique INSERT fonctionne mais pas la politique SELECT.

**Solution:**
```sql
-- Exécutez dans Supabase SQL Editor
DROP POLICY IF EXISTS "Admins can read announcements" ON urgent_announcements;

CREATE POLICY "Admins can read announcements"
ON urgent_announcements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superuser')
  )
);
```

---

### Scénario D: "Rôle incorrect"
```
⚠️ Votre rôle est: client
```

**Solution:**
```sql
-- Exécutez dans Supabase SQL Editor
-- Remplacez YOUR_EMAIL par votre email
UPDATE profiles
SET role = 'admin'
WHERE email = 'YOUR_EMAIL';
```

---

### Scénario E: "Session expirée"
```
❌ NON CONNECTÉ
```

**Solution:**
1. Cliquez sur "Se connecter"
2. Connectez-vous
3. Revenez sur la page de debug

---

## 🧪 ÉTAPE 4: Tester l'insertion

Une fois que toutes les sections montrent ✅:

1. **Cliquez** sur "🚀 TESTER L'INSERTION"
2. **Attendez** le résultat
3. **Si succès:** Le problème est résolu! Testez dans l'interface admin
4. **Si échec:** Copiez l'erreur complète et partagez-la

---

## 🧹 ÉTAPE 5: Nettoyage (si nécessaire)

Si vous voyez des erreurs de cookies corrompus:

1. **Cliquez** sur "🗑️ NETTOYER LE CACHE"
2. **Attendez** le rechargement
3. **Reconnectez-vous**
4. **Retestez**

---

## 📊 ÉTAPE 6: Vérifier dans l'interface

1. **Allez** sur `/admin/announcements`
2. **Cliquez** sur "Nouvelle annonce"
3. **Remplissez** le formulaire
4. **Soumettez**
5. **Vérifiez** le résultat

---

## 🆘 SI ÇA NE MARCHE TOUJOURS PAS

Partagez ces informations:

1. **Capture d'écran** de la page de debug complète
2. **Console du navigateur** (F12 → Console)
3. **Erreur exacte** lors du test d'insertion
4. **Votre rôle** affiché dans la section authentification

---

## 🎯 CHECKLIST RAPIDE

- [ ] Fichier de debug configuré avec les bonnes clés
- [ ] Connecté en tant qu'admin/superuser
- [ ] Table `urgent_announcements` existe
- [ ] Politiques RLS configurées
- [ ] Test d'insertion réussi
- [ ] Interface admin fonctionne

---

## 💡 ASTUCES

### Vérifier rapidement votre rôle
```sql
SELECT id, email, role FROM profiles WHERE email = 'VOTRE_EMAIL';
```

### Vérifier les politiques RLS
```sql
SELECT * FROM pg_policies WHERE tablename = 'urgent_announcements';
```

### Voir les annonces existantes
```sql
SELECT * FROM urgent_announcements ORDER BY created_at DESC;
```

---

## 🔧 COMMANDES UTILES

### Réinitialiser complètement les politiques
```sql
-- Supprimer toutes les politiques
DROP POLICY IF EXISTS "Anyone can read active announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can read announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON urgent_announcements;

-- Recréer les bonnes politiques
-- (Voir fix_announcements_policies.sql)
```

### Vérifier la structure de la table
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'urgent_announcements'
ORDER BY ordinal_position;
```

---

## ✅ RÉSULTAT ATTENDU

Quand tout fonctionne, vous devriez voir:

```
✅ Client Supabase initialisé
✅ CONNECTÉ (Rôle: admin)
✅ Table urgent_announcements existe
✅ Lecture autorisée
✅ Insertion autorisée
✅ INSERTION RÉUSSIE!
```

Et dans l'interface admin, vous pouvez créer des annonces sans erreur.
