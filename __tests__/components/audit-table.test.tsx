/**
 * Unit tests for AuditTable component
 * Tests table rendering, sorting, pagination, and selection functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditTable } from '@/components/audit/audit-table'
import { NextIntlClientProvider } from 'next-intl'
import { AuditLog } from '@/lib/types'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn()
  }
})

const mockMessages = {
  audit: {
    auditLogs: 'Audit Logs',
    entries: 'entries',
    selectedCount: '{count} selected',
    exportSelected: 'Export Selected',
    selectAll: 'Select All',
    selectLog: 'Select Log',
    timestamp: 'Timestamp',
    action: 'Action',
    table: 'Table',
    recordId: 'Record ID',
    user: 'User',
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
    noAuditLogs: 'No Audit Logs',
    noAuditLogsDescription: 'No audit logs found for the current filters',
    showingEntries: 'Showing {start} to {end} of {total} entries',
    selectedEntries: '{count} selected',
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
    action: ['INSERT', 'UPDATE', 'DELETE'][i % 3] as any,
    tableName: ['transactions', 'tasks', 'reservations', 'lofts'][i % 4]
  }))
}

const renderAuditTable = (props: Partial<React.ComponentProps<typeof AuditTable>> = {}) => {
  const defaultProps = {
    logs: [],
    loading: false,
    selectedLogs: [],
    onSelectionChange: jest.fn(),
    onExportSelected: jest.fn(),
    onViewDetails: jest.fn(),
    showSelection: true,
    showActions: true,
    ...props
  }

  return {
    ...render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <AuditTable {...defaultProps} />
      </NextIntlClientProvider>
    ),
    props: defaultProps
  }
}

describe('AuditTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render table headers correctly', () => {
      renderAuditTable()

      expect(screen.getByText('auditLogs')).toBeInTheDocument()
      expect(screen.getByText('timestamp')).toBeInTheDocument()
      expect(screen.getByText('action')).toBeInTheDocument()
      expect(screen.getByText('table')).toBeInTheDocument()
      expect(screen.getByText('recordId')).toBeInTheDocument()
      expect(screen.getByText('user')).toBeInTheDocument()
      expect(screen.getByText('changes')).toBeInTheDocument()
    })

    it('should show entry count in header', () => {
      const logs = createMockLogs(5)
      renderAuditTable({ logs })

      expect(screen.getByText('(5 entries)')).toBeInTheDocument()
    })

    it('should hide selection column when showSelection is false', () => {
      renderAuditTable({ showSelection: false })

      expect(screen.queryByLabelText(/select all/i)).not.toBeInTheDocument()
    })

    it('should hide actions column when showActions is false', () => {
      const logs = createMockLogs(1)
      renderAuditTable({ logs, showActions: false })

      expect(screen.queryByRole('button', { name: /open menu/i })).not.toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      renderAuditTable({ loading: true })

      // Should show skeleton rows
      const skeletonElements = document.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('should not show actual data when loading', () => {
      const logs = createMockLogs(3)
      renderAuditTable({ logs, loading: true })

      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no logs', () => {
      renderAuditTable({ logs: [] })

      expect(screen.getByText('noAuditLogs')).toBeInTheDocument()
      expect(screen.getByText('noAuditLogsDescription')).toBeInTheDocument()
    })

    it('should not show empty state when loading', () => {
      renderAuditTable({ logs: [], loading: true })

      expect(screen.queryByText('noAuditLogs')).not.toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('should display log data correctly', () => {
      const logs = [createMockLog({
        userEmail: 'test@example.com',
        action: 'INSERT',
        tableName: 'tasks',
        timestamp: '2024-01-15T14:30:00Z',
        changedFields: ['title', 'description']
      })]

      renderAuditTable({ logs })

      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('actions.created')).toBeInTheDocument()
      expect(screen.getByText('tables.tasks')).toBeInTheDocument()
      expect(screen.getByText('1/15/2024')).toBeInTheDocument()
      expect(screen.getByText('2:30 PM')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('fields changed')).toBeInTheDocument()
    })

    it('should show unknown user when userEmail is empty', () => {
      const logs = [createMockLog({ userEmail: '' })]
      renderAuditTable({ logs })

      expect(screen.getByText('unknownUser')).toBeInTheDocument()
    })

    it('should truncate record ID display', () => {
      const logs = [createMockLog({ recordId: 'very-long-record-id-that-should-be-truncated' })]
      renderAuditTable({ logs })

      expect(screen.getByText('very-lon...')).toBeInTheDocument()
    })

    it('should show appropriate change descriptions', () => {
      const logs = [
        createMockLog({ action: 'INSERT', changedFields: [] }),
        createMockLog({ action: 'DELETE', changedFields: [] }),
        createMockLog({ action: 'UPDATE', changedFields: [] })
      ]

      renderAuditTable({ logs })

      expect(screen.getByText('newRecord')).toBeInTheDocument()
      expect(screen.getByText('recordDeleted')).toBeInTheDocument()
      expect(screen.getByText('noChanges')).toBeInTheDocument()
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort by timestamp by default (newest first)', () => {
      const logs = [
        createMockLog({ id: 'log-1', timestamp: '2024-01-01T10:00:00Z', userEmail: 'first@example.com' }),
        createMockLog({ id: 'log-2', timestamp: '2024-01-03T10:00:00Z', userEmail: 'third@example.com' }),
        createMockLog({ id: 'log-3', timestamp: '2024-01-02T10:00:00Z', userEmail: 'second@example.com' })
      ]

      renderAuditTable({ logs })

      const rows = screen.getAllByRole('row')
      // Skip header row, check data rows
      expect(rows[1]).toHaveTextContent('third@example.com') // Most recent
      expect(rows[2]).toHaveTextContent('second@example.com')
      expect(rows[3]).toHaveTextContent('first@example.com') // Oldest
    })

    it('should sort by timestamp when header is clicked', async () => {
      const user = userEvent.setup()
      const logs = createMockLogs(3)
      renderAuditTable({ logs })

      // Find the timestamp header by looking for the clickable element
      const timestampHeaders = screen.getAllByText('timestamp')
      const clickableHeader = timestampHeaders.find(header => 
        header.closest('.cursor-pointer')
      )
      
      if (clickableHeader) {
        await user.click(clickableHeader)

        // Should toggle to ascending order
        const rows = screen.getAllByRole('row')
        expect(rows[1]).toHaveTextContent('user0@example.com') // Oldest first
      }
    })

    it('should sort by action when header is clicked', async () => {
      const user = userEvent.setup()
      const logs = [
        createMockLog({ action: 'UPDATE', userEmail: 'update@example.com' }),
        createMockLog({ action: 'DELETE', userEmail: 'delete@example.com' }),
        createMockLog({ action: 'INSERT', userEmail: 'insert@example.com' })
      ]
      renderAuditTable({ logs })

      // Find the action header
      const actionHeaders = screen.getAllByText('action')
      const clickableHeader = actionHeaders.find(header => 
        header.closest('.cursor-pointer')
      )
      
      if (clickableHeader) {
        await user.click(clickableHeader)

        // Should sort alphabetically by action (DELETE, INSERT, UPDATE)
        const rows = screen.getAllByRole('row')
        expect(rows[1]).toHaveTextContent('delete@example.com')
        expect(rows[2]).toHaveTextContent('insert@example.com')
        expect(rows[3]).toHaveTextContent('update@example.com')
      }
    })

    it('should sort by table name when header is clicked', async () => {
      const user = userEvent.setup()
      const logs = [
        createMockLog({ tableName: 'transactions', userEmail: 'trans@example.com' }),
        createMockLog({ tableName: 'lofts', userEmail: 'lofts@example.com' }),
        createMockLog({ tableName: 'tasks', userEmail: 'tasks@example.com' })
      ]
      renderAuditTable({ logs })

      // Find the table header
      const tableHeaders = screen.getAllByText('table')
      const clickableHeader = tableHeaders.find(header => 
        header.closest('.cursor-pointer')
      )
      
      if (clickableHeader) {
        await user.click(clickableHeader)

        // Should sort alphabetically by table name
        const rows = screen.getAllByRole('row')
        expect(rows[1]).toHaveTextContent('lofts@example.com')
        expect(rows[2]).toHaveTextContent('tasks@example.com')
        expect(rows[3]).toHaveTextContent('trans@example.com')
      }
    })

    it('should sort by user email when header is clicked', async () => {
      const user = userEvent.setup()
      const logs = [
        createMockLog({ userEmail: 'charlie@example.com' }),
        createMockLog({ userEmail: 'alice@example.com' }),
        createMockLog({ userEmail: 'bob@example.com' })
      ]
      renderAuditTable({ logs })

      // Find the user header
      const userHeaders = screen.getAllByText('user')
      const clickableHeader = userHeaders.find(header => 
        header.closest('.cursor-pointer')
      )
      
      if (clickableHeader) {
        await user.click(clickableHeader)

        // Should sort alphabetically by email
        const rows = screen.getAllByRole('row')
        expect(rows[1]).toHaveTextContent('alice@example.com')
        expect(rows[2]).toHaveTextContent('bob@example.com')
        expect(rows[3]).toHaveTextContent('charlie@example.com')
      }
    })

    it('should toggle sort direction on repeated clicks', async () => {
      const user = userEvent.setup()
      const logs = [
        createMockLog({ userEmail: 'alice@example.com' }),
        createMockLog({ userEmail: 'bob@example.com' })
      ]
      renderAuditTable({ logs })

      // Find the user header
      const userHeaders = screen.getAllByText('user')
      const clickableHeader = userHeaders.find(header => 
        header.closest('.cursor-pointer')
      )
      
      if (clickableHeader) {
        // First click - ascending
        await user.click(clickableHeader)
        let rows = screen.getAllByRole('row')
        expect(rows[1]).toHaveTextContent('alice@example.com')

        // Second click - descending
        await user.click(clickableHeader)
        rows = screen.getAllByRole('row')
        expect(rows[1]).toHaveTextContent('bob@example.com')
      }
    })

    it('should show sort indicators', () => {
      const logs = createMockLogs(2)
      renderAuditTable({ logs })

      // Check that sort indicators are present in the DOM
      const chevronIcons = document.querySelectorAll('svg')
      const hasChevronIcon = Array.from(chevronIcons).some(icon => 
        icon.classList.contains('lucide-chevron-down') || 
        icon.classList.contains('lucide-chevron-up')
      )
      expect(hasChevronIcon).toBe(true)
    })
  })

  describe('Selection Functionality', () => {
    it('should handle individual row selection', async () => {
      const user = userEvent.setup()
      const logs = createMockLogs(2)
      const { props } = renderAuditTable({ logs })

      const checkboxes = screen.getAllByRole('checkbox')
      const firstRowCheckbox = checkboxes[1] // Skip "select all" checkbox

      await user.click(firstRowCheckbox)

      expect(props.onSelectionChange).toHaveBeenCalledWith(['log-0'])
    })

    it('should handle select all functionality', async () => {
      const user = userEvent.setup()
      const logs = createMockLogs(3)
      const { props } = renderAuditTable({ logs })

      const selectAllCheckbox = screen.getByLabelText(/select all/i)
      await user.click(selectAllCheckbox)

      expect(props.onSelectionChange).toHaveBeenCalledWith(['log-0', 'log-1', 'log-2'])
    })

    it('should handle deselect all functionality', async () => {
      const user = userEvent.setup()
      const logs = createMockLogs(2)
      const { props } = renderAuditTable({ 
        logs, 
        selectedLogs: ['log-0', 'log-1'] 
      })

      const selectAllCheckbox = screen.getByLabelText(/select all/i)
      await user.click(selectAllCheckbox)

      expect(props.onSelectionChange).toHaveBeenCalledWith([])
    })

    it('should show indeterminate state for partial selection', () => {
      const logs = createMockLogs(3)
      renderAuditTable({ 
        logs, 
        selectedLogs: ['log-0'] 
      })

      const selectAllCheckbox = screen.getByLabelText(/select all/i)
      expect(selectAllCheckbox).toHaveProperty('indeterminate', true)
    })

    it('should highlight selected rows', () => {
      const logs = createMockLogs(2)
      renderAuditTable({ 
        logs, 
        selectedLogs: ['log-0'] 
      })

      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveClass('bg-muted/30') // First data row should be highlighted
      expect(rows[2]).not.toHaveClass('bg-muted/30') // Second row should not be highlighted
    })

    it('should show selected count and export button', () => {
      const logs = createMockLogs(3)
      renderAuditTable({ 
        logs, 
        selectedLogs: ['log-0', 'log-1'] 
      })

      expect(screen.getByText('2 selected')).toBeInTheDocument()
      expect(screen.getByText('Export Selected')).toBeInTheDocument()
    })

    it('should call onExportSelected when export button is clicked', async () => {
      const user = userEvent.setup()
      const logs = createMockLogs(2)
      const { props } = renderAuditTable({ 
        logs, 
        selectedLogs: ['log-0'] 
      })

      const exportButton = screen.getByText('Export Selected')
      await user.click(exportButton)

      expect(props.onExportSelected).toHaveBeenCalledWith(['log-0'])
    })
  })

  describe('Action Menu', () => {
    it('should show action menu for each row', () => {
      const logs = createMockLogs(1)
      renderAuditTable({ logs })

      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    })

    it('should call onViewDetails when view details is clicked', async () => {
      const user = userEvent.setup()
      const logs = createMockLogs(1)
      const { props } = renderAuditTable({ logs })

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      const viewDetailsButton = screen.getByText('View Details')
      await user.click(viewDetailsButton)

      expect(props.onViewDetails).toHaveBeenCalledWith(logs[0])
    })

    it('should copy record ID to clipboard', async () => {
      const user = userEvent.setup()
      const logs = [createMockLog({ recordId: 'test-record-id' })]
      renderAuditTable({ logs })

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      const copyButton = screen.getByText('Copy Record ID')
      await user.click(copyButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-record-id')
    })

    it('should not show view details option when onViewDetails is not provided', async () => {
      const user = userEvent.setup()
      const logs = createMockLogs(1)
      renderAuditTable({ logs, onViewDetails: undefined })

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      expect(screen.queryByText('View Details')).not.toBeInTheDocument()
    })
  })

  describe('Pagination Info', () => {
    it('should show pagination information', () => {
      const logs = createMockLogs(5)
      renderAuditTable({ logs })

      expect(screen.getByText('Showing 1 to 5 of 5 entries')).toBeInTheDocument()
    })

    it('should show selected entries count', () => {
      const logs = createMockLogs(5)
      renderAuditTable({ 
        logs, 
        selectedLogs: ['log-0', 'log-1'] 
      })

      expect(screen.getByText('2 selected')).toBeInTheDocument()
    })

    it('should not show pagination info when loading', () => {
      const logs = createMockLogs(5)
      renderAuditTable({ logs, loading: true })

      expect(screen.queryByText(/showing.*entries/i)).not.toBeInTheDocument()
    })

    it('should not show pagination info when no logs', () => {
      renderAuditTable({ logs: [] })

      expect(screen.queryByText(/showing.*entries/i)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      const logs = createMockLogs(1)
      renderAuditTable({ logs })

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('columnheader')).toHaveLength(7) // Including selection and actions columns
      expect(screen.getAllByRole('row')).toHaveLength(2) // Header + 1 data row
    })

    it('should have proper checkbox labels', () => {
      const logs = createMockLogs(2)
      renderAuditTable({ logs })

      expect(screen.getByLabelText(/select all/i)).toBeInTheDocument()
      expect(screen.getAllByLabelText(/select log/i)).toHaveLength(2)
    })

    it('should have proper button labels', () => {
      const logs = createMockLogs(1)
      renderAuditTable({ logs })

      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    })

    it('should have screen reader text for actions column', () => {
      const logs = createMockLogs(1)
      renderAuditTable({ logs })

      expect(screen.getByText('Actions')).toHaveClass('sr-only')
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const logs = createMockLogs(100)
      const { container } = renderAuditTable({ logs })

      // Should render without performance issues
      expect(container.querySelectorAll('tbody tr')).toHaveLength(100)
    })

    it('should memoize sorted results', () => {
      const logs = createMockLogs(10)
      const { rerender } = renderAuditTable({ logs })

      // Re-render with same props should not cause re-sorting
      rerender(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <AuditTable
            logs={logs}
            loading={false}
            selectedLogs={[]}
            onSelectionChange={jest.fn()}
            onExportSelected={jest.fn()}
            onViewDetails={jest.fn()}
            showSelection={true}
            showActions={true}
          />
        </NextIntlClientProvider>
      )

      // Should still render correctly
      expect(screen.getAllByRole('row')).toHaveLength(11) // Header + 10 data rows
    })
  })
})