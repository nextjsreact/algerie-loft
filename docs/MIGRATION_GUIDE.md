# Migration Guide - Implementing Improvements

## 🚀 Quick Start Implementation

### 1. Install New Dependencies

```bash
npm install @testing-library/jest-dom @testing-library/react @testing-library/user-event @types/jest jest jest-environment-jsdom
```

### 2. Environment Security Setup

```bash
# Remove .env from version control (if not already done)
git rm --cached .env

# Copy your current .env values to a secure location
# Then update .env with your actual values using .env.example as template
```

### 3. Database Schema Updates

You'll need to add these tables to your Supabase database:

```sql
-- Audit logs table
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance tasks table
CREATE TABLE maintenance_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loft_id UUID REFERENCES lofts(id),
  task_type TEXT NOT NULL,
  description TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  frequency TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  estimated_cost DECIMAL(10,2),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property documents table
CREATE TABLE property_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loft_id UUID REFERENCES lofts(id),
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  description TEXT
);

-- Enhanced notifications table (if not exists)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
```

### 4. Update Existing Components

#### Update your main layout to use the new error boundary:

```tsx
// In app/layout.tsx, wrap children with ErrorBoundary
import { ErrorBoundary } from "@/components/error-boundary";

// Wrap your main content:
<ErrorBoundary>{children}</ErrorBoundary>;
```

#### Update your dashboard to use the new service:

The dashboard page has already been updated in the files above. Make sure to import the new components:

```tsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
```

### 5. Testing Setup

```bash
# Run tests to ensure everything works
npm test

# Run with coverage
npm run test:coverage
```

## 🔧 Gradual Implementation Strategy

### Phase 1: Core Infrastructure (Week 1)

1. ✅ Security fixes (environment variables, password validation)
2. ✅ Performance optimizations (parallel queries)
3. ✅ Error handling improvements
4. ✅ Basic testing setup

### Phase 2: Service Layer (Week 2)

1. ✅ Dashboard service implementation
2. ✅ Financial service setup
3. ✅ Property service creation
4. ✅ Logging system integration

### Phase 3: Advanced Features (Week 3-4)

1. ✅ Notification system
2. ✅ Audit trail implementation
3. ✅ Advanced analytics
4. ✅ UI component enhancements

### Phase 4: Integration & Testing (Week 5)

1. Database schema updates
2. Component integration
3. End-to-end testing
4. Performance monitoring setup

## 🔍 Component Integration Examples

### Using the New Search Component

```tsx
import { SearchInput, useSearch } from "@/components/ui/search";

function LoftsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [lofts, setLofts] = useState([]);

  const filteredLofts = useSearch(lofts, ["name", "address"], searchTerm);

  return (
    <div>
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search lofts..."
      />
      {/* Render filtered lofts */}
    </div>
  );
}
```

### Using the Bulk Operations Component

```tsx
import {
  BulkOperations,
  useBulkSelection,
} from "@/components/ui/bulk-operations";

function TasksList() {
  const [tasks, setTasks] = useState([]);
  const { selectedIds, handleSelectAll, handleItemSelect, clearSelection } =
    useBulkSelection(tasks);

  const bulkActions = [
    {
      key: "delete",
      label: "Delete",
      variant: "destructive" as const,
      requiresConfirmation: true,
      icon: <Trash2 className="h-4 w-4" />,
    },
  ];

  return (
    <div>
      <BulkOperations
        selectedItems={selectedIds}
        totalItems={tasks.length}
        onSelectAll={handleSelectAll}
        onSelectionChange={clearSelection}
        actions={bulkActions}
        onAction={(action, ids) => {
          // Handle bulk action
        }}
      />
      {/* Render tasks with selection checkboxes */}
    </div>
  );
}
```

### Using the Data Export Component

```tsx
import { DataExport, exportToCSV } from "@/components/ui/data-export";

function ReportsPage() {
  const handleExport = async (config) => {
    // Fetch data based on config
    const data = await fetchDataForExport(config);

    // Export based on format
    switch (config.format) {
      case "csv":
        await exportToCSV(data, `${config.type}-export`);
        break;
      // Handle other formats
    }
  };

  return (
    <div>
      <DataExport
        onExport={handleExport}
        availableTypes={["lofts", "transactions", "tasks"]}
      />
    </div>
  );
}
```

## 🔐 Security Checklist

- [ ] Environment variables secured and not in version control
- [ ] Strong password validation implemented
- [ ] Role-based access control verified
- [ ] Audit logging enabled for sensitive operations
- [ ] Error messages don't expose sensitive information
- [ ] Input validation on all forms
- [ ] SQL injection protection verified

## 📊 Performance Checklist

- [ ] Dashboard loads in under 2 seconds
- [ ] Database queries optimized and indexed
- [ ] Error boundaries prevent app crashes
- [ ] Loading states provide user feedback
- [ ] Large lists use pagination or virtualization
- [ ] Images optimized and properly sized

## 🧪 Testing Checklist

- [ ] All new services have unit tests
- [ ] Validation schemas tested thoroughly
- [ ] Error scenarios covered in tests
- [ ] Integration tests for critical paths
- [ ] Performance tests for heavy operations

## 🚨 Common Issues & Solutions

### Issue: Tests failing due to missing dependencies

**Solution**: Make sure all testing dependencies are installed:

```bash
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event @types/jest jest jest-environment-jsdom
```

### Issue: Supabase client errors in tests

**Solution**: The jest.setup.js file includes proper Supabase mocking. Make sure it's configured correctly.

### Issue: Environment variables not loading

**Solution**: Ensure your .env file is in the root directory and contains all required variables from .env.example.

### Issue: Database schema errors

**Solution**: Run the SQL commands provided above in your Supabase SQL editor to create the required tables.

## 📞 Support & Next Steps

After implementing these improvements:

1. **Monitor Performance**: Use the built-in logging to monitor application performance
2. **User Feedback**: Gather feedback on new features and UI improvements
3. **Gradual Rollout**: Consider feature flags for gradual rollout of new functionality
4. **Documentation**: Update user documentation to reflect new features
5. **Training**: Provide training for users on new capabilities

The improvements provide a solid foundation for scaling your loft management system. The modular architecture makes it easy to add new features and the comprehensive testing ensures reliability as you grow.

---

_For technical support or questions about implementation, refer to the individual service files and component documentation._
