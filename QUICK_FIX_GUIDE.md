# Guide de Résolution Rapide - Upload Photos

## 🔍 Diagnostic Rapide

Allez sur: `http://localhost:3000/api/check-db` pour voir l'état actuel.

## 🚀 Solutions Étape par Étape

### Étape 1: Vérifier les Variables d'Environnement

Assurez-vous que votre fichier `.env.local` contient :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Étape 2: Créer le Bucket de Storage

1. Allez dans votre interface Supabase
2. Naviguez vers **Storage**
3. Cliquez sur **New bucket**
4. Nom: `loft-photos`
5. Cochez **Public bucket**
6. Cliquez sur **Save**

### Étape 3: Exécuter la Migration

**Option A - Via Supabase CLI (Recommandé):**
```bash
supabase db push
```

**Option B - Manuellement dans Supabase:**
1. Allez dans votre interface Supabase
2. Naviguez vers **SQL Editor**
3. Copiez le contenu de `scripts/supabase_migrations/27-create-loft-photos-table.sql`
4. Collez et exécutez le SQL

**Option C - Via le script Node.js:**
```bash
node scripts/run-loft-photos-migration.js
```

### Étape 4: Vérifier la Configuration

1. Allez sur `http://localhost:3000/api/check-db`
2. Vérifiez que tous les checks sont ✅
3. Si des ❌ persistent, suivez les recommandations affichées

### Étape 5: Tester l'Upload

1. Allez sur `http://localhost:3000/test-upload`
2. Cliquez sur "Test Automatique"
3. Si ça fonctionne, testez avec un fichier réel

## 🛠️ Résolution des Problèmes Courants

### Problème: "Database not connected"
**Solution:** Vérifiez vos variables d'environnement Supabase

### Problème: "loft_photos table not found"
**Solution:** Exécutez la migration (Étape 3)

### Problème: "loft-photos bucket not found"
**Solution:** Créez le bucket (Étape 2)

### Problème: "Authentication required"
**Solution:** Connectez-vous à l'application avant de tester

## 📋 Checklist de Vérification

- [ ] Variables d'environnement configurées
- [ ] Bucket `loft-photos` créé dans Supabase Storage
- [ ] Migration exécutée (table `loft_photos` créée)
- [ ] API `/api/check-db` retourne tous les checks ✅
- [ ] Test sur `/test-upload` réussi

## 🎯 Test Final

Une fois tout configuré :

1. Allez sur une page de loft existante
2. Essayez d'uploader une photo
3. Vérifiez qu'elle apparaît dans la galerie
4. Vérifiez qu'elle est sauvée dans Supabase Storage

## 📞 Support

Si le problème persiste après ces étapes :

1. Vérifiez les logs de la console du navigateur (F12)
2. Vérifiez les logs du serveur Next.js
3. Utilisez l'outil de diagnostic sur `/debug/photo-upload`