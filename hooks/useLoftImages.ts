'use client';

import { useState, useEffect } from 'react';

interface LoftImage {
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

// Placeholder images with high-quality stock photos
const PLACEHOLDER_IMAGES: LoftImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    alt: 'Loft moderne avec grande baie vitrée',
    title: 'Loft Contemporain',
    description: 'Espace ouvert avec vue panoramique sur la ville'
  },
  {
    src: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
    alt: 'Cuisine moderne dans loft industriel',
    title: 'Cuisine Design',
    description: 'Cuisine équipée avec îlot central et finitions haut de gamme'
  },
  {
    src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2058&q=80',
    alt: 'Salon spacieux avec décoration moderne',
    title: 'Espace de Vie',
    description: 'Salon lumineux avec mobilier contemporain et art moderne'
  },
  {
    src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    alt: 'Chambre élégante avec vue',
    title: 'Suite Principale',
    description: 'Chambre spacieuse avec dressing et salle de bain privée'
  },
  {
    src: 'https://images.unsplash.com/photo-1571624436279-b272aff752b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80',
    alt: 'Salle de bain luxueuse',
    title: 'Salle de Bain Premium',
    description: 'Salle de bain moderne avec baignoire et douche italienne'
  },
  {
    src: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    alt: 'Terrasse avec vue panoramique',
    title: 'Terrasse Privée',
    description: 'Espace extérieur avec mobilier de jardin et vue imprenable'
  }
];

// Fallback local placeholder images (simple colored rectangles)
const LOCAL_PLACEHOLDER_IMAGES: LoftImage[] = [
  {
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+8J+PoSBMb2Z0IENvbnRlbXBvcmFpbjwvdGV4dD4KPGR1ZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8wXzEiIHgxPSIwIiB5MT0iMCIgeDI9IjE5MjAiIHkyPSIxMDgwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+',
    alt: 'Loft moderne avec grande baie vitrée',
    title: 'Loft Contemporain',
    description: 'Espace ouvert avec vue panoramique sur la ville'
  },
  {
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+8J+NsyBDdWlzaW5lIERlc2lnbjwvdGV4dD4KPGR1ZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8wXzEiIHgxPSIwIiB5MT0iMCIgeDI9IjE5MjAiIHkyPSIxMDgwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNmMDkzZmIiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZjU1NzZjIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+',
    alt: 'Cuisine moderne dans loft industriel',
    title: 'Cuisine Design',
    description: 'Cuisine équipée avec îlot central et finitions haut de gamme'
  },
  {
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+8J+PoSBFc3BhY2UgZGUgVmllPC90ZXh0Pgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzBfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMTkyMCIgeTI9IjEwODAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzRmYWNmZSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMGYyZmUiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=',
    alt: 'Salon spacieux avec décoration moderne',
    title: 'Espace de Vie',
    description: 'Salon lumineux avec mobilier contemporain et art moderne'
  }
];

// Supported image formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

export const useLoftImages = () => {
  const [images, setImages] = useState<LoftImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch images from the loft-images directory
        const customImages = await fetchCustomImages();
        
        if (customImages.length > 0) {
          setImages(customImages);
        } else {
          // Try Unsplash images first, fallback to local if needed
          try {
            setImages(PLACEHOLDER_IMAGES);
          } catch (unsplashError) {
            console.warn('Unsplash images failed, using local placeholders');
            setImages(LOCAL_PLACEHOLDER_IMAGES);
          }
        }
      } catch (err) {
        console.warn('Error loading custom images, using placeholders:', err);
        try {
          setImages(PLACEHOLDER_IMAGES);
          setError('Unable to load custom images, using online placeholders');
        } catch (unsplashError) {
          console.warn('Unsplash images also failed, using local placeholders');
          setImages(LOCAL_PLACEHOLDER_IMAGES);
          setError('Using local placeholder images');
        }
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  const fetchCustomImages = async (): Promise<LoftImage[]> => {
    try {
      // In a real implementation, you would fetch the list of files from an API endpoint
      // For now, we'll try to load some common image names
      const commonNames = [
        'loft-1', 'loft-2', 'loft-3', 'loft-4', 'loft-5',
        'interior-1', 'interior-2', 'interior-3',
        'kitchen', 'bedroom', 'bathroom', 'living-room', 'terrace'
      ];

      const customImages: LoftImage[] = [];

      for (const name of commonNames) {
        for (const format of SUPPORTED_FORMATS) {
          try {
            const imagePath = `/loft-images/${name}${format}`;
            
            // Check if image exists by trying to load it
            const imageExists = await checkImageExists(imagePath);
            
            if (imageExists) {
              customImages.push({
                src: imagePath,
                alt: `Loft image ${name}`,
                title: formatImageTitle(name),
                description: generateImageDescription(name)
              });
              break; // Found image with this name, move to next
            }
          } catch {
            // Continue to next format
            continue;
          }
        }
      }

      return customImages;
    } catch (error) {
      console.error('Error fetching custom images:', error);
      return [];
    }
  };

  const checkImageExists = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  const formatImageTitle = (name: string): string => {
    const titleMap: Record<string, string> = {
      'loft-1': 'Loft Principal',
      'loft-2': 'Loft Moderne',
      'loft-3': 'Loft Contemporain',
      'loft-4': 'Loft Design',
      'loft-5': 'Loft Premium',
      'interior-1': 'Intérieur Élégant',
      'interior-2': 'Décoration Moderne',
      'interior-3': 'Espace Raffiné',
      'kitchen': 'Cuisine Équipée',
      'bedroom': 'Chambre Confortable',
      'bathroom': 'Salle de Bain',
      'living-room': 'Salon Spacieux',
      'terrace': 'Terrasse Privée'
    };

    return titleMap[name] || name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const generateImageDescription = (name: string): string => {
    const descriptionMap: Record<string, string> = {
      'loft-1': 'Espace de vie principal avec design contemporain',
      'loft-2': 'Architecture moderne et finitions haut de gamme',
      'loft-3': 'Ambiance chaleureuse et équipements modernes',
      'loft-4': 'Design sophistiqué et confort optimal',
      'loft-5': 'Luxe et élégance dans chaque détail',
      'interior-1': 'Décoration soignée et mobilier de qualité',
      'interior-2': 'Style moderne et atmosphère accueillante',
      'interior-3': 'Raffinement et attention aux détails',
      'kitchen': 'Cuisine entièrement équipée avec électroménager moderne',
      'bedroom': 'Chambre spacieuse avec literie de qualité',
      'bathroom': 'Salle de bain moderne avec équipements premium',
      'living-room': 'Salon confortable avec espace de détente',
      'terrace': 'Espace extérieur avec vue et mobilier de jardin'
    };

    return descriptionMap[name] || 'Espace élégant et confortable';
  };

  const refreshImages = async () => {
    setLoading(true);
    const customImages = await fetchCustomImages();
    
    if (customImages.length > 0) {
      setImages(customImages);
    } else {
      setImages(PLACEHOLDER_IMAGES);
    }
    
    setLoading(false);
  };

  return {
    images,
    loading,
    error,
    refreshImages,
    hasCustomImages: images.length > 0 && !images.some(img => img.src.includes('unsplash.com'))
  };
};