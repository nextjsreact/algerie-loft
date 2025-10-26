/**
 * Service Worker for Offline and Slow Connection Support
 * Implements caching strategies for dual-audience homepage
 */

const CACHE_NAME = 'loft-algerie-v1';
const OFFLINE_CACHE = 'loft-algerie-offline-v1';
const STATIC_CACHE = 'loft-algerie-static-v1';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/fr/public',
  '/en/public', 
  '/ar/public',
  '/offline.html',
  '/manifest.json',
  '/logo.png',
  '/logo.jpg',
  '/placeholder-logo.svg'
];

// API endpoints to cache for offline access
const CACHEABLE_APIS = [
  '/api/lofts/featured',
  '/api/testimonials',
  '/api/stats/homepage',
  '/api/currency/rates',
  '/api/translations'
];

// Popular lofts data for offline mode (fallback data)
const OFFLINE_LOFTS_DATA = {
  fr: [
    {
      id: 'offline-1',
      title: 'Loft Moderne Centre-ville',
      location: 'Alger Centre',
      pricePerNight: 8500,
      currency: 'DZD',
      rating: 4.8,
      reviewCount: 24,
      images: ['/loft-images/placeholder-1.jpg'],
      amenities: ['WiFi', 'Climatisation', 'Cuisine équipée'],
      availability: 'available',
      instantBook: true,
      offline: true
    },
    {
      id: 'offline-2', 
      title: 'Loft Vue Mer',
      location: 'Oran Bord de Mer',
      pricePerNight: 12000,
      currency: 'DZD',
      rating: 4.9,
      reviewCount: 18,
      images: ['/loft-images/placeholder-2.jpg'],
      amenities: ['Vue mer', 'Balcon', 'WiFi'],
      availability: 'available',
      instantBook: false,
      offline: true
    }
  ],
  en: [
    {
      id: 'offline-1',
      title: 'Modern Downtown Loft',
      location: 'Algiers Center',
      pricePerNight: 8500,
      currency: 'DZD',
      rating: 4.8,
      reviewCount: 24,
      images: ['/loft-images/placeholder-1.jpg'],
      amenities: ['WiFi', 'Air Conditioning', 'Equipped Kitchen'],
      availability: 'available',
      instantBook: true,
      offline: true
    },
    {
      id: 'offline-2',
      title: 'Sea View Loft',
      location: 'Oran Seafront',
      pricePerNight: 12000,
      currency: 'DZD',
      rating: 4.9,
      reviewCount: 18,
      images: ['/loft-images/placeholder-2.jpg'],
      amenities: ['Sea View', 'Balcony', 'WiFi'],
      availability: 'available',
      instantBook: false,
      offline: true
    }
  ],
  ar: [
    {
      id: 'offline-1',
      title: 'شقة مفروشة حديثة وسط المدينة',
      location: 'وسط الجزائر',
      pricePerNight: 8500,
      currency: 'DZD',
      rating: 4.8,
      reviewCount: 24,
      images: ['/loft-images/placeholder-1.jpg'],
      amenities: ['واي فاي', 'تكييف', 'مطبخ مجهز'],
      availability: 'available',
      instantBook: true,
      offline: true
    }
  ]
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      
      // Cache offline lofts data
      caches.open(OFFLINE_CACHE).then((cache) => {
        const offlineRequests = Object.keys(OFFLINE_LOFTS_DATA).map(locale => {
          const response = new Response(JSON.stringify(OFFLINE_LOFTS_DATA[locale]), {
            headers: { 'Content-Type': 'application/json' }
          });
          return cache.put(`/api/lofts/featured?locale=${locale}&offline=true`, response);
        });
        return Promise.all(offlineRequests);
      })
    ]).then(() => {
      console.log('Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== OFFLINE_CACHE && 
              cacheName !== STATIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for cacheable APIs
      if (CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for specific endpoints
    return handleOfflineFallback(request);
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the asset
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to load asset:', request.url);
    
    // Return placeholder for images
    if (request.url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><text x="200" y="150" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="16">Image non disponible</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Handle page requests with network-first, fallback to cache
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the page
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Network failed for page, trying cache:', request.url);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Final fallback
    return new Response(
      '<!DOCTYPE html><html><head><title>Hors ligne</title></head><body><h1>Connexion requise</h1><p>Cette page nécessite une connexion internet.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Handle offline fallbacks for specific API endpoints
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Featured lofts fallback
  if (url.pathname.startsWith('/api/lofts/featured')) {
    const locale = url.searchParams.get('locale') || 'fr';
    const offlineData = OFFLINE_LOFTS_DATA[locale] || OFFLINE_LOFTS_DATA.fr;
    
    return new Response(JSON.stringify(offlineData), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Offline-Fallback': 'true'
      }
    });
  }
  
  // Homepage stats fallback
  if (url.pathname.startsWith('/api/stats/homepage')) {
    const fallbackStats = {
      totalGuests: 1500,
      averageRating: 4.7,
      loftsAvailable: 25,
      yearsExperience: 5,
      offline: true
    };
    
    return new Response(JSON.stringify(fallbackStats), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Offline-Fallback': 'true'
      }
    });
  }
  
  // Testimonials fallback
  if (url.pathname.startsWith('/api/testimonials')) {
    const locale = url.searchParams.get('locale') || 'fr';
    const fallbackTestimonials = locale === 'fr' ? [
      {
        id: 'offline-testimonial-1',
        name: 'Sarah M.',
        rating: 5,
        comment: 'Excellent séjour dans un loft magnifique!',
        verified: true,
        offline: true
      }
    ] : [
      {
        id: 'offline-testimonial-1',
        name: 'Sarah M.',
        rating: 5,
        comment: 'Excellent stay in a beautiful loft!',
        verified: true,
        offline: true
      }
    ];
    
    return new Response(JSON.stringify(fallbackTestimonials), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Offline-Fallback': 'true'
      }
    });
  }
  
  // Default API error response
  return new Response(
    JSON.stringify({ 
      error: 'Service unavailable', 
      offline: true,
      message: 'This service requires an internet connection'
    }),
    { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Background sync triggered');
  
  // Refresh critical data when connection is restored
  try {
    const criticalUrls = [
      '/api/lofts/featured?locale=fr',
      '/api/lofts/featured?locale=en', 
      '/api/lofts/featured?locale=ar',
      '/api/stats/homepage',
      '/api/testimonials?locale=fr'
    ];
    
    const cache = await caches.open(CACHE_NAME);
    
    for (const url of criticalUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.log('Failed to sync:', url);
      }
    }
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});