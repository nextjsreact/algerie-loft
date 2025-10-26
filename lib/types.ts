export type UserRole = 'admin' | 'member' | 'guest' | 'manager' | 'executive' | 'client' | 'partner';

export type User = {
  id: string;
  email: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  // Add other user-related fields as needed
};

export type AuthSession = {
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
    role: UserRole;
    created_at: string;
    updated_at: string | null;
  };
  token: string;
};

export type LoftStatus = 'available' | 'occupied' | 'maintenance';

export type InternetConnectionType = {
  id: string;
  type: string;
  speed: string | null;
  provider: string | null;
  status: string | null;
  cost: number | null;
  created_at: string;
};

export type LoftOwner = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  ownership_type: 'company' | 'third_party';
};

export type ZoneArea = {
  id: string;
  name: string;
};

export type Loft = {
  id: string;
  name: string;
  address: string;
  description?: string;
  price_per_month: number | null;
  price_per_night?: number | null;
  status: LoftStatus;
  owner_id: string;
  partner_id?: string;
  company_percentage: number;
  owner_percentage: number;
  zone_area_id?: string;
  internet_connection_type_id?: string;
  water_customer_code?: string;
  water_contract_code?: string;
  water_meter_number?: string;
  water_correspondent?: string;
  electricity_pdl_ref?: string;
  electricity_customer_number?: string;
  electricity_meter_number?: string;
  electricity_correspondent?: string;
  gas_pdl_ref?: string;
  gas_customer_number?: string;
  gas_meter_number?: string;
  gas_correspondent?: string;
  phone_number?: string;
  frequence_paiement_eau?: string;
  prochaine_echeance_eau?: string;
  frequence_paiement_energie?: string;
  prochaine_echeance_energie?: string;
  frequence_paiement_telephone?: string;
  prochaine_echeance_telephone?: string;
  frequence_paiement_internet?: string;
  prochaine_echeance_internet?: string;
  frequence_paiement_tv?: string;
  prochaine_echeance_tv?: string;
  // Additional fields for partner properties
  max_guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  amenities?: string[];
  is_published?: boolean;
  maintenance_notes?: string;
  availability_notes?: string;
  created_at?: string;
  updated_at?: string;
};

export interface LoftWithRelations extends Loft {
  owner_name: string | null;
  zone_area_name: string | null;
}

export type CategoryType = 'income' | 'expense';

export type Category = {
  id: string;
  name: string;
  description: string | null;
  type: CategoryType;
  created_at?: string;
  updated_at?: string;
};

export type Team = {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  user_id: string;
  created_at: string;
  due_date?: string | null;
  assigned_to?: string | null;
  loft_id?: string | null;
};

// Extended interface for tasks with loft information
export interface TaskWithLoft extends Task {
  loft_name?: string | null;
  loft_address?: string | null;
}

export type Notification = {
  id: string;
  title_key?: string;
  message_key?: string;
  title?: string;
  message?: string;
  title_payload?: Record<string, any>;
  message_payload?: Record<string, any>;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  user_id: string;
  link?: string | null;
  sender_id?: string | null;
  type: string;
  notification_category?: string;
  priority?: string;
  booking_id?: string | null;
  metadata?: Record<string, any>;
  sender?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
};

export type Setting = {
  key: string;
  value: any; // Using any for now, as JSONB can store various types
};

export type Message = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
};

// Password validation schema
export const passwordSchema = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
};

export type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  ratio: number;
  is_default: boolean;
};

export type PaymentMethod = {
  id: string;
  name: string;
  type?: string;
  description?: string;
  details?: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Transaction = {
  id: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  date: string;
  category?: string;
  loft_id?: string;
  currency_id?: string;
  payment_method_id?: string;
  ratio_at_transaction?: number | null;
  equivalent_amount_default_currency?: number | null;
};

export type Database = any;

export type Conversation = {
  id: string;
  name: string;
  latestMessage: string;
};

// Multi-Role Booking System Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type BusinessType = 'individual' | 'company';

export interface PartnerProfile {
  id: string;
  user_id: string;
  business_name?: string;
  business_type: BusinessType;
  tax_id?: string;
  address: string;
  phone: string;
  verification_status: VerificationStatus;
  verification_documents: string[];
  bank_details: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  loft_id: string;
  client_id: string;
  partner_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  special_requests?: string;
  booking_reference: string;
  payment_intent_id?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  loft: {
    id: string;
    name: string;
    address: string;
    price_per_night: number;
  };
  client: {
    id: string;
    full_name: string;
    email: string;
  };
  partner: {
    id: string;
    full_name: string;
    business_name?: string;
  };
}

export interface LoftAvailability {
  id: string;
  loft_id: string;
  date: string;
  is_available: boolean;
  price_override?: number;
  minimum_stay: number;
  maximum_stay?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'system' | 'attachment';
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoftReview {
  id: string;
  booking_id: string;
  loft_id: string;
  client_id: string;
  rating: number;
  review_text?: string;
  is_published: boolean;
  response_text?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingFee {
  id: string;
  booking_id: string;
  fee_type: 'cleaning' | 'service' | 'tax' | 'deposit' | 'other';
  fee_name: string;
  amount: number;
  is_refundable: boolean;
  created_at: string;
}

export interface ClientLoftView {
  id: string;
  name: string;
  address: string;
  description?: string;
  price_per_night: number;
  status: LoftStatus;
  images?: string[];
  amenities?: string[];
  average_rating: number;
  review_count: number;
  partner: {
    id: string;
    name: string;
    business_name?: string;
  };
}

export interface SearchFilters {
  check_in?: string;
  check_out?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  guests?: number;
  amenities?: string[];
}

export interface BookingSearchParams {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  loft_id?: string;
  client_id?: string;
  partner_id?: string;
  page?: number;
  limit?: number;
}

// Audit system types
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';
export type AuditableTable = 'transactions' | 'tasks' | 'reservations' | 'lofts';

export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  timestamp: string;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  changedFields: string[];
  ipAddress?: string;
  userAgent?: string;
  integrityHash?: string;
}

export interface AuditFilters {
  tableName?: string;
  recordId?: string;
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AuditLogEntry {
  id: string;
  tableName: AuditableTable;
  recordId: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  timestamp: Date;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  changedFields: string[];
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface AuditSearchParams {
  tableName?: AuditableTable;
  recordId?: string;
  userId?: string;
  action?: AuditAction;
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchTerm?: string;
  page?: number;
  limit?: number;
}

// Multi-Role Booking System Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type BusinessType = 'individual' | 'company';

export interface PartnerProfile {
  id: string;
  user_id: string;
  business_name?: string;
  business_type: BusinessType;
  tax_id?: string;
  address: string;
  phone: string;
  verification_status: VerificationStatus;
  verification_documents: string[];
  bank_details: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  loft_id: string;
  client_id: string;
  partner_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  special_requests?: string;
  booking_reference: string;
  payment_intent_id?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  loft: {
    id: string;
    name: string;
    address: string;
    price_per_night: number;
  };
  client: {
    id: string;
    full_name: string;
    email: string;
  };
  partner: {
    id: string;
    full_name: string;
    business_name?: string;
  };
}

export interface LoftAvailability {
  id: string;
  loft_id: string;
  date: string;
  is_available: boolean;
  price_override?: number;
  minimum_stay: number;
  maximum_stay?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'system' | 'attachment';
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoftReview {
  id: string;
  booking_id: string;
  loft_id: string;
  client_id: string;
  rating: number;
  review_text?: string;
  is_published: boolean;
  response_text?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingFee {
  id: string;
  booking_id: string;
  fee_type: 'cleaning' | 'service' | 'tax' | 'deposit' | 'other';
  fee_name: string;
  amount: number;
  is_refundable: boolean;
  created_at: string;
}

export interface ClientLoftView {
  id: string;
  name: string;
  address: string;
  description?: string;
  price_per_night: number;
  status: LoftStatus;
  images?: string[];
  amenities?: string[];
  average_rating: number;
  review_count: number;
  partner: {
    id: string;
    name: string;
    business_name?: string;
  };
}

export interface SearchFilters {
  check_in?: string;
  check_out?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  guests?: number;
  amenities?: string[];
}

export interface BookingSearchParams {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  loft_id?: string;
  client_id?: string;
  partner_id?: string;
  page?: number;
  limit?: number;
}