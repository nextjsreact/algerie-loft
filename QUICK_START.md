# 🚀 Démarrage Rapide - Résolution Upload Photos

## 🎯 Problème
L'upload de photos pour les lofts ne fonctionne pas.

## ⚡ Solution en 3 Étapes

### 1️⃣ Test Rapide
Allez sur: **http://localhost:3000/basic-test**

### 2️⃣ Cliquez sur "Test Configuration"
- ✅ Tout vert = Parfait !
- ❌ Rouge = Suivez les instructions

### 3️⃣ Résolvez les Problèmes

#### Si "Table loft_photos manquante" ❌
```bash
supabase db push
```

#### Si "Bucket loft-photos manquant" ❌
1. Interface Supabase → Storage
2. New bucket → `loft-photos`
3. Cochez "Public"

#### Si "Base de données non connectée" ❌
Vérifiez `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## ✅ Test Final
1. Retournez sur `http://localhost:3000/basic-test`
2. "Test Configuration" → Tout ✅
3. "Test avec Fichier" → Upload réussi ✅

## 🎉 C'est Fini !
L'upload de photos fonctionne maintenant dans votre application !

---

**⏱️ Temps estimé: 2-5 minutes**