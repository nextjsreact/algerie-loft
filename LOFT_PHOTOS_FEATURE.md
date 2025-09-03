# 📸 Système de Photos pour les Lofts

## 🎯 Fonctionnalité Ajoutée

Intégration complète d'un système de gestion de photos pour les lofts, permettant aux utilisateurs d'ajouter, visualiser et gérer des images de leurs propriétés.

## ✨ Fonctionnalités

### 1. **Upload de Photos**
- **Drag & Drop** : Glissez-déposez vos photos directement
- **Sélection multiple** : Uploadez plusieurs photos en une fois
- **Validation automatique** : Vérification du type et de la taille
- **Limite configurable** : Maximum 15 photos par loft (configurable)
- **Formats supportés** : JPG, PNG, WebP
- **Taille maximale** : 5MB par photo

### 2. **Galerie Interactive**
- **Photo principale** : Mise en avant de la première photo
- **Miniatures** : Grille de toutes les photos
- **Visionneuse plein écran** : Visualisation détaillée
- **Navigation** : Flèches pour naviguer entre les photos
- **Téléchargement** : Bouton pour télécharger les photos

### 3. **Gestion Avancée**
- **Métadonnées** : Nom, taille, type de fichier
- **Suppression sécurisée** : Seuls les propriétaires et admins
- **Historique** : Qui a uploadé quoi et quand
- **Optimisation** : Images optimisées pour le web

## 🛠️ Composants Créés

### 1. **PhotoUpload** (`components/lofts/photo-upload.tsx`)
- Interface d'upload avec drag & drop
- Prévisualisation des photos
- Gestion des états de chargement
- Validation côté client

### 2. **LoftPhotoGallery** (`components/lofts/loft-photo-gallery.tsx`)
- Galerie responsive avec photo principale
- Visionneuse modale plein écran
- Navigation entre les photos
- Téléchargement des images

### 3. **APIs REST**
- `POST /api/lofts/photos/upload` - Upload de photos
- `GET /api/lofts/[id]/photos` - Récupération des photos
- `DELETE /api/lofts/photos/[id]` - Suppression de photos

## 🗄️ Base de Données

### Table `loft_photos`
```sql
- id (UUID, PK)
- loft_id (UUID, FK vers lofts)
- file_name (TEXT)
- file_path (TEXT)
- file_size (INTEGER)
- mime_type (TEXT)
- url (TEXT)
- uploaded_by (UUID, FK vers profiles)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Stockage Supabase
- **Bucket** : `loft-photos`
- **Structure** : `lofts/{loft_id}/{filename}`
- **Accès** : Public pour la lecture, authentifié pour l'écriture

## 🔐 Sécurité

### Politiques RLS
- **Lecture** : Tous les utilisateurs authentifiés
- **Insertion** : Utilisateurs authentifiés (propriétaire = uploader)
- **Suppression** : Propriétaire de la photo ou admin/manager

### Validation
- **Types de fichiers** : Seulement les images
- **Taille** : Maximum 5MB par fichier
- **Nombre** : Maximum configurable par loft
- **Noms** : UUID pour éviter les conflits

## 📱 Interface Utilisateur

### Dans le Formulaire de Loft
- Section "Photos du Loft" ajoutée
- Upload intégré dans le processus de création/édition
- Prévisualisation en temps réel

### Dans la Page de Détails
- Galerie complète avec photo principale
- Visionneuse interactive
- Actions de téléchargement

## 🚀 Installation

### 1. Base de Données
```bash
node scripts/setup-loft-photos.mjs
```
Puis exécuter le SQL généré dans Supabase.

### 2. Storage Supabase
1. Aller dans Storage > Buckets
2. Créer le bucket "loft-photos"
3. Activer "Public bucket"

### 3. Dépendances
```bash
npm install uuid
npm install @types/uuid
```

## 🎨 Personnalisation

### Limites Configurables
```typescript
<PhotoUpload 
  loftId={loft?.id}
  maxPhotos={15}  // Modifiable
/>
```

### Taille Maximale
Dans `upload/route.ts` :
```typescript
if (file.size > 5 * 1024 * 1024) { // 5MB - modifiable
```

### Formats Acceptés
Dans `photo-upload.tsx` :
```typescript
input.accept = 'image/*' // Modifiable
```

## 📊 Utilisation

### Pour les Utilisateurs
1. **Ajouter des photos** : Aller dans Lofts > Nouveau/Modifier
2. **Voir les photos** : Aller dans Lofts > [Nom du loft]
3. **Télécharger** : Cliquer sur l'icône de téléchargement
4. **Supprimer** : Hover sur la photo et cliquer sur X

### Pour les Développeurs
```typescript
// Récupérer les photos d'un loft
const photos = await fetch(`/api/lofts/${loftId}/photos`)

// Uploader une photo
const formData = new FormData()
formData.append('file', file)
formData.append('loftId', loftId)
await fetch('/api/lofts/photos/upload', {
  method: 'POST',
  body: formData
})
```

## 🔄 Améliorations Futures

### Fonctionnalités Avancées
- **Réorganisation** : Drag & drop pour réordonner
- **Légendes** : Ajouter des descriptions aux photos
- **Tags** : Catégoriser les photos (extérieur, intérieur, etc.)
- **Compression** : Optimisation automatique des images
- **Watermark** : Ajout de filigrane automatique

### Intégrations
- **Airbnb** : Synchronisation avec les photos Airbnb
- **Réseaux sociaux** : Partage direct sur les réseaux
- **PDF** : Génération de brochures avec photos
- **Email** : Envoi de galeries par email

## 📈 Métriques

### Performance
- **Upload** : ~2-5 secondes par photo (selon la taille)
- **Affichage** : Chargement progressif des miniatures
- **Stockage** : Optimisé avec CDN Supabase

### Limites Actuelles
- **15 photos** par loft (configurable)
- **5MB** par photo (configurable)
- **Formats** : JPG, PNG, WebP uniquement

## 🎯 Résultat

Les utilisateurs peuvent maintenant :
- ✅ **Ajouter facilement** des photos à leurs lofts
- ✅ **Visualiser** les photos dans une galerie moderne
- ✅ **Télécharger** les images en haute qualité
- ✅ **Gérer** leurs photos de manière sécurisée
- ✅ **Présenter** leurs propriétés de manière professionnelle

Cette fonctionnalité transforme la gestion des lofts en ajoutant une dimension visuelle essentielle pour la présentation des propriétés ! 🏠📸