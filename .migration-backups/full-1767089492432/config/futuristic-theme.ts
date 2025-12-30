// Configuration theme for the futuristic public page
export const futuristicTheme = {
  // Color gradients
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    hero: {
      light: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
    }
  },

  // Animation timings
  animations: {
    fast: '0.2s ease-out',
    medium: '0.4s ease-out', 
    slow: '0.8s ease-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    
    // Carousel specific
    carousel: {
      autoPlayInterval: 4000,
      transitionDuration: 0.6,
      kenBurnsDuration: 4
    },

    // Counter animation
    counter: {
      duration: 2,
      stagger: 0.3
    }
  },

  // Glassmorphism settings
  glass: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    blur: '10px',
    
    strong: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.3)',
      shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.5)',
      blur: '20px'
    }
  },

  // Glow effects
  glow: {
    primary: '0 0 20px rgba(102, 126, 234, 0.5)',
    secondary: '0 0 20px rgba(240, 147, 251, 0.5)',
    accent: '0 0 20px rgba(79, 172, 254, 0.5)',
    
    // Enhanced for dark mode
    dark: {
      primary: '0 0 30px rgba(102, 126, 234, 0.8)',
      secondary: '0 0 30px rgba(240, 147, 251, 0.8)',
      accent: '0 0 30px rgba(79, 172, 254, 0.8)'
    }
  },

  // Performance settings
  performance: {
    // Particle counts by device type
    particles: {
      desktop: 20,
      tablet: 10,
      mobile: 0
    },

    // Animation complexity by performance level
    complexity: {
      high: {
        enableParticles: true,
        enableBlur: true,
        enableGlow: true,
        enableParallax: true,
        fullAnimationDuration: true
      },
      medium: {
        enableParticles: false,
        enableBlur: true,
        enableGlow: true,
        enableParallax: false,
        animationDurationMultiplier: 0.75
      },
      low: {
        enableParticles: false,
        enableBlur: false,
        enableGlow: false,
        enableParallax: false,
        animationDurationMultiplier: 0.5
      }
    }
  },

  // Responsive breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px'
  },

  // Content settings
  content: {
    // Image settings
    images: {
      quality: {
        hero: 90,
        carousel: 85,
        thumbnail: 75
      },
      formats: ['.jpg', '.jpeg', '.png', '.webp'],
      fallbackSrc: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'
    },

    // Text settings
    typography: {
      fontWeights: {
        title: '700-900',
        body: '400-500'
      },
      letterSpacing: {
        title: 'adjusted',
        body: 'optimized'
      }
    }
  }
};

// Helper function to get theme values
export const getThemeValue = (path: string) => {
  return path.split('.').reduce((obj, key) => obj?.[key], futuristicTheme);
};

// CSS custom properties generator
export const generateCSSCustomProperties = () => {
  return `
    /* Futuristic Theme Variables */
    :root {
      --gradient-primary: ${futuristicTheme.gradients.primary};
      --gradient-secondary: ${futuristicTheme.gradients.secondary};
      --gradient-accent: ${futuristicTheme.gradients.accent};
      --gradient-hero: ${futuristicTheme.gradients.hero.light};
      
      --glass-bg: ${futuristicTheme.glass.background};
      --glass-border: ${futuristicTheme.glass.border};
      --glass-shadow: ${futuristicTheme.glass.shadow};
      
      --glow-primary: ${futuristicTheme.glow.primary};
      --glow-secondary: ${futuristicTheme.glow.secondary};
      --glow-accent: ${futuristicTheme.glow.accent};
      
      --animation-fast: ${futuristicTheme.animations.fast};
      --animation-medium: ${futuristicTheme.animations.medium};
      --animation-slow: ${futuristicTheme.animations.slow};
    }
    
    .dark {
      --gradient-hero: ${futuristicTheme.gradients.hero.dark};
      --glass-bg: rgba(255, 255, 255, 0.05);
      --glass-border: rgba(255, 255, 255, 0.1);
      --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      --glow-primary: ${futuristicTheme.glow.dark.primary};
      --glow-secondary: ${futuristicTheme.glow.dark.secondary};
      --glow-accent: ${futuristicTheme.glow.dark.accent};
    }
  `;
};

export default futuristicTheme;