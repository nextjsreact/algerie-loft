'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useOfflineSupport } from '@/hooks/useOfflineSupport';

interface ProgressiveLoadingProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: Error | null;
  showPlaceholder?: boolean;
  onRetry?: () => void;
  placeholderComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  className?: string;
}

/**
 * Progressive loading wrapper with offline support
 */
export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  children,
  loading = false,
  error = null,
  showPlaceholder = false,
  onRetry,
  placeholderComponent,
  errorComponent,
  className = ''
}) => {
  const { isOnline, isSlowConnection, connectionQuality } = useOfflineSupport();

  // Show placeholder for slow connections or when explicitly requested
  if (loading && (showPlaceholder || isSlowConnection)) {
    return (
      <div className={`progressive-loading ${className}`}>
        {placeholderComponent || <DefaultPlaceholder />}
      </div>
    );
  }

  // Show loading spinner for fast connections
  if (loading) {
    return (
      <div className={`progressive-loading loading ${className}`}>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`progressive-loading error ${className}`}>
        {errorComponent || (
          <ErrorFallback 
            error={error} 
            onRetry={onRetry}
            isOnline={isOnline}
            connectionQuality={connectionQuality}
          />
        )}
      </div>
    );
  }

  // Show content
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Default placeholder component with shimmer effect
 */
const DefaultPlaceholder: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
};

/**
 * Error fallback component with retry functionality
 */
const ErrorFallback: React.FC<{
  error: Error;
  onRetry?: () => void;
  isOnline: boolean;
  connectionQuality: string;
}> = ({ error, onRetry, isOnline, connectionQuality }) => {
  const getErrorMessage = () => {
    if (!isOnline) {
      return "Vous êtes hors ligne. Vérifiez votre connexion internet.";
    }
    
    if (connectionQuality === 'poor') {
      return "Connexion lente détectée. Veuillez patienter ou réessayer.";
    }
    
    return error.message || "Une erreur s'est produite lors du chargement.";
  };

  const getErrorIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-8 h-8 text-red-500" />;
    }
    
    if (connectionQuality === 'poor') {
      return <Wifi className="w-8 h-8 text-yellow-500" />;
    }
    
    return <AlertCircle className="w-8 h-8 text-red-500" />;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {getErrorIcon()}
      </motion.div>
      
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        {!isOnline ? "Hors ligne" : "Erreur de chargement"}
      </h3>
      
      <p className="mt-2 text-sm text-gray-600 max-w-sm">
        {getErrorMessage()}
      </p>
      
      {onRetry && (
        <motion.button
          onClick={onRetry}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </motion.button>
      )}
    </div>
  );
};

/**
 * Loft card placeholder for featured lofts section
 */
export const LoftCardPlaceholder: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

/**
 * Grid placeholder for multiple loft cards
 */
export const LoftGridPlaceholder: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <LoftCardPlaceholder key={index} />
      ))}
    </div>
  );
};

/**
 * Testimonial placeholder
 */
export const TestimonialPlaceholder: React.FC = () => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );
};

/**
 * Stats placeholder
 */
export const StatsPlaceholder: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="text-center animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
        </div>
      ))}
    </div>
  );
};

/**
 * Connection quality indicator
 */
export const ConnectionIndicator: React.FC = () => {
  const { connectionQuality, isOnline, offlineState } = useOfflineSupport();

  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Hors ligne</span>
      </div>
    );
  }

  if (connectionQuality === 'poor') {
    return (
      <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <Wifi className="w-4 h-4" />
        <span className="text-sm font-medium">Connexion lente</span>
      </div>
    );
  }

  return null;
};

/**
 * Offline banner component
 */
export const OfflineBanner: React.FC = () => {
  const { isOnline, hasOfflineData } = useOfflineSupport();

  if (isOnline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="bg-yellow-50 border-b border-yellow-200 px-4 py-3"
      >
        <div className="flex items-center justify-center space-x-2 text-yellow-800">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">
            {hasOfflineData 
              ? "Mode hors ligne - Contenu limité disponible"
              : "Connexion requise pour accéder au contenu complet"
            }
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};