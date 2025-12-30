'use client';

import { motion } from 'framer-motion';

interface SimpleLogoProps {
  variant?: 'header' | 'hero' | 'footer';
  className?: string;
  showGlow?: boolean;
}

export default function SimpleLogo({ 
  variant = 'header', 
  className = '',
  showGlow = false 
}: SimpleLogoProps) {
  
  const getSize = () => {
    switch (variant) {
      case 'hero':
        return 'text-4xl md:text-6xl';
      case 'header':
        return 'text-xl md:text-2xl';
      case 'footer':
        return 'text-lg md:text-xl';
      default:
        return 'text-xl';
    }
  };

  const logoVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      variants={logoVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      {/* Golden Glow Effect */}
      {showGlow && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-lg blur-xl opacity-0"
          animate={{
            opacity: [0, 0.6, 0],
            transition: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
      )}

      {/* Logo Content */}
      <div className="relative z-10 text-center">
        {/* Building Icon */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            {/* Buildings */}
            <div className="flex items-end gap-1">
              <div className="w-3 h-8 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t shadow-lg"></div>
              <div className="w-4 h-10 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t shadow-lg"></div>
              <div className="w-3 h-6 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t shadow-lg"></div>
            </div>
            {/* Base */}
            <div className="w-12 h-1 bg-gradient-to-r from-yellow-600 to-yellow-400 mt-1 rounded shadow-md"></div>
          </div>
        </div>

        {/* Main Text */}
        <h1 className={`${getSize()} font-bold bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 bg-clip-text text-transparent leading-tight drop-shadow-lg`}>
          LOFT ALGERIE
        </h1>
        
        {/* Subtitle */}
        {(variant === 'hero' || variant === 'header') && (
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">
            VOTRE CONFORT NOTRE PRIORITÉ
          </p>
        )}
      </div>
    </motion.div>
  );
}