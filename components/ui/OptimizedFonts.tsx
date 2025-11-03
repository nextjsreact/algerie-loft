'use client';

import { useEffect } from 'react';

interface FontConfig {
  family: string;
  weights: number[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  preload?: boolean;
}

const FONT_CONFIGS: FontConfig[] = [
  {
    family: 'Inter',
    weights: [400, 500, 600, 700],
    display: 'swap',
    preload: true
  },
  {
    family: 'Roboto',
    weights: [300, 400, 500, 700],
    display: 'swap',
    preload: false
  }
];

export function OptimizedFonts() {
  useEffect(() => {
    // Preload critical fonts
    FONT_CONFIGS.forEach(config => {
      if (config.preload) {
        preloadFont(config);
      }
    });

    // Load fonts with font-display: swap
    loadOptimizedFonts();
  }, []);

  return null; // This component doesn't render anything
}

function preloadFont(config: FontConfig) {
  if (typeof window === 'undefined') return;

  config.weights.forEach(weight => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    // Use correct Google Fonts URL structure
    link.href = `https://fonts.gstatic.com/s/${config.family.toLowerCase()}/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2`;
    
    link.onerror = () => {
      console.warn(`Failed to preload font: ${config.family}-${weight}`);
    };
    
    document.head.appendChild(link);
  });
}

function loadOptimizedFonts() {
  if (typeof window === 'undefined') return;

  // Create optimized Google Fonts URL
  const fontFamilies = FONT_CONFIGS.map(config => {
    const weights = config.weights.join(',');
    return `${config.family}:wght@${weights}`;
  }).join('&family=');

  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;

  // Load fonts asynchronously
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fontUrl;
  link.media = 'print';
  link.onload = () => {
    link.media = 'all';
  };

  document.head.appendChild(link);

  // Fallback for browsers that don't support onload
  setTimeout(() => {
    link.media = 'all';
  }, 3000);
}

// Font loading optimization utilities
export class FontOptimizer {
  private static loadedFonts = new Set<string>();
  private static fontObserver: FontFaceObserver | null = null;

  static async loadFont(family: string, weight: number = 400): Promise<void> {
    const fontKey = `${family}-${weight}`;
    
    if (this.loadedFonts.has(fontKey)) {
      return Promise.resolve();
    }

    if (typeof window === 'undefined') {
      return Promise.resolve();
    }

    try {
      // Use CSS Font Loading API if available
      if ('fonts' in document) {
        const font = new FontFace(family, `url(https://fonts.gstatic.com/s/${family.toLowerCase()}/v1/${family}-${weight}.woff2)`, {
          weight: weight.toString(),
          display: 'swap'
        });

        await font.load();
        document.fonts.add(font);
        this.loadedFonts.add(fontKey);
      } else {
        // Fallback for older browsers
        await this.loadFontFallback(family, weight);
      }
    } catch (error) {
      console.warn(`Failed to load font ${family}-${weight}:`, error);
    }
  }

  private static loadFontFallback(family: string, weight: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`;
      
      link.onload = () => {
        this.loadedFonts.add(`${family}-${weight}`);
        resolve();
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to load font ${family}-${weight}`));
      };

      document.head.appendChild(link);
    });
  }

  static preloadCriticalFonts(): void {
    const criticalFonts = [
      { family: 'Inter', weight: 400 },
      { family: 'Inter', weight: 600 }
    ];

    criticalFonts.forEach(({ family, weight }) => {
      this.loadFont(family, weight);
    });
  }

  static getFontLoadingCSS(): string {
    return `
      /* Font loading optimization */
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2') format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
      
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2') format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
      
      /* Fallback fonts */
      .font-inter {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      }
      
      /* Loading states */
      .font-loading {
        visibility: hidden;
      }
      
      .font-loaded .font-loading {
        visibility: visible;
      }
    `;
  }
}

// Font Face Observer polyfill (simplified)
class FontFaceObserver {
  private family: string;
  private descriptors: any;

  constructor(family: string, descriptors: any = {}) {
    this.family = family;
    this.descriptors = descriptors;
  }

  load(text: string = 'BESbswy', timeout: number = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      const testString = text;
      const testElement = document.createElement('div');
      
      testElement.style.fontFamily = this.family;
      testElement.style.fontSize = '100px';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.top = '-9999px';
      testElement.style.visibility = 'hidden';
      testElement.textContent = testString;
      
      document.body.appendChild(testElement);
      
      const initialWidth = testElement.offsetWidth;
      
      const checkFont = () => {
        const currentWidth = testElement.offsetWidth;
        if (currentWidth !== initialWidth) {
          document.body.removeChild(testElement);
          resolve();
        }
      };
      
      const interval = setInterval(checkFont, 50);
      
      setTimeout(() => {
        clearInterval(interval);
        document.body.removeChild(testElement);
        reject(new Error('Font loading timeout'));
      }, timeout);
    });
  }
}