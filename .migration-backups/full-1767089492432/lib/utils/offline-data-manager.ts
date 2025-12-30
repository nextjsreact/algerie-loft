/**
 * Offline Data Manager
 * Handles data fetching with offline fallbacks and caching
 */

import { CacheManager } from '@/lib/performance/enhanced-caching';

export interface OfflineFallbackData {
  lofts: {
    fr: any[];
    en: any[];
    ar: any[];
  };
  testimonials: {
    fr: any[];
    en: any[];
    ar: any[];
  };
  stats: any;
  ownerMetrics: any;
  caseStudies: {
    fr: any[];
    en: any[];
    ar: any[];
  };
}

// Offline fallback data
const OFFLINE_FALLBACK_DATA: OfflineFallbackData = {
  lofts: {
    fr: [
      {
        id: 'offline-loft-1',
        title: 'Loft Moderne Centre-ville',
        location: 'Alger Centre',
        pricePerNight: 8500,
        currency: 'DZD',
        rating: 4.8,
        reviewCount: 24,
        images: ['/loft-images/placeholder-1.jpg'],
        amenities: ['WiFi', 'Climatisation', 'Cuisine équipée', 'Parking'],
        availability: 'available',
        instantBook: true,
        offline: true,
        description: 'Magnifique loft moderne au cœur d\'Alger avec toutes les commodités.'
      },
      {
        id: 'offline-loft-2',
        title: 'Loft Vue Mer Panoramique',
        location: 'Oran Bord de Mer',
        pricePerNight: 12000,
        currency: 'DZD',
        rating: 4.9,
        reviewCount: 18,
        images: ['/loft-images/placeholder-2.jpg'],
        amenities: ['Vue mer', 'Balcon', 'WiFi', 'Climatisation'],
        availability: 'available',
        instantBook: false,
        offline: true,
        description: 'Loft exceptionnel avec vue panoramique sur la mer Méditerranée.'
      },
      {
        id: 'offline-loft-3',
        title: 'Loft Artistique Quartier Historique',
        location: 'Constantine Vieille Ville',
        pricePerNight: 7000,
        currency: 'DZD',
        rating: 4.7,
        reviewCount: 31,
        images: ['/loft-images/placeholder-3.jpg'],
        amenities: ['Design unique', 'WiFi', 'Chauffage', 'Terrasse'],
        availability: 'available',
        instantBook: true,
        offline: true,
        description: 'Loft au design artistique dans le quartier historique de Constantine.'
      }
    ],
    en: [
      {
        id: 'offline-loft-1',
        title: 'Modern Downtown Loft',
        location: 'Algiers Center',
        pricePerNight: 8500,
        currency: 'DZD',
        rating: 4.8,
        reviewCount: 24,
        images: ['/loft-images/placeholder-1.jpg'],
        amenities: ['WiFi', 'Air Conditioning', 'Equipped Kitchen', 'Parking'],
        availability: 'available',
        instantBook: true,
        offline: true,
        description: 'Beautiful modern loft in the heart of Algiers with all amenities.'
      },
      {
        id: 'offline-loft-2',
        title: 'Panoramic Sea View Loft',
        location: 'Oran Seafront',
        pricePerNight: 12000,
        currency: 'DZD',
        rating: 4.9,
        reviewCount: 18,
        images: ['/loft-images/placeholder-2.jpg'],
        amenities: ['Sea View', 'Balcony', 'WiFi', 'Air Conditioning'],
        availability: 'available',
        instantBook: false,
        offline: true,
        description: 'Exceptional loft with panoramic view of the Mediterranean Sea.'
      },
      {
        id: 'offline-loft-3',
        title: 'Artistic Historic Quarter Loft',
        location: 'Constantine Old Town',
        pricePerNight: 7000,
        currency: 'DZD',
        rating: 4.7,
        reviewCount: 31,
        images: ['/loft-images/placeholder-3.jpg'],
        amenities: ['Unique Design', 'WiFi', 'Heating', 'Terrace'],
        availability: 'available',
        instantBook: true,
        offline: true,
        description: 'Artistically designed loft in Constantine\'s historic quarter.'
      }
    ],
    ar: [
      {
        id: 'offline-loft-1',
        title: 'شقة مفروشة حديثة وسط المدينة',
        location: 'وسط الجزائر',
        pricePerNight: 8500,
        currency: 'DZD',
        rating: 4.8,
        reviewCount: 24,
        images: ['/loft-images/placeholder-1.jpg'],
        amenities: ['واي فاي', 'تكييف', 'مطبخ مجهز', 'موقف سيارات'],
        availability: 'available',
        instantBook: true,
        offline: true,
        description: 'شقة مفروشة حديثة رائعة في قلب الجزائر مع جميع وسائل الراحة.'
      },
      {
        id: 'offline-loft-2',
        title: 'شقة مفروشة بإطلالة بحرية بانورامية',
        location: 'وهران الواجهة البحرية',
        pricePerNight: 12000,
        currency: 'DZD',
        rating: 4.9,
        reviewCount: 18,
        images: ['/loft-images/placeholder-2.jpg'],
        amenities: ['إطلالة بحرية', 'شرفة', 'واي فاي', 'تكييف'],
        availability: 'available',
        instantBook: false,
        offline: true,
        description: 'شقة مفروشة استثنائية بإطلالة بانورامية على البحر الأبيض المتوسط.'
      }
    ]
  },
  testimonials: {
    fr: [
      {
        id: 'offline-testimonial-1',
        name: 'Sarah M.',
        rating: 5,
        comment: 'Excellent séjour dans un loft magnifique! Service impeccable et emplacement parfait.',
        verified: true,
        offline: true,
        date: '2024-01-15',
        location: 'Alger'
      },
      {
        id: 'offline-testimonial-2',
        name: 'Ahmed K.',
        rating: 5,
        comment: 'Expérience fantastique, je recommande vivement. Loft très propre et bien équipé.',
        verified: true,
        offline: true,
        date: '2024-01-10',
        location: 'Oran'
      },
      {
        id: 'offline-testimonial-3',
        name: 'Marie L.',
        rating: 4,
        comment: 'Très bon rapport qualité-prix. Accueil chaleureux et loft confortable.',
        verified: true,
        offline: true,
        date: '2024-01-05',
        location: 'Constantine'
      }
    ],
    en: [
      {
        id: 'offline-testimonial-1',
        name: 'Sarah M.',
        rating: 5,
        comment: 'Excellent stay in a beautiful loft! Impeccable service and perfect location.',
        verified: true,
        offline: true,
        date: '2024-01-15',
        location: 'Algiers'
      },
      {
        id: 'offline-testimonial-2',
        name: 'Ahmed K.',
        rating: 5,
        comment: 'Fantastic experience, highly recommend. Very clean and well-equipped loft.',
        verified: true,
        offline: true,
        date: '2024-01-10',
        location: 'Oran'
      },
      {
        id: 'offline-testimonial-3',
        name: 'Marie L.',
        rating: 4,
        comment: 'Very good value for money. Warm welcome and comfortable loft.',
        verified: true,
        offline: true,
        date: '2024-01-05',
        location: 'Constantine'
      }
    ],
    ar: [
      {
        id: 'offline-testimonial-1',
        name: 'سارة م.',
        rating: 5,
        comment: 'إقامة ممتازة في شقة مفروشة رائعة! خدمة لا تشوبها شائبة وموقع مثالي.',
        verified: true,
        offline: true,
        date: '2024-01-15',
        location: 'الجزائر'
      },
      {
        id: 'offline-testimonial-2',
        name: 'أحمد ك.',
        rating: 5,
        comment: 'تجربة رائعة، أنصح بها بشدة. شقة نظيفة جداً ومجهزة بشكل جيد.',
        verified: true,
        offline: true,
        date: '2024-01-10',
        location: 'وهران'
      }
    ]
  },
  stats: {
    totalGuests: 1500,
    averageRating: 4.7,
    loftsAvailable: 25,
    yearsExperience: 5,
    totalBookings: 3200,
    satisfactionRate: 96,
    offline: true
  },
  ownerMetrics: {
    averageIncrease: '35%',
    occupancyRate: '78%',
    averageRevenue: '45,000 DZD',
    partnerCount: 120,
    averageROI: '28%',
    offline: true
  },
  caseStudies: {
    fr: [
      {
        id: 'offline-case-1',
        title: 'Augmentation de 40% des revenus',
        owner: 'Karim B.',
        location: 'Alger',
        beforeRevenue: 25000,
        afterRevenue: 35000,
        timeframe: '6 mois',
        description: 'Grâce à notre gestion professionnelle, Karim a vu ses revenus augmenter significativement.',
        offline: true
      }
    ],
    en: [
      {
        id: 'offline-case-1',
        title: '40% Revenue Increase',
        owner: 'Karim B.',
        location: 'Algiers',
        beforeRevenue: 25000,
        afterRevenue: 35000,
        timeframe: '6 months',
        description: 'Thanks to our professional management, Karim saw his revenue increase significantly.',
        offline: true
      }
    ],
    ar: [
      {
        id: 'offline-case-1',
        title: 'زيادة الإيرادات بنسبة 40%',
        owner: 'كريم ب.',
        location: 'الجزائر',
        beforeRevenue: 25000,
        afterRevenue: 35000,
        timeframe: '6 أشهر',
        description: 'بفضل إدارتنا المهنية، شهد كريم زيادة كبيرة في إيراداته.',
        offline: true
      }
    ]
  }
};

export class OfflineDataManager {
  private static instance: OfflineDataManager;
  private cacheManager: CacheManager;

  private constructor() {
    this.cacheManager = CacheManager.getInstance();
  }

  static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager();
    }
    return OfflineDataManager.instance;
  }

  /**
   * Fetch data with offline fallback
   */
  async fetchWithFallback<T>(
    url: string,
    fallbackKey: keyof OfflineFallbackData,
    locale: string = 'fr',
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Try network first
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful response
      this.cacheNetworkData(fallbackKey, locale, data);
      
      return data;
    } catch (error) {
      console.warn(`Network fetch failed for ${url}, using fallback:`, error);
      
      // Try cached data first
      const cachedData = this.getCachedData<T>(fallbackKey, locale);
      if (cachedData) {
        return cachedData;
      }
      
      // Use offline fallback
      return this.getOfflineFallback<T>(fallbackKey, locale);
    }
  }

  /**
   * Get cached data
   */
  private getCachedData<T>(key: keyof OfflineFallbackData, locale: string): T | null {
    const cache = this.cacheManager.getCache<T>('guestData');
    const cacheKey = `${key}_${locale}`;
    return cache.get(cacheKey);
  }

  /**
   * Cache network data
   */
  private cacheNetworkData(key: keyof OfflineFallbackData, locale: string, data: any): void {
    const cache = this.cacheManager.getCache('guestData');
    const cacheKey = `${key}_${locale}`;
    cache.set(cacheKey, data);
  }

  /**
   * Get offline fallback data
   */
  private getOfflineFallback<T>(key: keyof OfflineFallbackData, locale: string): T {
    const fallbackData = OFFLINE_FALLBACK_DATA[key];
    
    if (typeof fallbackData === 'object' && fallbackData !== null && locale in fallbackData) {
      return (fallbackData as any)[locale] as T;
    }
    
    return fallbackData as T;
  }

  /**
   * Fetch featured lofts with offline support
   */
  async getFeaturedLofts(locale: string = 'fr', limit: number = 6): Promise<any[]> {
    const url = `/api/lofts/featured?locale=${locale}&limit=${limit}`;
    return this.fetchWithFallback(url, 'lofts', locale);
  }

  /**
   * Fetch testimonials with offline support
   */
  async getTestimonials(locale: string = 'fr', limit: number = 6): Promise<any[]> {
    const url = `/api/testimonials?locale=${locale}&limit=${limit}`;
    return this.fetchWithFallback(url, 'testimonials', locale);
  }

  /**
   * Fetch homepage stats with offline support
   */
  async getHomepageStats(): Promise<any> {
    const url = '/api/stats/homepage';
    return this.fetchWithFallback(url, 'stats', 'fr');
  }

  /**
   * Fetch owner metrics with offline support
   */
  async getOwnerMetrics(): Promise<any> {
    const url = '/api/owner/metrics';
    return this.fetchWithFallback(url, 'ownerMetrics', 'fr');
  }

  /**
   * Fetch case studies with offline support
   */
  async getCaseStudies(locale: string = 'fr', limit: number = 3): Promise<any[]> {
    const url = `/api/case-studies?locale=${locale}&limit=${limit}`;
    return this.fetchWithFallback(url, 'caseStudies', locale);
  }

  /**
   * Search lofts with offline fallback
   */
  async searchLofts(params: {
    locale?: string;
    location?: string;
    checkin?: string;
    checkout?: string;
    guests?: number;
    priceMin?: number;
    priceMax?: number;
    amenities?: string[];
  }): Promise<any[]> {
    const { locale = 'fr', ...searchParams } = params;
    
    try {
      const queryString = new URLSearchParams({
        locale,
        ...Object.fromEntries(
          Object.entries(searchParams).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : String(value)
          ])
        )
      }).toString();
      
      const url = `/api/lofts/search?${queryString}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Search failed, returning featured lofts:', error);
      
      // Fallback to featured lofts for search
      return this.getFeaturedLofts(locale);
    }
  }

  /**
   * Preload critical data for offline use
   */
  async preloadCriticalData(locales: string[] = ['fr', 'en', 'ar']): Promise<void> {
    const preloadPromises: Promise<any>[] = [];

    for (const locale of locales) {
      preloadPromises.push(
        this.getFeaturedLofts(locale, 6),
        this.getTestimonials(locale, 6),
        this.getCaseStudies(locale, 3)
      );
    }

    // Add non-locale specific data
    preloadPromises.push(
      this.getHomepageStats(),
      this.getOwnerMetrics()
    );

    try {
      await Promise.allSettled(preloadPromises);
      console.log('Critical data preloaded successfully');
    } catch (error) {
      console.warn('Some critical data failed to preload:', error);
    }
  }

  /**
   * Check if offline data is available
   */
  hasOfflineData(key: keyof OfflineFallbackData, locale: string = 'fr'): boolean {
    return this.getCachedData(key, locale) !== null;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return this.cacheManager.getGlobalStats();
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cacheManager.clearAll();
  }
}

// Export singleton instance
export const offlineDataManager = OfflineDataManager.getInstance();