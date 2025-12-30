/**
 * Configuration complète des lofts recommandés
 * 
 * Ce fichier contient TOUT le contenu des lofts :
 * - Titres (FR, EN, AR)
 * - Descriptions (FR, EN, AR)
 * - Localisations (FR, EN, AR)
 * - Prix et devise
 * - Notes et avis
 * - Équipements
 * - Photos (via featured-lofts-images.ts)
 * 
 * Pour modifier un loft, changez simplement les valeurs ci-dessous.
 */

import { getLoftImage } from './featured-lofts-images';

export interface LoftContent {
  id: number;
  title: {
    fr: string;
    en: string;
    ar: string;
  };
  location: {
    fr: string;
    en: string;
    ar: string;
  };
  description: {
    fr: string;
    en: string;
    ar: string;
  };
  price: number;
  currency: string;
  rating: number;
  reviews: number;
  amenities: string[];
  image: string;
}

export const featuredLofts: LoftContent[] = [
  // ========================================
  // LOFT 1 : Hydra, Alger
  // ========================================
  {
    id: 1,
    
    // Titre du loft (affiché en gros)
    title: {
      fr: "Loft Moderne Hydra - Vue Panoramique",
      en: "Modern Hydra Loft - Panoramic View",
      ar: "شقة حديثة في حيدرة - إطلالة بانورامية"
    },
    
    // Localisation (affichée avec l'icône de pin)
    location: {
      fr: "Hydra, Alger",
      en: "Hydra, Algiers",
      ar: "حيدرة، الجزائر"
    },
    
    // Description (texte sous le titre)
    description: {
      fr: "Magnifique loft de 120m² avec terrasse privée et vue imprenable sur la baie d'Alger.",
      en: "Beautiful 120m² loft with private terrace and stunning view of Algiers bay.",
      ar: "شقة جميلة 120 متر مربع مع تراس خاص وإطلالة خلابة على خليج الجزائر."
    },
    
    // Prix par nuit
    price: 25000,
    
    // Devise (DZD, EUR, USD)
    currency: "DZD",
    
    // Note moyenne (sur 5)
    rating: 4.8,
    
    // Nombre d'avis
    reviews: 127,
    
    // Équipements disponibles
    // Options : 'Wifi', 'Car', 'Coffee', 'Tv'
    amenities: ['Wifi', 'Car', 'Coffee', 'Tv'],
    
    // Photo (gérée dans featured-lofts-images.ts)
    image: getLoftImage('loft1')
  },

  // ========================================
  // LOFT 2 : Oran Centre
  // ========================================
  {
    id: 2,
    
    title: {
      fr: "Penthouse Luxury Oran Centre",
      en: "Luxury Penthouse Oran Center",
      ar: "بنتهاوس فاخر وسط وهران"
    },
    
    location: {
      fr: "Centre-ville, Oran",
      en: "City Center, Oran",
      ar: "وسط المدينة، وهران"
    },
    
    description: {
      fr: "Penthouse exceptionnel de 180m² au cœur d'Oran. Design contemporain, 3 chambres.",
      en: "Exceptional 180m² penthouse in the heart of Oran. Contemporary design, 3 bedrooms.",
      ar: "بنتهاوس استثنائي 180 متر مربع في قلب وهران. تصميم معاصر، 3 غرف نوم."
    },
    
    price: 45000,
    currency: "DZD",
    rating: 4.9,
    reviews: 89,
    amenities: ['Wifi', 'Car', 'Coffee', 'Tv'],
    image: getLoftImage('loft2')
  },

  // ========================================
  // LOFT 3 : Constantine
  // ========================================
  {
    id: 3,
    
    title: {
      fr: "Loft Artistique Constantine",
      en: "Artistic Loft Constantine",
      ar: "شقة فنية في قسنطينة"
    },
    
    location: {
      fr: "Vieille ville, Constantine",
      en: "Old City, Constantine",
      ar: "المدينة القديمة، قسنطينة"
    },
    
    description: {
      fr: "Loft unique de 95m² dans un bâtiment historique rénové. Plafonds hauts.",
      en: "Unique 95m² loft in a renovated historic building. High ceilings.",
      ar: "شقة فريدة 95 متر مربع في مبنى تاريخي مجدد. أسقف عالية."
    },
    
    price: 18000,
    currency: "DZD",
    rating: 4.7,
    reviews: 156,
    amenities: ['Wifi', 'Coffee', 'Tv'],
    image: getLoftImage('loft3')
  }
];

/**
 * Équipements disponibles
 * 
 * Pour ajouter un nouvel équipement :
 * 1. Ajoutez-le ici avec son icône
 * 2. Ajoutez-le dans le tableau amenities du loft
 * 3. L'icône s'affichera automatiquement
 */
export const availableAmenities = {
  Wifi: { icon: 'Wifi', label: { fr: 'WiFi', en: 'WiFi', ar: 'واي فاي' } },
  Car: { icon: 'Car', label: { fr: 'Parking', en: 'Parking', ar: 'موقف سيارات' } },
  Coffee: { icon: 'Coffee', label: { fr: 'Café', en: 'Coffee', ar: 'قهوة' } },
  Tv: { icon: 'Tv', label: { fr: 'TV', en: 'TV', ar: 'تلفزيون' } },
};
