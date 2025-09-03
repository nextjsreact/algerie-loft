# 🖼️ Configuration des Images - LoftAlgerie

## Problème Résolu : Images Supabase

### Erreur Rencontrée
```
Error: Invalid src prop (https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/...) on `next/image`, hostname "mhngbluefyucoesgcjoy.supabase.co" is not configured under images in your `next.config.js`
```

### Solution Appliquée

Dans `next.config.mjs`, nous avons configuré les `remotePatterns` pour autoriser les images Supabase :

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
    {
      protocol: 'https',
      hostname: 'mhngbluefyucoesgcjoy.supabase.co',
      port: '',
      pathname: '/**',
    }
  ],
  formats: ['image/webp', 'image/avif'],
  unoptimized: false,
}
```

## Configuration des Images Supabase

### 1. Structure des URLs Supabase Storage
```
https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[path]
```

### 2. Buckets Utilisés
- `loft-photos` - Photos des lofts
- `user-avatars` - Avatars des utilisateurs
- `documents` - Documents et fichiers

### 3. Optimisations Next.js

#### Formats Supportés
- **WebP** - Format moderne, compression optimale
- **AVIF** - Format de nouvelle génération
- **JPEG/PNG** - Formats de fallback

#### Tailles Automatiques
Next.js génère automatiquement plusieurs tailles :
- 16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840

### 4. Utilisation dans les Composants

#### Composant Image Optimisé
```tsx
import Image from 'next/image'

function LoftPhoto({ src, alt, width = 400, height = 300 }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="rounded-lg object-cover"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    />
  )
}
```

#### Gestion des Erreurs d'Images
```tsx
function SafeImage({ src, alt, fallback = '/images/placeholder.jpg' }) {
  const [imgSrc, setImgSrc] = useState(src)

  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallback)}
      width={400}
      height={300}
    />
  )
}
```

## Configuration Supabase Storage

### 1. Politiques RLS (Row Level Security)

```sql
-- Politique pour la lecture publique des photos de lofts
CREATE POLICY "Public read access for loft photos" ON storage.objects
FOR SELECT USING (bucket_id = 'loft-photos');

-- Politique pour l'upload par les utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload loft photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'loft-photos' 
  AND auth.role() = 'authenticated'
);
```

### 2. Configuration des Buckets

```javascript
// Créer un bucket pour les photos de lofts
const { data, error } = await supabase.storage.createBucket('loft-photos', {
  public: true,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  fileSizeLimit: 5242880, // 5MB
})
```

## Performance et Optimisation

### 1. Lazy Loading
```tsx
<Image
  src={photoUrl}
  alt="Loft photo"
  loading="lazy" // Chargement différé
  priority={false} // Sauf pour les images above-the-fold
/>
```

### 2. Placeholder Blur
```tsx
<Image
  src={photoUrl}
  alt="Loft photo"
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,..."
/>
```

### 3. Responsive Images
```tsx
<Image
  src={photoUrl}
  alt="Loft photo"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  fill
  className="object-cover"
/>
```

## Troubleshooting

### Erreurs Communes

1. **Hostname not configured**
   - Ajouter le domaine dans `remotePatterns`
   - Redéployer l'application

2. **Images ne se chargent pas**
   - Vérifier les politiques RLS Supabase
   - Confirmer que le bucket est public

3. **Performance lente**
   - Utiliser les formats WebP/AVIF
   - Implémenter le lazy loading
   - Optimiser les tailles d'images

### Commandes de Debug

```bash
# Vérifier la configuration Next.js
npm run build

# Analyser les images
npx @next/bundle-analyzer

# Tester les URLs Supabase
curl -I https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/test.jpg
```

## Bonnes Pratiques

### 1. Nommage des Fichiers
```
loft-photos/
├── lofts/
│   ├── [loft-id]/
│   │   ├── main.jpg
│   │   ├── gallery-1.jpg
│   │   └── gallery-2.jpg
└── thumbnails/
    └── [loft-id]/
        └── thumb.jpg
```

### 2. Compression Avant Upload
```javascript
// Compresser l'image avant upload
import imageCompression from 'browser-image-compression';

const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
});
```

### 3. Génération de Thumbnails
```javascript
// Fonction Supabase Edge pour générer des thumbnails
export default async function handler(req) {
  const { data } = await supabase.storage
    .from('loft-photos')
    .download(req.query.path)
  
  // Redimensionner et retourner
  const resized = await sharp(data)
    .resize(300, 200)
    .webp()
    .toBuffer()
    
  return new Response(resized, {
    headers: { 'Content-Type': 'image/webp' }
  })
}
```

---

✅ **Configuration terminée !** Les images Supabase sont maintenant correctement optimisées et sécurisées.