'use client';

import { ReactNode } from 'react';

interface LogoInitializerProps {
  children: ReactNode;
}

/**
 * LogoInitializer — désactivé.
 * L'ancien système de vérification des logos causait des timeouts (3s × 3 fichiers)
 * et des ralentissements importants au chargement de chaque page.
 * Le logo est géré directement par les composants (DesktopHeader, etc.)
 */
export function LogoInitializer({ children }: LogoInitializerProps) {
  return <>{children}</>;
}
