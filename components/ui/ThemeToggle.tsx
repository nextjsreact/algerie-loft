'use client';

import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useAnimationSystem';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'golden' | 'emerald' | 'slate' | 'orange';
}

export default function ThemeToggle({ className = '', variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className={`p-3 rounded-full backdrop-blur-md border bg-gray-100/80 border-gray-300/50 ${className}`}>
        <div className="w-6 h-6" />
      </div>
    );
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'golden':
        return {
          bg: theme === 'dark' ? 'bg-yellow-800/20' : 'bg-yellow-100/80',
          border: theme === 'dark' ? 'border-yellow-600/30' : 'border-yellow-300/50',
          iconColor: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
          hoverBg: theme === 'dark' ? 'hover:bg-yellow-700/30' : 'hover:bg-yellow-200/80'
        };
      case 'emerald':
        return {
          bg: theme === 'dark' ? 'bg-emerald-800/20' : 'bg-emerald-100/80',
          border: theme === 'dark' ? 'border-emerald-600/30' : 'border-emerald-300/50',
          iconColor: theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600',
          hoverBg: theme === 'dark' ? 'hover:bg-emerald-700/30' : 'hover:bg-emerald-200/80'
        };
      case 'slate':
        return {
          bg: theme === 'dark' ? 'bg-slate-800/20' : 'bg-slate-100/80',
          border: theme === 'dark' ? 'border-slate-600/30' : 'border-slate-300/50',
          iconColor: theme === 'dark' ? 'text-slate-400' : 'text-slate-600',
          hoverBg: theme === 'dark' ? 'hover:bg-slate-700/30' : 'hover:bg-slate-200/80'
        };
      case 'orange':
        return {
          bg: theme === 'dark' ? 'bg-orange-800/20' : 'bg-orange-100/80',
          border: theme === 'dark' ? 'border-orange-600/30' : 'border-orange-300/50',
          iconColor: theme === 'dark' ? 'text-orange-400' : 'text-orange-600',
          hoverBg: theme === 'dark' ? 'hover:bg-orange-700/30' : 'hover:bg-orange-200/80'
        };
      default:
        return {
          bg: theme === 'dark' ? 'bg-gray-800/20' : 'bg-white/80',
          border: theme === 'dark' ? 'border-gray-600/30' : 'border-gray-300/50',
          iconColor: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
          hoverBg: theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100/80'
        };
    }
  };

  const styles = getVariantStyles();

  const handleClick = () => {
    console.log('ThemeToggle clicked, current theme:', theme);
    toggleTheme();
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`
        relative p-3 rounded-full backdrop-blur-md border transition-all duration-300
        ${styles.bg} ${styles.border} ${styles.hoverBg} ${className}
      `}
      whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Basculer vers le mode ${theme === 'light' ? 'sombre' : 'clair'}`}
    >
      <motion.div
        className="relative w-6 h-6"
        animate={{
          rotate: prefersReducedMotion ? 0 : (theme === 'dark' ? 180 : 0),
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {theme === 'light' ? (
          <Sun className={`w-6 h-6 ${styles.iconColor}`} />
        ) : (
          <Moon className={`w-6 h-6 ${styles.iconColor}`} />
        )}
      </motion.div>
      
      {/* Glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-full opacity-0 ${
          variant === 'golden' ? 'bg-yellow-400/20' :
          variant === 'emerald' ? 'bg-emerald-400/20' :
          variant === 'slate' ? 'bg-slate-400/20' :
          variant === 'orange' ? 'bg-orange-400/20' :
          'bg-blue-400/20'
        }`}
        whileHover={{ opacity: prefersReducedMotion ? 0 : 0.3 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}