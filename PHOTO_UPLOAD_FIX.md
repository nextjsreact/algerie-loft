# 🔧 Résolution Problème Upload Photos

## 🚨 Problème
L'upload de photos pour les lofts échoue avec une erreur à la ligne 54 de `photo-upload.tsx`.

## 🎯 Solution Rapide

### Option 1: Script Automatique (Windows)
```powershell
.\scripts\fix-photo-upload.ps1
```

### Option 2: Test Manuel
1. Allez sur: **http://localhost:3000/simple-test**
2. Suivez les instructions à l'écran
3. Résolvez les problèmes identifiés

## 🔍 Diagnostic

### Étape 1: Vérifier l'État
- Allez sur `http://localhost:3000/simple-test`
- Regardez la section "État de la Configuration"
- Notez les éléments en rouge ❌

### Étape 2: Résoudre les Problèmes

#### ❌ Table 'loft_photos' manquante
**Solution:**
```bash
supabase db push
```

**Ou manuellement:**
1. Interface Supabase → SQL Editor
2. Copiez le contenu de `scripts/supabase_migrations/27-create-loft-photos-table.sql`
3. Exécutez le SQL

#### ❌ Bucket 'loft-photos' manquant
**Solution:**
1. Interface Supabase → Storage
2. New bucket → Nom: `loft-photos`
3. Cochez "Public bucket"
4. Save

#### ❌ Base de données non connectée
**Solution:**
Vérifiez votre `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Étape 3: Tester
1. Sur `http://localhost:3000/simple-test`
2. Cliquez "Test APIs" → doit être ✅
3. Cliquez "Test Upload" → doit être ✅

## 📁 Fichiers Créés/Modifiés

### Nouveaux Outils de Debug
- `app/simple-test/page.tsx` - Page de test simplifiée
- `components/lofts/upload-test-simple.tsx` - Composant de test
- `components/lofts/db-status-checker.tsx` - Vérificateur de statut
- `app/api/check-db/route.ts` - API de vérification
- `app/api/test-upload/route.ts` - API de test

### Migration
- `scripts/supabase_migrations/27-create-loft-photos-table.sql`

### Scripts
- `scripts/fix-photo-upload.ps1` - Script PowerShell automatique

## 🎯 Test Final

Une fois tout configuré:

1. **Test Simple**: `http://localhost:3000/simple-test` → Tous les tests ✅
2. **Test Réel**: Allez sur une page de loft et uploadez une photo
3. **Vérification**: La photo doit apparaître dans la galerie

## 🆘 Support

Si le problème persiste:

1. **Console du navigateur** (F12) → Onglet Console
2. **Logs du serveur** Next.js dans le terminal
3. **Interface Supabase** → Vérifiez les tables et le storage
4. **Variables d'environnement** → Vérifiez qu'elles sont correctes

## ✅ Checklist de Résolution

- [ ] Variables d'environnement configurées
- [ ] Serveur Next.js démarré (`npm run dev`)
- [ ] Table `loft_photos` créée (migration exécutée)
- [ ] Bucket `loft-photos` créé dans Supabase Storage
- [ ] Test sur `/simple-test` réussi
- [ ] Upload de photo réel testé et fonctionnel

---

**🎉 Une fois cette checklist complète, l'upload de photos devrait fonctionner parfaitement !**