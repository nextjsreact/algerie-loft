/**
 * Updated comprehensive tests for audit components
 * Tests audit history, filters, table, and log item components with proper mocking
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { AuditHistory } from '@/components/audit/audit-history'
import { AuditFilters } from '@/components/audit/audit-filters'
import { AuditTable } from '@/components/audit/audit-table'
import { AuditLogItem } from '@/components/audit/audit-log-item'
import { AuditLog, AuditFilters as AuditFiltersType } from '@/lib/types'

// Mock the date picker component
jest.mock('@/components/ui/date-range-picker', () => ({
  DatePickerWithRange: ({ value, onChange, className }: any) => (
    <div data-testid="date-range-picker" className={className}>
      <input
        type="date"
        data-testid="date-from"
        value={value?.from ? value.from.toISOString().split('T')[0] : ''}
        onChange={(e) => {
          const newDate = e.target.value ? new Date(e.target.value) : undefined
          onChange({ ...value, from: newDate })
        }}
      />
      <input
        type="date"
        data-testid="date-to"
        value={value?.to ? value.to.toISOString().split('T')[0] : ''}
        onChange={(e) => {
          const newDate = e.target.value ? new Date(e.target.value) : undefined
          onChange({ ...value, to: newDate })
        }}
      />
    </div>
  )
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn()
  }
})

const mockMessages = {
  audit: {
    auditHistory: 'Audit History',
    auditHistoryFor: 'Audit History for',
    refresh: 'Refresh',
    totalChanges: 'total changes',
    created: 'created',
    updated: 'updated',
    deleted: 'deleted',
    users: 'users',
    filters: 'Filters',
    clearFilters: 'Clear Filters',
    action: 'Action',
    allActions: 'All Actions',
    user: 'User',
    allUsers: 'All Users',
    dateRange: 'Date Range',
    showingResults: 'Showing {filtered} of {total} results',
    noAuditLogs: 'No Audit Logs',
    noMatchingLogs: 'No Matching Logs',
    noAuditLogsDescription: 'No audit logs found for this record',
    tryAdjustingFilters: 'Try adjusting your filters',
    chronologicalOrder: 'Chronological order (newest first)',
    fetchError: 'Failed to fetch audit logs',
    retry: 'Retry',
    auditLogs: 'Audit Logs',
    entries: 'entries',
    selectedCount: '{count} selected',
    exportSelected: 'Export Selected',
    selectAll: 'Select All',
    selectLog: 'Select Log',
    timestamp: 'Timestamp',
    table: 'Table',
    recordId: 'Record ID',
    changes: 'Changes',
    actions: 'Actions',
    openMenu: 'Open Menu',
    viewDetails: 'View Details',
    copyRecordId: 'Copy Record ID',
    unknownUser: 'Unknown User',
    fieldsChanged: 'fields changed',
    newRecord: 'New record',
    recordDeleted: 'Record deleted',
    noChanges: 'No changes',
    showingEntries: 'Showing {start} to {end} of {total} entries',
    selectedEntries: '{count} selected',
    search: 'Search',
    searchPlaceholder: 'Search in audit logs...',
    searchDescription: 'Search in user emails, record IDs, and change descriptions',
    tableName: 'Table',
    allTables: 'All Tables',
    recordIdPlaceholder: 'Enter record ID...',
    dateRangeDescription: 'Filter by date range',
    applyFilters: 'Apply Filters',
    resetFilters: 'Reset Filters',
    activeFiltersCount: '{count} active filters',
    filtersActive: 'Active',
    'actions.created': 'Created',
    'actions.updated': 'Updated',
    'actions.deleted': 'Deleted',
    'tables.transactions': 'Transactions',
    'tables.tasks': 'Tasks',
    'tables.reservations': 'Reservations',
    'tables.lofts': 'Lofts',
    changedFields: 'Changed Fields',
    oldValue: 'Old Value',
    newValue: 'New Value',
    empty: 'Empty',
    createdData: 'Created Data',
    deletedData: 'Deleted Data',
    metadata: 'Metadata',
    ipAddress: 'IP Address',
    userAgent: 'User Agent'
  }
}

const createMockLog = (overrides: Partial<AuditLog> = {}): AuditLog => ({
  id: `log-${Math.random()}`,
  tableName: 'transactions',
  recordId: 'record-123',
  action: 'UPDATE',
  userId: 'user-1',
  userEmail: 'john@example.com',
  timestamp: '2024-01-15T10:30:00Z',
  oldValues: { amount: 100 },
  newValues: { amount: 150 },
  changedFields: ['amount'],
  ...overrides
})

const mockUsers = [
  { id: 'user-1', email: 'john@example.com', full_name: 'John Doe' },
  { id: 'user-2', email: 'jane@example.com', full_name: 'Jane Smith' }
]

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  )
}

describe('Audit Components Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ logs: [] })
    })
  })

  describe('AuditHistory Component', () => {
    it('should render basic structure', async () => {
      renderWithIntl(
        <AuditHistory tableName="transactions" recordId="test-123" />
      )

      expect(screen.getByText('Audit History for')).toBeInTheDocument()
      expect(screen.getByText('Transactions')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      renderWithIntl(
        <AuditHistory tableName="transactions" recordId="test-123" />
      )

      // Should show skeleton loading
      const skeletonElements = document.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('should fetch audit logs on mount', () => {
      renderWithIntl(
        <AuditHistory tableName="tasks" recordId="task-456" />
      )

      expect(mockFetch).toHaveBeenCalledWith('/api/audit/entity/tasks/task-456')
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      })

      renderWithIntl(
        <AuditHistory tableName="transactions" recordId="test-123" />
      )

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch audit logs/)).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should display audit logs when loaded successfully', async () => {
      const logs = [createMockLog({ id: 'test-log-1' })]
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs })
      })

      renderWithIntl(
        <AuditHistory tableName="transactions" recordId="test-123" />
      )

      await waitFor(() => {
        expect(screen.getByTestId('audit-log-test-log-1')).toBeInTheDocument()
      })
    })

    it('should show empty state when no logs exist', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs: [] })
      })

      renderWithIntl(
        <AuditHistory tableName="transactions" recordId="test-123" />
      )

      await waitFor(() => {
        expect(screen.getByText('No Audit Logs')).toBeInTheDocument()
        expect(screen.getByText('No audit logs found for this record')).toBeInTheDocument()
      })
    })

    it('should refresh data when refresh button is clicked', async () => {
      const user = userEvent.setup()
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs: [] })
      })

      renderWithIntl(
        <AuditHistory tableName="transactions" recordId="test-123" />
      )

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument()
      })

      const refreshButton = screen.getByText('Refresh')
      await user.click(refreshButton)

      // Should call fetch again
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('AuditFilters Component', () => {
    const defaultProps = {
      filters: {},
      onFiltersChange: jest.fn(),
      onApplyFilters: jest.fn(),
      onResetFilters: jest.fn(),
      availableUsers: mockUsers,
      loading: false
    }

    it('should render all filter components', () => {
      renderWithIntl(<AuditFilters {...defaultProps} />)

      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByLabelText(/search/i)).toBeInTheDocument()
      expect(screen.getByText('Table')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('User')).toBeInTheDocument()
      expect(screen.getByLabelText(/record id/i)).toBeInTheDocument()
      expect(screen.getByText('Date Range')).toBeInTheDocument()
      expect(screen.getByText('Apply Filters')).toBeInTheDocument()
      expect(screen.getByText('Reset Filters')).toBeInTheDocument()
    })

    it('should show active filters indicator when filters are applied', () => {
      const filters: AuditFiltersType = {
        tableName: 'transactions',
        action: 'INSERT'
      }

      renderWithIntl(<AuditFilters {...defaultProps} filters={filters} />)

      expect(screen.getByText('(Active)')).toBeInTheDocument()
      expect(screen.getByText('2 active filters')).toBeInTheDocument()
    })

    it('should update search filter on input change', async () => {
      const user = userEvent.setup()
      renderWithIntl(<AuditFilters {...defaultProps} />)

      const searchInput = screen.getByLabelText(/search/i)
      await user.type(searchInput, 'test search')

      expect(searchInput).toHaveValue('test search')
    })

    it('should call onApplyFilters when apply button is clicked', async () => {
      const user = userEvent.setup()
      const onApplyFilters = jest.fn()
      
      renderWithIntl(
        <AuditFilters {...defaultProps} onApplyFilters={onApplyFilters} />
      )

      const applyButton = screen.getByText('Apply Filters')
      await user.click(applyButton)

      expect(onApplyFilters).toHaveBeenCalledTimes(1)
    })

    it('should disable buttons when loading', () => {
      renderWithIntl(<AuditFilters {...defaultProps} loading={true} />)

      const applyButton = screen.getByText('Apply Filters')
      const resetButton = screen.getByText('Reset Filters')

      expect(applyButton).toBeDisabled()
      expect(resetButton).toBeDisabled()
    })
  })

  describe('AuditTable Component', () => {
    const defaultProps = {
      logs: [],
      loading: false,
      selectedLogs: [],
      onSelectionChange: jest.fn(),
      onExportSelected: jest.fn(),
      onViewDetails: jest.fn(),
      showSelection: true,
      showActions: true
    }

    it('should render table headers correctly', () => {
      renderWithIntl(<AuditTable {...defaultProps} />)

      expect(screen.getByText('Audit Logs')).toBeInTheDocument()
      expect(screen.getByText('Timestamp')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Table')).toBeInTheDocument()
      expect(screen.getByText('Record ID')).toBeInTheDocument()
      expect(screen.getByText('User')).toBeInTheDocument()
      expect(screen.getByText('Changes')).toBeInTheDocument()
    })

    it('should show loading skeleton when loading', () => {
      renderWithIntl(<AuditTable {...defaultProps} loading={true} />)

      const skeletonElements = document.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('should show empty state when no logs', () => {
      renderWithIntl(<AuditTable {...defaultProps} logs={[]} />)

      expect(screen.getByText('No Audit Logs')).toBeInTheDocument()
    })

    it('should display log data correctly', () => {
      const logs = [createMockLog({
        userEmail: 'test@example.com',
        action: 'INSERT',
        tableName: 'tasks',
        timestamp: '2024-01-15T14:30:00Z',
        changedFields: ['title', 'description']
      })]

      renderWithIntl(<AuditTable {...defaultProps} logs={logs} />)

      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('Tasks')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('fields changed')).toBeInTheDocument()
    })

    it('should handle row selection', async () => {
      const user = userEvent.setup()
      const logs = [createMockLog({ id: 'test-log' })]
      const onSelectionChange = jest.fn()
      
      renderWithIntl(
        <AuditTable 
          {...defaultProps} 
          logs={logs} 
          onSelectionChange={onSelectionChange}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      const firstRowCheckbox = checkboxes[1] // Skip "select all" checkbox

      await user.click(firstRowCheckbox)

      expect(onSelectionChange).toHaveBeenCalledWith(['test-log'])
    })

    it('should sort logs by timestamp by default (newest first)', () => {
      const logs = [
        createMockLog({ 
          id: 'log-1', 
          timestamp: '2024-01-01T10:00:00Z', 
          userEmail: 'first@example.com' 
        }),
        createMockLog({ 
          id: 'log-2', 
          timestamp: '2024-01-03T10:00:00Z', 
          userEmail: 'third@example.com' 
        }),
        createMockLog({ 
          id: 'log-3', 
          timestamp: '2024-01-02T10:00:00Z', 
          userEmail: 'second@example.com' 
        })
      ]

      renderWithIntl(<AuditTable {...defaultProps} logs={logs} />)

      const rows = screen.getAllByRole('row')
      // Skip header row, check data rows
      expect(rows[1]).toHaveTextContent('third@example.com') // Most recent
      expect(rows[2]).toHaveTextContent('second@example.com')
      expect(rows[3]).toHaveTextContent('first@example.com') // Oldest
    })
  })

  describe('AuditLogItem Component', () => {
    it('should render audit log item with basic information', () => {
      const log = createMockLog()
      renderWithIntl(<AuditLogItem log={log} />)

      expect(screen.getByText('Updated')).toBeInTheDocument()
      expect(screen.getByText('Transactions')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('should show unknown user when userEmail is null', () => {
      const log = createMockLog({ userEmail: '' })
      renderWithIntl(<AuditLogItem log={log} />)

      expect(screen.getByText('Unknown User')).toBeInTheDocument()
    })

    it('should render different action types with correct styling', () => {
      const insertLog = createMockLog({ action: 'INSERT' })
      const { unmount } = renderWithIntl(<AuditLogItem log={insertLog} />)
      
      expect(screen.getByText('Created')).toBeInTheDocument()
      unmount()

      const updateLog = createMockLog({ action: 'UPDATE' })
      const { unmount: unmount2 } = renderWithIntl(<AuditLogItem log={updateLog} />)
      
      expect(screen.getByText('Updated')).toBeInTheDocument()
      unmount2()

      const deleteLog = createMockLog({ action: 'DELETE' })
      renderWithIntl(<AuditLogItem log={deleteLog} />)
      
      expect(screen.getByText('Deleted')).toBeInTheDocument()
    })

    it('should expand details when button is clicked', async () => {
      const user = userEvent.setup()
      const log = createMockLog()
      renderWithIntl(<AuditLogItem log={log} />)

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('Changed Fields')).toBeInTheDocument()
    })

    it('should display changed fields for UPDATE action', async () => {
      const user = userEvent.setup()
      const log = createMockLog({
        action: 'UPDATE',
        changedFields: ['amount', 'description'],
        oldValues: { amount: 100, description: 'Old desc' },
        newValues: { amount: 150, description: 'New desc' }
      })
      renderWithIntl(<AuditLogItem log={log} />)

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('Changed Fields')).toBeInTheDocument()
      expect(screen.getByText('amount')).toBeInTheDocument()
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should work together in a complete audit flow', async () => {
      const user = userEvent.setup()
      const logs = [
        createMockLog({ 
          id: 'log-1',
          action: 'INSERT', 
          userEmail: 'alice@example.com',
          timestamp: '2024-01-01T10:00:00Z'
        }),
        createMockLog({ 
          id: 'log-2',
          action: 'UPDATE', 
          userEmail: 'bob@example.com',
          timestamp: '2024-01-02T10:00:00Z'
        })
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs })
      })

      renderWithIntl(
        <AuditHistory tableName="transactions" recordId="test-123" />
      )

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('audit-log-log-1')).toBeInTheDocument()
        expect(screen.getByTestId('audit-log-log-2')).toBeInTheDocument()
      })

      // Check statistics
      expect(screen.getByText('2')).toBeInTheDocument() // total changes
      expect(screen.getByText('1 created')).toBeInTheDocument()
      expect(screen.getByText('1 updated')).toBeInTheDocument()

      // Test refresh functionality
      const refreshButton = screen.getByText('Refresh')
      await user.click(refreshButton)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle filtering in audit history', async () => {
      const user = userEvent.setup()
      const logs = [
        createMockLog({ 
          id: 'log-1',
          action: 'INSERT', 
          userEmail: 'alice@example.com'
        }),
        createMockLog({ 
          id: 'log-2',
          action: 'UPDATE', 
          userEmail: 'bob@example.com'
        })
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs })
      })

      renderWithIntl(
        <AuditHistory tableName="transactions" recordId="test-123" />
      )

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
      })

      // Both logs should be visible initially
      expect(screen.getByTestId('audit-log-log-1')).toBeInTheDocument()
      expect(screen.getByTestId('audit-log-log-2')).toBeInTheDocument()

      // Apply action filter
      const selects = screen.getAllByRole('combobox')
      if (selects.length > 0) {
        await user.click(selects[0])
        const createdOption = screen.getByText('Created')
        await user.click(createdOption)

        // Should only show INSERT logs
        expect(screen.getByTestId('audit-log-log-1')).toBeInTheDocument()
        expect(screen.queryByTestId('audit-log-log-2')).not.toBeInTheDocument()
      }
    })
  })
})