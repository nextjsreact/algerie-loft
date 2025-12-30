// =====================================================
// PARTNER DASHBOARD SYSTEM - TYPESCRIPT TYPES
// =====================================================

// Enums matching database types
export type BusinessType = 'individual' | 'company';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type ValidationRequestStatus = 'pending' | 'approved' | 'rejected';

// Base Partner Profile interface
export interface PartnerProfile {
  id: string;
  user_id: string;
  
  // Business Information
  business_name?: string;
  business_type: BusinessType;
  tax_id?: string;
  
  // Contact Information
  address: string;
  phone: string;
  
  // Verification Information
  verification_status: VerificationStatus;
  verification_documents: string[];
  portfolio_description?: string;
  
  // Admin Management Fields
  admin_notes?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  
  // Banking Information
  bank_details?: Record<string, any>;
  
  // Activity Tracking
  last_login_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Extended Partner Profile with computed fields for dashboard
export interface ExtendedPartnerProfile extends PartnerProfile {
  // Computed fields for dashboard display
  properties_count?: number;
  total_revenue?: number;
  active_reservations_count?: number;
  
  // Admin user information (when loaded with admin context)
  approved_by_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  rejected_by_user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Partner Validation Request interface
export interface PartnerValidationRequest {
  id: string;
  partner_id: string;
  status: ValidationRequestStatus;
  submitted_data: PartnerRegistrationData;
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  
  // Related data (when loaded with joins)
  partner?: PartnerProfile;
  processed_by_user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Partner Registration Data interface
export interface PartnerRegistrationData {
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    address: string;
  };
  business_info: {
    business_name?: string;
    business_type: BusinessType;
    tax_id?: string;
  };
  portfolio_description: string;
  verification_documents: File[] | string[]; // Files during upload, URLs after storage
}

// Partner Dashboard Statistics interface
export interface PartnerDashboardStats {
  properties: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
  };
  revenue: {
    current_month: number;
    previous_month: number;
    year_to_date: number;
    currency: string;
  };
  reservations: {
    active: number;
    upcoming: number;
    completed_this_month: number;
  };
  occupancy_rate: {
    current_month: number;
    previous_month: number;
  };
}

// Partner Property View interface (read-only view of loft with partner context)
export interface PartnerPropertyView {
  id: string;
  name: string;
  description?: string;
  address: string;
  price_per_month: number;
  status: 'available' | 'occupied' | 'maintenance';
  partner_id: string;
  
  // Computed fields for partner dashboard
  current_occupancy_status: 'available' | 'occupied' | 'maintenance';
  next_reservation?: {
    check_in: string;
    check_out: string;
    guest_name: string;
  };
  revenue_this_month: number;
  revenue_last_month: number;
  total_reservations: number;
  average_rating: number;
  last_maintenance_date?: string;
  images: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Partner Reservation Summary interface
export interface PartnerReservationSummary {
  id: string;
  loft_id: string;
  loft_name: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  
  // Special requests or notes
  special_requests?: string;
  admin_notes?: string;
}

// API Request/Response interfaces

// Partner Login Request
export interface PartnerLoginRequest {
  email: string;
  password: string;
}

// Partner Login Response
export interface PartnerLoginResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  partner: ExtendedPartnerProfile;
  token: string;
  dashboard_url: string;
}

// Partner Registration Request
export interface PartnerRegistrationRequest extends PartnerRegistrationData {
  password: string;
  confirm_password: string;
  terms_accepted: boolean;
}

// Partner Registration Response
export interface PartnerRegistrationResponse {
  success: boolean;
  message: string;
  partner_id?: string;
  validation_required: boolean;
}

// Partner Dashboard Response
export interface PartnerDashboardResponse {
  partner: ExtendedPartnerProfile;
  statistics: PartnerDashboardStats;
  properties: PartnerPropertyView[];
  recent_reservations: PartnerReservationSummary[];
}

// Admin Validation Requests Response
export interface ValidationRequestsResponse {
  requests: PartnerValidationRequest[];
  total: number;
  page: number;
  limit: number;
}

// Admin Approval Request
export interface PartnerApprovalRequest {
  admin_notes?: string;
}

// Admin Rejection Request
export interface PartnerRejectionRequest {
  rejection_reason: string;
  admin_notes?: string;
}

// Partner Error Types
export enum PartnerErrorCodes {
  PARTNER_NOT_FOUND = 'PARTNER_NOT_FOUND',
  PARTNER_NOT_APPROVED = 'PARTNER_NOT_APPROVED',
  PARTNER_REJECTED = 'PARTNER_REJECTED',
  PARTNER_SUSPENDED = 'PARTNER_SUSPENDED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  PROPERTY_NOT_OWNED = 'PROPERTY_NOT_OWNED',
  VALIDATION_PENDING = 'VALIDATION_PENDING',
  INVALID_REGISTRATION_DATA = 'INVALID_REGISTRATION_DATA',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  DOCUMENT_UPLOAD_FAILED = 'DOCUMENT_UPLOAD_FAILED'
}

// Partner Error interface
export interface PartnerError extends Error {
  code: PartnerErrorCodes;
  details?: Record<string, any>;
  redirect_url?: string;
}

// Property Filters for partner dashboard
export interface PropertyFilters {
  status?: 'available' | 'occupied' | 'maintenance';
  search?: string;
  zone_area_id?: string;
  sort_by?: 'name' | 'created_at' | 'price_per_month' | 'status';
  sort_order?: 'asc' | 'desc';
}

// Revenue Report Filters
export interface RevenueReportFilters {
  date_from: string;
  date_to: string;
  group_by: 'day' | 'week' | 'month';
  property_ids?: string[];
}

// Partner System Configuration
export interface PartnerSystemConfig {
  partner_registration_enabled: boolean;
  auto_approval_enabled: boolean;
  max_properties_per_partner: number;
  document_upload_max_size: number;
  supported_document_types: string[];
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
}

// Sidebar Item interface for partner dashboard
export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  active?: boolean;
  badge?: string | number;
  children?: SidebarItem[];
}

// Form validation interfaces
export interface PartnerRegistrationFormErrors {
  personal_info?: {
    full_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  business_info?: {
    business_name?: string;
    business_type?: string;
    tax_id?: string;
  };
  portfolio_description?: string;
  verification_documents?: string;
  password?: string;
  confirm_password?: string;
  terms_accepted?: string;
}

// Partner Login Form Errors
export interface PartnerLoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}