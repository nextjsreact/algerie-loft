'use client';

import { useEffect } from 'react';
import { initializeLogoAssets } from '@/lib/logo-asset-manager';

interface LogoInitializerProps {
  children: React.ReactNode;
}

export function LogoInitializer({ children }: LogoInitializerProps) {
  useEffect(() => {
    // Initialize logo assets on app startup
    initializeLogoAssets().catch(error => {
      console.error('Failed to initialize logo assets:', error);
    });
  }, []);

  return <>{children}</>;
}