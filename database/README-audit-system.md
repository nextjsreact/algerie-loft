# Audit System Database Schema

This directory contains the complete audit system database schema and related files for tracking all CRUD operations on critical entities.

## Files

- `audit-system-schema.sql` - Complete audit system schema including tables, functions, indexes, and RLS policies
- `test-audit-schema.sql` - Test script to validate the audit system functionality
- `README-audit-system.md` - This documentation file

## Installation

1. Execute the main schema file to create the audit system:
```sql
\i database/audit-system-schema.sql
```

2. (Optional) Run the test script to verify installation:
```sql
\i database/test-audit-schema.sql
```

## Components Created

### Schema
- `audit` - Dedicated schema for all audit-related objects

### Tables
- `audit.audit_logs` - Main audit table storing all CRUD operation logs

### Functions
- `audit.audit_trigger_function()` - Generic trigger function for logging operations
- `audit.set_audit_user_context()` - Set user context for audit tracking
- `audit.clear_audit_user_context()` - Clear user context variables
- `audit.create_audit_trigger()` - Helper to create audit triggers on tables
- `audit.drop_audit_trigger()` - Helper to remove audit triggers from tables
- `audit.get_audit_statistics()` - Get audit statistics by table

### Indexes
- 8 performance indexes for efficient querying of audit logs
- GIN indexes on JSONB fields for full-text search capabilities

### Security
- Row Level Security (RLS) policies for access control
- Immutable audit logs (no updates/deletes allowed)
- Role-based access (admin/manager can view all, users can view their own)

## Usage

### 1. Enable Audit on a Table

To start auditing a table (e.g., transactions):

```sql
SELECT audit.create_audit_trigger('transactions');
```

### 2. Set User Context (in application code)

Before performing operations, set the user context:

```sql
SELECT audit.set_audit_user_context(
    'user-uuid'::UUID,
    'user@example.com',
    '192.168.1.1'::INET,
    'Mozilla/5.0...',
    'session-id'
);
```

### 3. Query Audit Logs

Get all audit logs for a specific record:

```sql
SELECT * FROM audit.audit_logs 
WHERE table_name = 'transactions' 
AND record_id = 'record-uuid'
ORDER BY timestamp DESC;
```

Get audit statistics:

```sql
SELECT * FROM audit.get_audit_statistics();
```

### 4. Search in Audit Data

Search for specific values in old/new data:

```sql
SELECT * FROM audit.audit_logs 
WHERE old_values @> '{"amount": 100}'
OR new_values @> '{"status": "completed"}';
```

## Requirements Addressed

This schema addresses the following audit system requirements:

- **5.2**: Foundation for audit history display in entity detail pages
- **6.2**: JSONB fields with GIN indexes support keyword searches in audit data
- **7.1**: Asynchronous trigger-based logging that doesn't block main operations
- **7.2**: Database triggers ensure consistency of audit logging
- **7.4**: Performance indexes optimize audit query performance
- **8.1**: RLS policies ensure audit logs are read-only for regular users
- **8.4**: Role-based access control prevents unauthorized audit access

## Performance Considerations

- Triggers are designed with error handling to never block main operations
- Comprehensive indexing strategy for efficient queries
- JSONB fields allow flexible searching while maintaining performance
- RLS policies provide security without significant performance impact

## Security Features

- Audit logs are immutable (cannot be updated or deleted)
- Row-level security restricts access based on user roles
- User context tracking for complete audit trails
- Failed audit operations are logged but don't affect main operations

## Next Steps

After installing this schema:

1. Create audit triggers on target tables (transactions, tasks, reservations, lofts)
2. Implement application-level user context setting
3. Build UI components for displaying audit history
4. Create admin dashboard for audit log management