# Partner Dashboard System - Database Schema

This document describes the database schema implementation for the Partner Dashboard System.

## Overview

The Partner Dashboard System allows property owners to register as partners, submit their properties for admin validation, and access a personalized dashboard to manage their properties once approved.

## Database Schema

### Tables Created

#### 1. `partners`
Main table storing partner information and verification status.

**Columns:**
- `id` (UUID, Primary Key) - Unique partner identifier
- `user_id` (UUID, Foreign Key) - References auth.users(id)
- `business_name` (TEXT, Optional) - Business name for company partners
- `business_type` (business_type ENUM) - 'individual' or 'company'
- `tax_id` (TEXT, Optional) - Tax identification number
- `address` (TEXT, Required) - Partner's address
- `phone` (TEXT, Required) - Partner's phone number
- `verification_status` (verification_status ENUM) - 'pending', 'approved', 'rejected', 'suspended'
- `verification_documents` (TEXT[]) - Array of document URLs/paths
- `portfolio_description` (TEXT, Optional) - Description of partner's property portfolio
- `admin_notes` (TEXT, Optional) - Admin notes about the partner
- `approved_at` (TIMESTAMPTZ, Optional) - When partner was approved
- `approved_by` (UUID, Optional) - Admin who approved the partner
- `rejected_at` (TIMESTAMPTZ, Optional) - When partner was rejected
- `rejected_by` (UUID, Optional) - Admin who rejected the partner
- `rejection_reason` (TEXT, Optional) - Reason for rejection
- `bank_details` (JSONB, Optional) - Banking information for future use
- `last_login_at` (TIMESTAMPTZ, Optional) - Last login timestamp
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Constraints:**
- `partners_user_id_unique` - Ensures one partner per user
- Foreign key constraints for referential integrity

#### 2. `partner_validation_requests`
Tracks partner validation requests for admin approval workflow.

**Columns:**
- `id` (UUID, Primary Key) - Unique request identifier
- `partner_id` (UUID, Foreign Key) - References partners(id)
- `status` (validation_request_status ENUM) - 'pending', 'approved', 'rejected'
- `submitted_data` (JSONB, Required) - Snapshot of registration data
- `admin_notes` (TEXT, Optional) - Admin notes about the request
- `processed_by` (UUID, Optional) - Admin who processed the request
- `processed_at` (TIMESTAMPTZ, Optional) - When request was processed
- `created_at` (TIMESTAMPTZ) - Creation timestamp

### Extended Tables

#### `lofts` table extension
- Added `partner_id` (UUID, Optional) - References partners(id)
- Allows properties to be assigned to partners

### Custom Types (ENUMs)

```sql
CREATE TYPE business_type AS ENUM ('individual', 'company');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE validation_request_status AS ENUM ('pending', 'approved', 'rejected');
```

### Indexes

Performance indexes created for common queries:

**Partners table:**
- `idx_partners_user_id` - Fast user lookup
- `idx_partners_verification_status` - Filter by status
- `idx_partners_created_at` - Chronological ordering
- `idx_partners_approved_by` - Admin activity tracking
- `idx_partners_rejected_by` - Admin activity tracking
- `idx_partners_status_created` - Composite index for status + date queries

**Partner validation requests:**
- `idx_partner_validation_requests_partner_id` - Partner's requests
- `idx_partner_validation_requests_status` - Filter by status
- `idx_partner_validation_requests_created_at` - Chronological ordering
- `idx_partner_validation_requests_processed_by` - Admin activity
- `idx_validation_requests_status_created` - Composite index

**Lofts table:**
- `idx_lofts_partner_id` - Partner's properties

## Functions

### 1. `get_partner_dashboard_stats(partner_user_id UUID)`
Returns dashboard statistics for a partner.

**Returns:** JSONB with structure:
```json
{
  "properties": {
    "total": 0,
    "available": 0,
    "occupied": 0,
    "maintenance": 0
  },
  "revenue": {
    "current_month": 0,
    "previous_month": 0,
    "year_to_date": 0,
    "currency": "DZD"
  },
  "reservations": {
    "active": 0,
    "upcoming": 0,
    "completed_this_month": 0
  },
  "occupancy_rate": {
    "current_month": 0,
    "previous_month": 0
  }
}
```

### 2. `approve_partner(partner_id UUID, admin_user_id UUID, admin_notes TEXT)`
Approves a partner and updates related validation requests.

**Security:** Checks admin permissions before execution.

### 3. `reject_partner(partner_id UUID, admin_user_id UUID, rejection_reason TEXT, admin_notes TEXT)`
Rejects a partner with reason and updates related validation requests.

**Security:** Checks admin permissions before execution.

## Row Level Security (RLS)

### Partners Table Policies

1. **`partners_select_own`** - Partners can view their own profile
2. **`partners_update_own`** - Partners can update their own profile
3. **`partners_admin_all`** - Admins have full access

### Partner Validation Requests Policies

1. **`validation_requests_select_own`** - Partners can view their own requests
2. **`validation_requests_insert_own`** - Partners can create their own requests
3. **`validation_requests_admin_all`** - Admins have full access

### Lofts Table Policies

1. **`lofts_partner_select`** - Partners can only see their own properties

### Reservations Table Policies (if exists)

1. **`reservations_partner_select`** - Partners can only see reservations for their properties

## Triggers

### `partners_updated_at_trigger`
Automatically updates the `updated_at` timestamp when a partner record is modified.

## Installation

### Method 1: Run Complete Schema
```sql
-- Run the complete schema file
\i database/partner-dashboard-schema.sql
```

### Method 2: Run Migration
```sql
-- Run the migration file
\i database/migrations/001-add-partner-system.sql
```

### Method 3: Manual Steps
1. Create custom types
2. Create tables
3. Create indexes
4. Create functions
5. Enable RLS and create policies
6. Grant permissions

## Testing

Run the test script to verify the schema:

```bash
node scripts/test-partner-schema.js
```

The test script verifies:
- Tables exist and are accessible
- Custom types are created
- Functions are available
- Indexes are created
- RLS policies are active

## Usage Examples

### Create a Partner
```sql
INSERT INTO partners (
  user_id, 
  address, 
  phone, 
  business_type, 
  portfolio_description
) VALUES (
  'user-uuid-here',
  '123 Main St, Algiers',
  '+213123456789',
  'individual',
  'I own 3 apartments in downtown Algiers'
);
```

### Get Partner Dashboard Stats
```sql
SELECT get_partner_dashboard_stats('user-uuid-here');
```

### Approve a Partner (Admin)
```sql
SELECT approve_partner(
  'partner-uuid-here',
  'admin-user-uuid-here',
  'Partner verified and approved'
);
```

## Security Considerations

1. **Data Isolation**: RLS policies ensure partners only access their own data
2. **Admin Permissions**: Functions check admin roles before execution
3. **Audit Trail**: All approval/rejection actions are logged with timestamps and admin IDs
4. **Input Validation**: Database constraints prevent invalid data

## Performance Considerations

1. **Indexes**: Comprehensive indexing for common query patterns
2. **Composite Indexes**: Multi-column indexes for complex queries
3. **Function Security**: SECURITY DEFINER functions for controlled access
4. **Efficient Queries**: Optimized for dashboard loading and admin operations

## Future Enhancements

1. **Revenue Tracking**: Integration with transaction system for revenue calculations
2. **Reservation Integration**: Link with reservation system for occupancy tracking
3. **Document Management**: Enhanced document upload and verification system
4. **Notification System**: Automated notifications for status changes
5. **Analytics**: Advanced reporting and analytics for partners

## Troubleshooting

### Common Issues

1. **RLS Blocking Queries**: Ensure proper authentication context
2. **Permission Errors**: Check user roles and policy conditions
3. **Function Errors**: Verify admin permissions for approval/rejection functions
4. **Index Performance**: Monitor query performance and add indexes as needed

### Debug Queries

```sql
-- Check partner status
SELECT id, verification_status, created_at FROM partners WHERE user_id = 'user-uuid';

-- Check validation requests
SELECT * FROM partner_validation_requests WHERE partner_id = 'partner-uuid';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE tablename IN ('partners', 'partner_validation_requests');
```