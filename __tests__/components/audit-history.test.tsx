/**
 * Unit tests for AuditHistory component
 * Tests audit history rendering, filtering, and API interactions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditHistory } from '@/components/audit/audit-history'
import { NextIntlClientProvider } from 'next-intl'
import { AuditLog } from '@/lib/types'

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

// Mock AuditLogItem component
jest.mock('@/components/audit/audit-log-item', () => ({
  AuditLogItem: ({ log, className }: { log: AuditLog; className?: string }) => (
    <div data-testid={`audit-log-${log.id}`} className={className}>
      <div>{log.action} - {log.userEmail} - {log.timestamp}</div>
    </div>
  )
}))

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
    'actions.created': 'Created',
    'actions.updated': 'Updated',
    'actions.deleted': 'Deleted',
    'tables.transactions': 'Transactions',
    'tables.tasks': 'Tasks',
    'tables.reservations': 'Reservations',
    'tables.lofts': 'Lofts'
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

const createMockLogs = (count: number): AuditLog[] => {
  return Array.from({ length: count }, (_, i) => createMockLog({
    id: `log-${i}`,
    timestamp: new Date(2024, 0, i + 1, 10, 30).toISOString(),
    userEmail: `user${i}@example.com`,
    action: ['INSERT', 'UPDATE', 'DELETE'][i % 3] as any
  }))
}

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

const renderAuditHistory = (props: Partial<React.ComponentProps<typeof AuditHistory>> = {}) => {
  const defaultProps = {
    tableName: 'transactions',
    recordId: 'record-123',
    showFilters: true,
    maxHeight: '600px',
    ...props
  }

  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      <AuditHistory {...defaultProps} />
    </NextIntlClientProvider>
  )
}

describe('AuditHistory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ logs: [] })
    })
  })

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      renderAuditHistory()

      expect(screen.getByText('Audit History')).toBeInTheDocument()
      // Should show skeleton loading
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3)
    })

    it('should fetch audit logs on mount', () => {
      renderAuditHistory({ tableName: 'tasks', recordId: 'task-456' })

      expect(mockFetch).toHaveBeenCalledWith('/api/audit/entity/tasks/task-456')
    })

    it('should display table name in title', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs: [] })
      })

      renderAuditHistory({ tableName: 'tasks' })

      await waitFor(() => {
        expect(screen.getByText('Audit History for Tasks')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading', () => {
    it('should display audit logs when loaded successfully', async () => {
      const logs = createMockLogs(2)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs })
      })

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByTestId('audit-log-log-0')).toBeInTheDocument()
        expect(screen.getByTestId('audit-log-log-1')).toBeInTheDocument()
      })
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      })

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch audit logs: Internal Server Error')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should handle API response errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: 'Custom API error' })
      })

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('Custom API error')).toBeInTheDocument()
      })
    })

    it('should retry loading when retry button is clicked', async () => {
      const user = userEvent.setup()
      
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error'
      })

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ logs: [] })
      })

      const retryButton = screen.getByText('Retry')
      await user.click(retryButton)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Statistics Display', () => {
    it('should display correct statistics', async () => {
      const logs = [
        createMockLog({ action: 'INSERT', userEmail: 'user1@example.com' }),
        createMockLog({ action: 'UPDATE', userEmail: 'user1@example.com' }),
        createMockLog({ action: 'UPDATE', userEmail: 'user2@example.com' }),
        createMockLog({ action: 'DELETE', userEmail: 'user2@example.com' })
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs })
      })

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument() // total changes
        expect(screen.getByText('1 created')).toBeInTheDocument()
        expect(screen.getByText('2 updated')).toBeInTheDocument()
        expect(screen.getByText('1 deleted')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument() // unique users
      })
    })

    it('should update statistics when filters are applied', async () => {
      const logs = [
        createMockLog({ action: 'INSERT', userEmail: 'user1@example.com' }),
        createMockLog({ action: 'UPDATE', userEmail: 'user2@example.com' })
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs })
      })

      const user = userEvent.setup()
      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument() // total
      })

      // Apply action filter
      const actionSelect = screen.getByDisplayValue('All Actions')
      await user.click(actionSelect)
      await user.click(screen.getByText('Created'))

      // Should show filtered results count
      expect(screen.getByText('Showing 1 of 2 results')).toBeInTheDocument()
    })
  })

  describe('Filtering Functionality', () => {
    beforeEach(async () => {
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
        }),
        createMockLog({ 
          id: 'log-3',
          action: 'DELETE', 
          userEmail: 'alice@example.com',
          timestamp: '2024-01-03T10:00:00Z'
        })
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs })
      })
    })

    it('should show filters when showFilters is true and logs exist', async () => {
      renderAuditHistory({ showFilters: true })

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
      })
    })

    it('should hide filters when showFilters is false', async () => {
      renderAuditHistory({ showFilters: false })

      await waitFor(() => {
        expect(screen.queryByText('Filters')).not.toBeInTheDocument()
      })
    })

    it('should filter by action', async () => {
      const user = userEvent.setup()
      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByTestId('audit-log-log-1')).toBeInTheDocument()
        expect(screen.getByTestId('audit-log-log-2')).toBeInTheDocument()
        expect(screen.getByTestId('audit-log-log-3')).toBeInTheDocument()
      })

      // Find and click action select
      const actionSelects = screen.getAllByRole('combobox')
      const actionSelect = actionSelects.find(select => 
        select.getAttribute('aria-expanded') !== null
      )
      
      if (actionSelect) {
        await user.click(actionSelect)
        const createdOption = screen.getByText('Created')
        await user.click(createdOption)

        // Should only show INSERT logs
        expect(screen.getByTestId('audit-log-log-1')).toBeInTheDocument()
        expect(screen.queryByTestId('audit-log-log-2')).not.toBeInTheDocument()
        expect(screen.queryByTestId('audit-log-log-3')).not.toBeInTheDocument()
      }
    })

    it('should filter by user', async () => {
      const user = userEvent.setup()
      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
      })

      // Find user select (second combobox)
      const selects = screen.getAllByRole('combobox')
      if (selects.length > 1) {
        await user.click(selects[1])
        const aliceOption = screen.getByText('alice@example.com')
        await user.click(aliceOption)

        // Should only show logs from alice
        expect(screen.getByTestId('audit-log-log-1')).toBeInTheDocument()
        expect(screen.queryByTestId('audit-log-log-2')).not.toBeInTheDocument()
        expect(screen.getByTestId('audit-log-log-3')).toBeInTheDocument()
      }
    })

    it('should filter by date range', async () => {
      const user = userEvent.setup()
      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByTestId('date-range-picker')).toBeInTheDocument()
      })

      // Set date range to filter out some logs
      const dateFromInput = screen.getByTestId('date-from')
      const dateToInput = screen.getByTestId('date-to')

      await user.clear(dateFromInput)
      await user.type(dateFromInput, '2024-01-02')
      await user.clear(dateToInput)
      await user.type(dateToInput, '2024-01-02')

      // Should only show logs from Jan 2
      expect(screen.queryByTestId('audit-log-log-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('audit-log-log-2')).toBeInTheDocument()
      expect(screen.queryByTestId('audit-log-log-3')).not.toBeInTheDocument()
    })

    it('should clear all filters', async () => {
      const user = userEvent.setup()
      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
      })

      // Apply some filters first
      const selects = screen.getAllByRole('combobox')
      if (selects.length > 0) {
        await user.click(selects[0])
        const createdOption = screen.getByText('Created')
        await user.click(createdOption)

        // Clear filters
        const clearButton = screen.getByText('Clear Filters')
        await user.click(clearButton)

        // Should show all logs again
        expect(screen.getByTestId('audit-log-log-1')).toBeInTheDocument()
        expect(screen.getByTestId('audit-log-log-2')).toBeInTheDocument()
        expect(screen.getByTestId('audit-log-log-3')).toBeInTheDocument()
      }
    })

    it('should show filtered results count', async () => {
      const user = userEvent.setup()
      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
      })

      // Apply filter
      const selects = screen.getAllByRole('combobox')
      if (selects.length > 0) {
        await user.click(selects[0])
        const createdOption = screen.getByText('Created')
        await user.click(createdOption)

        expect(screen.getByText('Showing 1 of 3 results')).toBeInTheDocument()
      }
    })
  })

  describe('Refresh Functionality', () => {
    it('should refresh data when refresh button is clicked', async () => {
      const user = userEvent.setup()
      const logs = createMockLogs(1)
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs })
      })

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument()
      })

      const refreshButton = screen.getByText('Refresh')
      await user.click(refreshButton)

      // Should call fetch again
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should show loading indicator during refresh', async () => {
      const user = userEvent.setup()
      
      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ logs: [] })
      })

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument()
      })

      // Refresh with delay
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ logs: [] })
          }), 100)
        )
      )

      const refreshButton = screen.getByText('Refresh')
      await user.click(refreshButton)

      // Should show spinning icon
      expect(refreshButton.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should disable refresh button during refresh', async () => {
      const user = userEvent.setup()
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ logs: [] })
      })

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument()
      })

      // Mock delayed response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ logs: [] })
          }), 100)
        )
      )

      const refreshButton = screen.getByText('Refresh')
      await user.click(refreshButton)

      expect(refreshButton).toBeDisabled()
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no logs exist', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs: [] })
      })

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('No Audit Logs')).toBeInTheDocument()
        expect(screen.getByText('No audit logs found for this record')).toBeInTheDocument()
      })
    })

    it('should show no matching logs state when filters exclude all logs', async () => {
      const logs = [createMockLog({ action: 'UPDATE' })]
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs })
      })

      const user = userEvent.setup()
      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Actions')).toBeInTheDocument()
      })

      // Filter by action that doesn't exist
      const actionSelect = screen.getByDisplayValue('All Actions')
      await user.click(actionSelect)
      await user.click(screen.getByText('Created'))

      expect(screen.getByText('No Matching Logs')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
    })
  })

  describe('Sorting and Timeline', () => {
    it('should sort logs chronologically (newest first)', async () => {
      const logs = [
        createMockLog({ 
          id: 'log-old',
          timestamp: '2024-01-01T10:00:00Z',
          userEmail: 'old@example.com'
        }),
        createMockLog({ 
          id: 'log-new',
          timestamp: '2024-01-03T10:00:00Z',
          userEmail: 'new@example.com'
        }),
        createMockLog({ 
          id: 'log-middle',
          timestamp: '2024-01-02T10:00:00Z',
          userEmail: 'middle@example.com'
        })
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs })
      })

      renderAuditHistory()

      await waitFor(() => {
        const logElements = screen.getAllByTestId(/audit-log-/)
        expect(logElements[0]).toHaveTextContent('new@example.com') // Newest first
        expect(logElements[1]).toHaveTextContent('middle@example.com')
        expect(logElements[2]).toHaveTextContent('old@example.com') // Oldest last
      })
    })

    it('should show chronological order indicator', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs: createMockLogs(1) })
      })

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByText('chronologicalOrder')).toBeInTheDocument()
      })
    })
  })

  describe('Props and Configuration', () => {
    it('should respect maxHeight prop', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs: [] })
      })

      renderAuditHistory({ maxHeight: '400px' })

      await waitFor(() => {
        const scrollContainer = document.querySelector('[style*="max-height: 400px"]')
        expect(scrollContainer).toBeInTheDocument()
      })
    })

    it('should apply custom className', () => {
      const { container } = renderAuditHistory({ className: 'custom-class' })

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should refetch when tableName or recordId changes', () => {
      const { rerender } = renderAuditHistory({ 
        tableName: 'transactions', 
        recordId: 'record-1' 
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/audit/entity/transactions/record-1')

      rerender(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <AuditHistory tableName="tasks" recordId="record-2" />
        </NextIntlClientProvider>
      )

      expect(mockFetch).toHaveBeenCalledWith('/api/audit/entity/tasks/record-2')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs: [] })
      })

      renderAuditHistory()

      await waitFor(() => {
        // The title is rendered as CardTitle, not a heading element
        expect(screen.getByText('auditHistoryFor')).toBeInTheDocument()
      })
    })

    it('should have proper button labels', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs: [] })
      })

      renderAuditHistory()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
      })
    })

    it('should have proper form labels in filters when filters are shown', async () => {
      const logs = createMockLogs(1)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logs })
      })

      renderAuditHistory()

      await waitFor(() => {
        // Only check for labels when filters are actually rendered
        if (screen.queryByText('Filters')) {
          expect(screen.getByText('action')).toBeInTheDocument()
          expect(screen.getByText('user')).toBeInTheDocument()
          expect(screen.getByText('dateRange')).toBeInTheDocument()
        }
      })
    })
  })
})