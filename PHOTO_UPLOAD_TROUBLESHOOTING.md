# Guide de Résolution - Upload Photos Lofts

## Problème Identifié
L'upload de photos pour les lofts échoue à la ligne 51 du composant `photo-upload.tsx`.

## Solutions Implémentées

### 1. Migration Base de Données
**Fichier**: `scripts/supabase_migrations/27-create-loft-photos-table.sql`

Cette migration crée:
- Table `loft_photos` avec toutes les colonnes nécessaires
- Index pour optimiser les performances
- Politiques RLS (Row Level Security)
- Bucket de stockage `loft-photos`
- Politiques de stockage

**Pour exécuter la migration:**
```bash
# Option 1: Via Supabase CLI (recommandé)
supabase db push

# Option 2: Via le script Node.js
node scripts/run-loft-photos-migration.js

# Option 3: Manuellement dans l'interface Supabase
# Copiez le contenu du fichier SQL dans l'éditeur SQL de Supabase
```

### 2. Amélioration du Composant
**Fichier**: `components/lofts/photo-upload.tsx`

Améliorations apportées:
- Meilleure gestion des erreurs avec messages détaillés
- Gestion des erreurs réseau
- Messages d'erreur plus informatifs
- Logging amélioré pour le debug

### 3. Outil de Diagnostic
**Fichiers**: 
- `components/lofts/photo-upload-debug.tsx`
- `app/debug/photo-upload/page.tsx`

**Accès**: `http://localhost:3000/debug/photo-upload`

Cet outil teste:
- Accessibilité de l'API d'upload
- Authentification utilisateur
- Validation des types de fichiers
- Réponses d'erreur appropriées

## Étapes de Résolution

### Étape 1: Vérifier la Base de Données
1. Connectez-vous à votre interface Supabase
2. Vérifiez que la table `loft_photos` existe
3. Vérifiez que le bucket `loft-photos` existe dans Storage

### Étape 2: Exécuter la Migration
Si la table n'existe pas:
```bash
# Naviguez vers le dossier du projet
cd /path/to/your/project

# Exécutez la migration
supabase db push
```

### Étape 3: Tester l'Upload
1. Allez sur `http://localhost:3000/debug/photo-upload`
2. Cliquez sur "Lancer le diagnostic"
3. Analysez les résultats

### Étape 4: Vérifier les Variables d'Environnement
Assurez-vous que ces variables sont définies:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Erreurs Communes et Solutions

### Erreur: "Table 'loft_photos' doesn't exist"
**Solution**: Exécuter la migration (Étape 2)

### Erreur: "Bucket 'loft-photos' not found"
**Solution**: 
1. Aller dans Supabase Storage
2. Créer un nouveau bucket nommé `loft-photos`
3. Le rendre public

### Erreur: "Authentication required"
**Solution**: 
1. Vérifier que l'utilisateur est connecté
2. Vérifier les politiques RLS sur la table `loft_photos`

### Erreur: "File too large"
**Solution**: 
1. Vérifier que le fichier fait moins de 5MB
2. Ajuster la limite dans le code si nécessaire

### Erreur: "Invalid file type"
**Solution**: 
1. Utiliser uniquement des images (JPG, PNG, WebP)
2. Vérifier le type MIME du fichier

## Vérifications Post-Installation

### 1. Test Manuel
1. Aller sur une page de loft
2. Essayer d'uploader une photo
3. Vérifier que la photo apparaît dans la galerie

### 2. Vérification Base de Données
```sql
-- Vérifier que la table existe
SELECT * FROM information_schema.tables WHERE table_name = 'loft_photos';

-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'loft_photos';
```

### 3. Vérification Storage
1. Aller dans Supabase Storage
2. Vérifier que le bucket `loft-photos` existe
3. Vérifier les politiques du bucket

## Support Supplémentaire

Si le problème persiste:
1. Vérifiez les logs du serveur Next.js
2. Vérifiez les logs dans la console du navigateur
3. Utilisez l'outil de diagnostic pour identifier le problème exact
4. Vérifiez la configuration Supabase

## Fichiers Modifiés/Créés

### Nouveaux Fichiers
- `scripts/supabase_migrations/27-create-loft-photos-table.sql`
- `scripts/run-loft-photos-migration.js`
- `components/lofts/photo-upload-debug.tsx`
- `app/debug/photo-upload/page.tsx`

### Fichiers Modifiés
- `components/lofts/photo-upload.tsx` (amélioration gestion erreurs)

### Traductions
Les traductions pour les photos sont déjà présentes dans `public/locales/fr/lofts.json`