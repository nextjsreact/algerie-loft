'use client';

import { useState, useEffect } from 'react';

interface LoftImage {
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

// Images locales confirmées comme existantes dans /public/loft-images/
// Cette liste est basée sur les fichiers réellement présents dans le répertoire
const CONFIRMED_LOCAL_IMAGES: LoftImage[] = [
  {
    src: '/loft-images/loft-1.jpg',
    alt: 'Loft principal avec vue panoramique',
    title: 'Loft Principal',
    description: 'Espace de vie principal avec design contemporain et vue imprenable'
  },
  {
    src: '/loft-images/kitchen.jpg',
    alt: 'Cuisine moderne équipée',
    title: 'Cuisine Design',
    description: 'Cuisine entièrement équipée avec électroménager moderne et îlot central'
  },
  {
    src: '/loft-images/living-room.jpg',
    alt: 'Salon spacieux et lumineux',
    title: 'Salon Contemporain',
    description: 'Salon confortable avec espace de détente et décoration moderne'
  },
  {
    src: '/loft-images/bedroom.jpg',
    alt: 'Chambre confortable et élégante',
    title: 'Chambre Cosy',
    description: 'Chambre spacieuse avec literie de qualité et ambiance chaleureuse'
  },
  {
    src: '/loft-images/bathroom.jpg',
    alt: 'Salle de bain moderne',
    title: 'Salle de Bain Premium',
    description: 'Salle de bain moderne avec équipements premium et finitions soignées'
  },
  {
    src: '/loft-images/terrace.jpg',
    alt: 'Terrasse avec vue panoramique',
    title: 'Terrasse Privée',
    description: 'Espace extérieur avec mobilier de jardin et vue panoramique sur la ville'
  }
];

// Images de secours avec placeholders SVG élégants
const FALLBACK_PLACEHOLDER_IMAGES: LoftImage[] = [
  {
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+8J+PoSBMb2Z0IFByaW5jaXBhbDwvdGV4dD4KPGR1ZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8wXzEiIHgxPSIwIiB5MT0iMCIgeDI9IjE5MjAiIHkyPSIxMDgwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+',
    alt: 'Loft principal avec vue panoramique',
    title: 'Loft Principal',
    description: 'Espace de vie principal avec design contemporain'
  },
  {
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+8J+NsyBDdWlzaW5lIERlc2lnbjwvdGV4dD4KPGR1ZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8wXzEiIHgxPSIwIiB5MT0iMCIgeDI9IjE5MjAiIHkyPSIxMDgwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNmMDkzZmIiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZjU1NzZjIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+',
    alt: 'Cuisine moderne équipée',
    title: 'Cuisine Design',
    description: 'Cuisine équipée avec électroménager moderne'
  },
  {
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+8J+PoSBTYWxvbiBDb250ZW1wb3JhaW48L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjNGZhY2ZlIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAwZjJmZSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg==',
    alt: 'Salon spacieux et lumineux',
    title: 'Salon Contemporain',
    description: 'Salon confortable avec espace de détente'
  },
  {
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+8J+PoSBDaGFtYnJlIENvc3k8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjZmY3MDg1Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZmNDA5NCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg==',
    alt: 'Chambre confortable et élégante',
    title: 'Chambre Cosy',
    description: 'Chambre spacieuse avec literie de qualité'
  },
  {
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+8J+PoSBTYWxsZSBkZSBCYWluPC90ZXh0Pgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzBfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMTkyMCIgeTI9IjEwODAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzEwYjk4MSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwNTk2NjkiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=',
    alt: 'Salle de bain moderne',
    title: 'Salle de Bain Premium',
    description: 'Salle de bain moderne avec équipements premium'
  },
  {
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+8J+PoSBUZXJyYXNzZSBQcml2w6llPC90ZXh0Pgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzBfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMTkyMCIgeTI9IjEwODAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI2Y1OWU0YiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmMzc0MTYiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=',
    alt: 'Terrasse avec vue panoramique',
    title: 'Terrasse Privée',
    description: 'Espace extérieur avec vue panoramique'
  }
];

export const useLoftImages = () => {
  const [images, setImages] = useState<LoftImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = () => {
      try {
        setLoading(true);
        setError(null);

        // Utilise directement les images locales confirmées
        // Plus besoin de tester leur existence côté client
        setImages(CONFIRMED_LOCAL_IMAGES);
        
        console.log('✅ Images locales chargées directement:', CONFIRMED_LOCAL_IMAGES.length);
      } catch (err) {
        console.warn('⚠️ Erreur lors du chargement des images locales, utilisation des placeholders:', err);
        setImages(FALLBACK_PLACEHOLDER_IMAGES);
        setError('Utilisation des images de secours');
      } finally {
        setLoading(false);
      }
    };

    // Chargement immédiat sans requêtes réseau
    loadImages();
  }, []);

  const refreshImages = () => {
    setLoading(true);
    
    try {
      // Recharge les images locales confirmées
      setImages(CONFIRMED_LOCAL_IMAGES);
      setError(null);
      console.log('🔄 Images rechargées avec succès');
    } catch (err) {
      console.warn('⚠️ Erreur lors du rechargement, utilisation des placeholders:', err);
      setImages(FALLBACK_PLACEHOLDER_IMAGES);
      setError('Utilisation des images de secours');
    } finally {
      setLoading(false);
    }
  };

  const getImageByType = (type: 'loft' | 'kitchen' | 'living-room' | 'bedroom' | 'bathroom' | 'terrace'): LoftImage | undefined => {
    const typeMap: Record<string, string> = {
      'loft': '/loft-images/loft-1.jpg',
      'kitchen': '/loft-images/kitchen.jpg',
      'living-room': '/loft-images/living-room.jpg',
      'bedroom': '/loft-images/bedroom.jpg',
      'bathroom': '/loft-images/bathroom.jpg',
      'terrace': '/loft-images/terrace.jpg'
    };

    return images.find(img => img.src === typeMap[type]);
  };

  const getRandomImage = (): LoftImage => {
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex] || images[0];
  };

  return {
    images,
    loading,
    error,
    refreshImages,
    getImageByType,
    getRandomImage,
    hasCustomImages: true, // Toujours true car on utilise les images locales confirmées
    totalImages: images.length
  };
};