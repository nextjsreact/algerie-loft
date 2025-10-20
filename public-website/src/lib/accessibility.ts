/**
 * Accessibility utilities and helpers
 */

// Screen reader only text utility
export const srOnly = 'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

// Focus management utilities
export const focusRing = 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
export const focusVisible = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

// Skip link styles
export const skipLink = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

// ARIA helpers
export const ariaExpanded = (isExpanded: boolean) => ({
  'aria-expanded': isExpanded,
});

export const ariaHidden = (isHidden: boolean) => ({
  'aria-hidden': isHidden,
});

export const ariaLabel = (label: string) => ({
  'aria-label': label,
});

export const ariaLabelledBy = (id: string) => ({
  'aria-labelledby': id,
});

export const ariaDescribedBy = (id: string) => ({
  'aria-describedby': id,
});

// Keyboard navigation helpers
export const handleKeyDown = (
  event: React.KeyboardEvent,
  handlers: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onTab?: () => void;
  }
) => {
  switch (event.key) {
    case 'Enter':
      if (handlers.onEnter) {
        event.preventDefault();
        handlers.onEnter();
      }
      break;
    case ' ':
      if (handlers.onSpace) {
        event.preventDefault();
        handlers.onSpace();
      }
      break;
    case 'Escape':
      if (handlers.onEscape) {
        event.preventDefault();
        handlers.onEscape();
      }
      break;
    case 'ArrowUp':
      if (handlers.onArrowUp) {
        event.preventDefault();
        handlers.onArrowUp();
      }
      break;
    case 'ArrowDown':
      if (handlers.onArrowDown) {
        event.preventDefault();
        handlers.onArrowDown();
      }
      break;
    case 'ArrowLeft':
      if (handlers.onArrowLeft) {
        event.preventDefault();
        handlers.onArrowLeft();
      }
      break;
    case 'ArrowRight':
      if (handlers.onArrowRight) {
        event.preventDefault();
        handlers.onArrowRight();
      }
      break;
    case 'Tab':
      if (handlers.onTab) {
        handlers.onTab();
      }
      break;
  }
};

// Focus trap utility
export const createFocusTrap = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  return {
    activate: () => {
      firstElement?.focus();
    },
    deactivate: () => {
      element.removeEventListener('keydown', handleTabKey);
    },
  };
};

// Color contrast utilities
export const contrastColors = {
  // High contrast text colors
  textPrimary: 'text-gray-900', // 21:1 contrast ratio
  textSecondary: 'text-gray-700', // 12.6:1 contrast ratio
  textMuted: 'text-gray-600', // 7:1 contrast ratio (minimum for normal text)
  
  // High contrast background colors
  bgPrimary: 'bg-white',
  bgSecondary: 'bg-gray-50',
  bgAccent: 'bg-blue-600',
  
  // Error states with good contrast
  errorText: 'text-red-700',
  errorBg: 'bg-red-50',
  errorBorder: 'border-red-300',
  
  // Success states with good contrast
  successText: 'text-green-700',
  successBg: 'bg-green-50',
  successBorder: 'border-green-300',
  
  // Warning states with good contrast
  warningText: 'text-yellow-800',
  warningBg: 'bg-yellow-50',
  warningBorder: 'border-yellow-300',
};

// Reduced motion utilities
export const respectsReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const motionSafeClasses = {
  transition: 'motion-safe:transition-all',
  transform: 'motion-safe:transform',
  animate: 'motion-safe:animate-pulse',
};

// Announce to screen readers
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  if (typeof window === 'undefined') return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = srOnly;
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Generate unique IDs for accessibility
let idCounter = 0;
export const generateId = (prefix: string = 'id') => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

// Landmark roles
export const landmarks = {
  main: 'main',
  navigation: 'navigation',
  banner: 'banner',
  contentinfo: 'contentinfo',
  complementary: 'complementary',
  search: 'search',
  form: 'form',
  region: 'region',
} as const;