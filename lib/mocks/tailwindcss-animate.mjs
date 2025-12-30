// Temporary mock for tailwindcss-animate
// This provides basic animation utilities without the full plugin

export default function tailwindcssAnimateMock({ addUtilities }) {
  // Basic animation utilities
  addUtilities({
    '.animate-spin': {
      animation: 'spin 1s linear infinite',
    },
    '.animate-ping': {
      animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    },
    '.animate-pulse': {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    '.animate-bounce': {
      animation: 'bounce 1s infinite',
    },
    '.animate-fade-in': {
      animation: 'fadeIn 0.5s ease-in-out',
    },
    '.animate-fade-out': {
      animation: 'fadeOut 0.5s ease-in-out',
    },
  });

  // Basic keyframes
  addUtilities({
    '@keyframes spin': {
      'to': { transform: 'rotate(360deg)' }
    },
    '@keyframes ping': {
      '75%, 100%': { transform: 'scale(2)', opacity: '0' }
    },
    '@keyframes pulse': {
      '50%': { opacity: '.5' }
    },
    '@keyframes bounce': {
      '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
      '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' }
    },
    '@keyframes fadeIn': {
      'from': { opacity: '0' },
      'to': { opacity: '1' }
    },
    '@keyframes fadeOut': {
      'from': { opacity: '1' },
      'to': { opacity: '0' }
    }
  });
}