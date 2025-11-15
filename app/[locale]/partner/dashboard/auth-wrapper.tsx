/**
 * Server-side authentication wrapper for partner dashboard
 * Verifies authentication before rendering the client component
 */

import { requirePartner } from '@/lib/security/partner-auth-guard';
import type { ReactNode } from 'react';

interface PartnerDashboardAuthWrapperProps {
  children: ReactNode;
  locale: string;
}

export async function PartnerDashboardAuthWrapper({ 
  children, 
  locale 
}: PartnerDashboardAuthWrapperProps) {
  // Verify partner authentication on server side
  // This will redirect if authentication fails
  await requirePartner(locale, {
    requireActive: true,
    allowedStatuses: ['active']
  });

  // If we reach here, authentication is valid
  return <>{children}</>;
}
