/**
 * Advanced Performance Optimizations
 * Additional performance enhancements for the public website
 */

// Resource hints for critical resources
export function addResourceHints() {
  if (typeof document === 'undefined') return;

  // Preconnect to external domains
  const preconnectDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ];

  preconnectDomains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // DNS prefetch for other domains
  const dnsPrefetchDomains = [
    'https://cdn.sanity.io',
    'https://images.unsplash.com',
  ];

  dnsPrefetchDomains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

// Critical CSS inlining helper
export function inlineCriticalCSS(css: string) {
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = css;
  style.setAttribute('data-critical', 'true');
  document.head.appendChild(style);
}

// Service Worker registration for caching
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

// Intersection Observer for lazy loading
export function createLazyLoadObserver(callback: (entries: IntersectionObserverEntry[]) => void) {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px',
    threshold: 0.1,
  });
}

// Image preloading utility
export function preloadImages(urls: string[]) {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

// Font loading optimization
export function optimizeFontLoading() {
  if (typeof document === 'undefined') return;

  // Preload critical fonts
  const criticalFonts = [
    '/fonts/inter-var.woff2',
    '/fonts/poppins-600.woff2',
  ];

  criticalFonts.forEach((font) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = font;
    document.head.appendChild(link);
  });
}

// Bundle size monitoring
export function monitorBundleSize() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('.js') || entry.name.includes('.css')) {
        const size = (entry as any).transferSize || 0;
        
        // Log large resources (> 100KB)
        if (size > 100 * 1024) {
          console.warn(`Large resource detected: ${entry.name} (${Math.round(size / 1024)}KB)`);
          
          // Send to analytics
          if ((window as any).gtag) {
            (window as any).gtag('event', 'large_resource', {
              event_category: 'Performance',
              event_label: entry.name,
              value: Math.round(size / 1024),
            });
          }
        }
      }
    });
  });

  observer.observe({ entryTypes: ['resource'] });
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (typeof window === 'undefined' || !('performance' in window) || !(window.performance as any).memory) {
    return;
  }

  const checkMemory = () => {
    const memory = (window.performance as any).memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
    const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

    // Warn if memory usage is high
    if (usedMB > 50) {
      console.warn(`High memory usage: ${usedMB}MB / ${limitMB}MB`);
      
      // Send to analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', 'high_memory_usage', {
          event_category: 'Performance',
          value: usedMB,
        });
      }
    }
  };

  // Check memory usage every 30 seconds
  setInterval(checkMemory, 30000);
}

// Network information monitoring
export function monitorNetworkConditions() {
  if (typeof navigator === 'undefined' || !(navigator as any).connection) {
    return;
  }

  const connection = (navigator as any).connection;
  
  const logNetworkInfo = () => {
    console.log('Network conditions:', {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    });

    // Adjust quality based on network conditions
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      // Reduce image quality for slow connections
      document.documentElement.setAttribute('data-connection', 'slow');
    } else {
      document.documentElement.setAttribute('data-connection', 'fast');
    }
  };

  connection.addEventListener('change', logNetworkInfo);
  logNetworkInfo(); // Initial check
}

// Critical resource loading
export function loadCriticalResources() {
  // Preload hero image
  const heroImage = '/images/hero-bg.webp';
  const img = new Image();
  img.src = heroImage;

  // Preload logo
  const logo = '/images/logo.png';
  const logoImg = new Image();
  logoImg.src = logo;

  // Preload critical CSS
  const criticalCSS = `
    .hero-section { background-image: url('${heroImage}'); }
    .logo { background-image: url('${logo}'); }
  `;
  
  inlineCriticalCSS(criticalCSS);
}

// Initialize all performance optimizations
export function initializePerformanceOptimizations() {
  if (typeof window === 'undefined') return;

  // Run optimizations when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addResourceHints();
      optimizeFontLoading();
      loadCriticalResources();
      monitorBundleSize();
      monitorMemoryUsage();
      monitorNetworkConditions();
      registerServiceWorker();
    });
  } else {
    addResourceHints();
    optimizeFontLoading();
    loadCriticalResources();
    monitorBundleSize();
    monitorMemoryUsage();
    monitorNetworkConditions();
    registerServiceWorker();
  }
}