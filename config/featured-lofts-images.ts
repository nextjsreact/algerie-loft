/**
 * Configuration des images pour les lofts recommandés sur la page d'accueil
 * 
 * Pour changer les photos :
 * 1. Remplacez les URLs ci-dessous par vos nouvelles images
 * 2. Sauvegardez le fichier
 * 3. Les changements apparaîtront automatiquement
 * 
 * Sources d'images recommandées :
 * - Unsplash : https://unsplash.com (photos gratuites haute qualité)
 * - Vos propres photos dans /public/lofts/
 */

export const featuredLoftsImages = {
  // Loft 1 : Hydra, Alger
  loft1: {
    // URL actuelle (Unsplash)
    current: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop",
    
    // Alternatives suggérées (décommentez pour utiliser)
    // alternative1: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop",
    // alternative2: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop",
    // local: "/lofts/hydra-loft-1.jpg", // Si vous uploadez vos propres photos
  },

  // Loft 2 : Oran Centre
  loft2: {
    current: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop",
    
    // alternative1: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop",
    // alternative2: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop",
    // local: "/lofts/oran-penthouse-1.jpg",
  },

  // Loft 3 : Constantine
  loft3: {
    current: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop",
    
    // alternative1: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop",
    // alternative2: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop",
    // local: "/lofts/constantine-loft-1.jpg",
  },
};

/**
 * Fonction helper pour obtenir l'image actuelle d'un loft
 */
export function getLoftImage(loftKey: keyof typeof featuredLoftsImages): string {
  return featuredLoftsImages[loftKey].current;
}
