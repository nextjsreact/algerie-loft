// Lofts are now loaded dynamically from the database
// This file is kept for type definitions only

export interface LoftContent {
  id: number;
  title: { fr: string; en: string; ar: string };
  location: { fr: string; en: string; ar: string };
  description: { fr: string; en: string; ar: string };
  price: number;
  currency: string;
  rating: number;
  reviews: number;
  amenities: string[];
  image: string;
}

// Empty — real lofts come from the database via /api/public/featured-lofts
export const featuredLofts: LoftContent[] = [];

export const availableAmenities = {
  Wifi: { icon: 'Wifi', label: { fr: 'WiFi', en: 'WiFi', ar: 'واي فاي' } },
  Car: { icon: 'Car', label: { fr: 'Parking', en: 'Parking', ar: 'موقف سيارات' } },
  Coffee: { icon: 'Coffee', label: { fr: 'Café', en: 'Coffee', ar: 'قهوة' } },
  Tv: { icon: 'Tv', label: { fr: 'TV', en: 'TV', ar: 'تلفزيون' } },
};
