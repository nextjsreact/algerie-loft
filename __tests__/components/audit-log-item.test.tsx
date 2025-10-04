/**
 * Unit tests for AuditLogItem component
 * Tests rendering of audit log entries, action types, and expandable details
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditLogItem } from '@/components/audit/audit-log-item'
import { NextIntlClientProvider } from 'next-intl'
import { AuditLog } from '@/lib/types'

const mockMessages = {
  audit: {
    actions: {
      created: 'Created',
      updated: 'Updated',
      deleted: 'Deleted'
    },
    tables: {
      transactions: 'Transactions',
      tasks: 'Tasks',
      reservations: 'Reservations',
      lofts: 'Lofts'
    },
    unknownUser: 'Unknown User',
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
  id: 'log-1',
  tableName: 'transactions',
  recordId: 'record-123',
  action: 'UPDATE',
  userId: 'user-1',
  userEmail: 'john@example.com',
  timestamp: '2024-01-15T10:30:00Z',
  oldValues: { amount: 100, description: 'Old description' },
  newValues: { amount: 150, description: 'New description' },
  changedFields: ['amount', 'description'],
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  ...overrides
})

const renderAuditLogItem = (props: Partial<React.ComponentProps<typeof AuditLogItem>> = {}) => {
  const defaultProps = {
    log: createMockLog(),
    showDetails: false,
    ...props
  }

  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      <AuditLogItem {...defaultProps} />
    </NextIntlClientProvider>
  )
}

describe('AuditLogItem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render audit log item with basic information', () => {
      const log = createMockLog()
      renderAuditLogItem({ log })

      expect(screen.getByText('Updated')).toBeInTheDocument()
      expect(screen.getByText('Transactions')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('1/15/2024')).toBeInTheDocument()
      expect(screen.getByText('10:30:00 AM')).toBeInTheDocument()
    })

    it('should show unknown user when userEmail is null', () => {
      const log = createMockLog({ userEmail: '' })
      renderAuditLogItem({ log })

      expect(screen.getByText('Unknown User')).toBeInTheDocument()
    })

    it('should format timestamp correctly', () => {
      const log = createMockLog({ timestamp: '2024-12-25T15:45:30Z' })
      renderAuditLogItem({ log })

      expect(screen.getByText('12/25/2024')).toBeInTheDocument()
      expect(screen.getByText('3:45:30 PM')).toBeInTheDocument()
    })
  })

  describe('Action Types', () => {
    it('should render INSERT action with correct styling', () => {
      const log = createMockLog({ 
        action: 'INSERT',
        oldValues: null,
        newValues: { name: 'New Item', amount: 100 },
        changedFields: []
      })
      renderAuditLogItem({ log })

      const badge = screen.getByText('Created')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.bg-green-50')).toBeTruthy()
    })

    it('should render UPDATE action with correct styling', () => {
      const log = createMockLog({ action: 'UPDATE' })
      renderAuditLogItem({ log })

      const badge = screen.getByText('Updated')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.bg-blue-50')).toBeTruthy()
    })

    it('should render DELETE action with correct styling', () => {
      const log = createMockLog({ 
        action: 'DELETE',
        oldValues: { name: 'Deleted Item', amount: 100 },
        newValues: null,
        changedFields: []
      })
      renderAuditLogItem({ log })

      const badge = screen.getByText('Deleted')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('.bg-red-50')).toBeTruthy()
    })

    it('should handle unknown action types', () => {
      const log = createMockLog({ action: 'UNKNOWN' as any })
      renderAuditLogItem({ log })

      expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
    })
  })

  describe('Table Name Display', () => {
    it('should display correct table names', () => {
      const tables = [
        { tableName: 'transactions', expected: 'Transactions' },
        { tableName: 'tasks', expected: 'Tasks' },
        { tableName: 'reservations', expected: 'Reservations' },
        { tableName: 'lofts', expected: 'Lofts' }
      ]

      tables.forEach(({ tableName, expected }) => {
        const { unmount } = renderAuditLogItem({ 
          log: createMockLog({ tableName }) 
        })
        expect(screen.getByText(expected)).toBeInTheDocument()
        unmount()
      })
    })

    it('should display unknown table name as-is', () => {
      const log = createMockLog({ tableName: 'unknown_table' })
      renderAuditLogItem({ log })

      expect(screen.getByText('unknown_table')).toBeInTheDocument()
    })
  })

  describe('Expandable Details', () => {
    it('should show expand button when there are details to show', () => {
      const log = createMockLog()
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      expect(expandButton).toBeInTheDocument()
    })

    it('should not show expand button when there are no details', () => {
      const log = createMockLog({ 
        oldValues: null, 
        newValues: null, 
        changedFields: [] 
      })
      renderAuditLogItem({ log })

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should expand details when button is clicked', async () => {
      const user = userEvent.setup()
      const log = createMockLog()
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('Changed Fields')).toBeInTheDocument()
    })

    it('should show details by default when showDetails is true', () => {
      const log = createMockLog()
      renderAuditLogItem({ log, showDetails: true })

      expect(screen.getByText('Changed Fields')).toBeInTheDocument()
    })

    it('should toggle expansion state', async () => {
      const user = userEvent.setup()
      const log = createMockLog()
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      
      // Expand
      await user.click(expandButton)
      expect(screen.getByText('Changed Fields')).toBeInTheDocument()

      // Collapse
      await user.click(expandButton)
      expect(screen.queryByText('Changed Fields')).not.toBeInTheDocument()
    })
  })

  describe('UPDATE Action Details', () => {
    it('should display changed fields for UPDATE action', async () => {
      const user = userEvent.setup()
      const log = createMockLog({
        action: 'UPDATE',
        changedFields: ['amount', 'description'],
        oldValues: { amount: 100, description: 'Old desc' },
        newValues: { amount: 150, description: 'New desc' }
      })
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('Changed Fields')).toBeInTheDocument()
      expect(screen.getByText('amount')).toBeInTheDocument()
      expect(screen.getByText('description')).toBeInTheDocument()
    })

    it('should display old and new values correctly', async () => {
      const user = userEvent.setup()
      const log = createMockLog({
        action: 'UPDATE',
        changedFields: ['amount'],
        oldValues: { amount: 100 },
        newValues: { amount: 150 }
      })
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('Old Value')).toBeInTheDocument()
      expect(screen.getByText('New Value')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('should handle null/undefined values', async () => {
      const user = userEvent.setup()
      const log = createMockLog({
        action: 'UPDATE',
        changedFields: ['description'],
        oldValues: { description: null },
        newValues: { description: 'New value' }
      })
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('Empty')).toBeInTheDocument()
      expect(screen.getByText('New value')).toBeInTheDocument()
    })

    it('should not show changed fields section when no fields changed', async () => {
      const user = userEvent.setup()
      const log = createMockLog({
        action: 'UPDATE',
        changedFields: [],
        oldValues: { amount: 100 },
        newValues: { amount: 100 }
      })
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.queryByText('Changed Fields')).not.toBeInTheDocument()
    })
  })

  describe('INSERT Action Details', () => {
    it('should display created data for INSERT action', async () => {
      const user = userEvent.setup()
      const log = createMockLog({
        action: 'INSERT',
        oldValues: null,
        newValues: { name: 'New Item', amount: 100 },
        changedFields: []
      })
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('Created Data')).toBeInTheDocument()
      expect(screen.getByText(/"name": "New Item"/)).toBeInTheDocument()
      expect(screen.getByText(/"amount": 100/)).toBeInTheDocument()
    })

    it('should format JSON data properly', async () => {
      const user = userEvent.setup()
      const log = createMockLog({
        action: 'INSERT',
        oldValues: null,
        newValues: { 
          id: 'test-id',
          nested: { key: 'value' },
          array: [1, 2, 3]
        },
        changedFields: []
      })
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      const jsonElement = screen.getByText(/"id": "test-id"/)
      expect(jsonElement).toBeInTheDocument()
      expect(jsonElement.tagName).toBe('PRE')
    })
  })

  describe('DELETE Action Details', () => {
    it('should display deleted data for DELETE action', async () => {
      const user = userEvent.setup()
      const log = createMockLog({
        action: 'DELETE',
        oldValues: { name: 'Deleted Item', amount: 100 },
        newValues: null,
        changedFields: []
      })
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('Deleted Data')).toBeInTheDocument()
      expect(screen.getByText(/"name": "Deleted Item"/)).toBeInTheDocument()
      expect(screen.getByText(/"amount": 100/)).toBeInTheDocument()
    })
  })

  describe('Metadata Display', () => {
    it('should display IP address and user agent when available', async () => {
      const user = userEvent.setup()
      const log = createMockLog({
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Test Browser'
      })
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('Metadata')).toBeInTheDocument()
      expect(screen.getByText('IP Address:')).toBeInTheDocument()
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument()
      expect(screen.getByText('User Agent:')).toBeInTheDocument()
      expect(screen.getByText('Mozilla/5.0 Test Browser')).toBeInTheDocument()
    })

    it('should not display metadata section when no metadata available', async () => {
      const user = userEvent.setup()
      const log = createMockLog({
        ipAddress: undefined,
        userAgent: undefined
      })
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.queryByText('Metadata')).not.toBeInTheDocument()
    })

    it('should display only available metadata fields', async () => {
      const user = userEvent.setup()
      const log = createMockLog({
        ipAddress: '192.168.1.100',
        userAgent: undefined
      })
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('Metadata')).toBeInTheDocument()
      expect(screen.getByText('IP Address:')).toBeInTheDocument()
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument()
      expect(screen.queryByText('User Agent:')).not.toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('should apply custom className', () => {
      const log = createMockLog()
      const { container } = renderAuditLogItem({ 
        log, 
        className: 'custom-class' 
      })

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should have hover effects', () => {
      const log = createMockLog()
      const { container } = renderAuditLogItem({ log })

      expect(container.firstChild).toHaveClass('hover:shadow-md')
    })

    it('should use appropriate colors for different actions', () => {
      const actions = [
        { action: 'INSERT', expectedClass: 'bg-green-50' },
        { action: 'UPDATE', expectedClass: 'bg-blue-50' },
        { action: 'DELETE', expectedClass: 'bg-red-50' }
      ]

      actions.forEach(({ action, expectedClass }) => {
        const { unmount } = renderAuditLogItem({ 
          log: createMockLog({ action: action as any }) 
        })
        
        const iconContainer = document.querySelector(`.${expectedClass}`)
        expect(iconContainer).toBeInTheDocument()
        
        unmount()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper button accessibility', () => {
      const log = createMockLog()
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      expect(expandButton).toBeInTheDocument()
      expect(expandButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should update aria-expanded when expanded', async () => {
      const user = userEvent.setup()
      const log = createMockLog()
      renderAuditLogItem({ log })

      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(expandButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('should have proper semantic structure', () => {
      const log = createMockLog()
      renderAuditLogItem({ log })

      // Should have proper heading structure and content organization
      expect(screen.getByText('Updated')).toBeInTheDocument()
      expect(screen.getByText('Transactions')).toBeInTheDocument()
    })
  })
})