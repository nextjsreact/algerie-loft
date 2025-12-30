import { UserRole, AuthSession } from '@/lib/types';

export type PartnerStatus = 'pending' | 'verified' | 'active' | 'rejected' | 'suspended';

export interface PartnerUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string | null;
  partner_profile?: PartnerProfile;
}

export interface PartnerProfile {
  id: string;
  user_id: string;
  business_name?: string;
  business_type: 'individual' | 'company';
  tax_id?: string;
  address: string;
  phone: string;
  verification_status: PartnerStatus;
  verification_documents: string[];
  bank_details: Record<string, any>;
  portfolio_description?: string;
  admin_notes?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerAuthSession extends AuthSession {
  user: PartnerUser;
  partner_profile: PartnerProfile;
  partner_status: PartnerStatus;
}

export interface PartnerJWTClaims {
  sub: string; // user id
  email: string;
  role: UserRole;
  partner_id: string;
  partner_status: PartnerStatus;
  iat: number;
  exp: number;
}

export interface PartnerAuthError extends Error {
  code: 'PARTNER_NOT_FOUND' | 'PARTNER_NOT_APPROVED' | 'PARTNER_REJECTED' | 'PARTNER_SUSPENDED' | 'INVALID_TOKEN';
  partner_status?: PartnerStatus;
  redirect_url?: string;
}