# Audit Components

This directory contains the core UI components for the audit system, providing a complete interface for viewing and managing audit logs.

## Components

### AuditLogItem

A component for displaying individual audit log entries with expandable details.

**Features:**
- Visual indicators for different action types (CREATE, UPDATE, DELETE)
- Expandable view for detailed old/new values comparison
- Proper formatting of timestamps, actions, and user information
- Support for metadata display (IP address, user agent)

**Usage:**
```tsx
import { AuditLogItem } from '@/components/audit'

<AuditLogItem 
  log={auditLog} 
  showDetails={false}
  className="mb-4"
/>
```

### AuditHistory

A comprehensive component for displaying the complete audit history of an entity.

**Features:**
- Timeline view of all changes for a specific entity
- Advanced filtering by action type, user, and date range
- Loading states and error handling
- Statistics display (total changes, user count, etc.)
- Pagination and performance optimization

**Usage:**
```tsx
import { AuditHistory } from '@/components/audit'

<AuditHistory 
  tableName="transactions"
  recordId="123e4567-e89b-12d3-a456-426614174000"
  showFilters={true}
  maxHeight="600px"
/>
```

### AuditExample

An example component demonstrating how to integrate audit history into existing entity detail pages.

**Usage:**
```tsx
import { AuditExample } from '@/components/audit'

<AuditExample 
  entityType="transactions"
  entityId="123e4567-e89b-12d3-a456-426614174000"
  entityName="Transaction #1234"
/>
```

## Integration Guide

### Adding Audit History to Entity Pages

1. **Import the component:**
```tsx
import { AuditHistory } from '@/components/audit'
```

2. **Add an audit tab to your entity detail page:**
```tsx
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="audit">Audit History</TabsTrigger>
  </TabsList>
  
  <TabsContent value="details">
    {/* Your existing entity details */}
  </TabsContent>
  
  <TabsContent value="audit">
    <AuditHistory 
      tableName="your_table_name"
      recordId={entityId}
    />
  </TabsContent>
</Tabs>
```

3. **Add permission checks (optional):**
```tsx
import { usePermissions } from '@/hooks/use-permissions'

const { canViewAudit } = usePermissions()

{canViewAudit && (
  <TabsTrigger value="audit">Audit History</TabsTrigger>
)}
```

## API Requirements

These components expect the following API endpoints to be available:

- `GET /api/audit/entity/{tableName}/{recordId}` - Get audit history for a specific entity
- The API should return data in the format defined by the `AuditLog` interface

## Translations

The components use the `audit` namespace for translations. Ensure the following keys are available:

- `audit.auditHistory`
- `audit.actions.created/updated/deleted`
- `audit.tables.transactions/tasks/reservations/lofts`
- And other keys as defined in the translation files

## Styling

The components use Tailwind CSS classes and follow the existing design system patterns. They are fully responsive and support both light and dark themes.

## Performance Considerations

- The `AuditHistory` component implements pagination and filtering to handle large datasets
- Use the `maxHeight` prop to limit the display area and enable scrolling
- Consider implementing virtual scrolling for very large audit logs

## Accessibility

- All components include proper ARIA labels and keyboard navigation
- Color coding is supplemented with icons for better accessibility
- Screen reader friendly timestamps and action descriptions