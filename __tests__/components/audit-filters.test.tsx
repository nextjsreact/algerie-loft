/**
 * Unit tests for AuditFilters component
 * Tests filter functionality, user interactions, and state management
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditFilters } from '@/components/audit/audit-filters'
import { NextIntlClientProvider } from 'next-intl'
import { AuditFilters as AuditFiltersType } from '@/lib/types'

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

const mockMessages = {
  audit: {
    filters: 'Filters',
    filtersActive: 'Active',
    search: 'Search',
    searchPlaceholder: 'Search in audit logs...',
    searchDescription: 'Search in user emails, record IDs, and change descriptions',
    tableName: 'Table',
    allTables: 'All Tables',
    action: 'Action',
    allActions: 'All Actions',
    user: 'User',
    allUsers: 'All Users',
    recordId: 'Record ID',
    recordIdPlaceholder: 'Enter record ID...',
    dateRange: 'Date Range',
    dateRangeDescription: 'Filter by date range',
    applyFilters: 'Apply Filters',
    resetFilters: 'Reset Filters',
    activeFiltersCount: '{count} active filters',
    'tables.transactions': 'Transactions',
    'tables.tasks': 'Tasks',
    'tables.reservations': 'Reservations',
    'tables.lofts': 'Lofts',
    'actions.created': 'Created',
    'actions.updated': 'Updated',
    'actions.deleted': 'Deleted'
  }
}

const mockUsers = [
  { id: 'user-1', email: 'john@example.com', full_name: 'John Doe' },
  { id: 'user-2', email: 'jane@example.com', full_name: 'Jane Smith' },
  { id: 'user-3', email: 'admin@example.com', full_name: 'Admin User' }
]

const renderAuditFilters = (props: Partial<React.ComponentProps<typeof AuditFilters>> = {}) => {
  const defaultProps = {
    filters: {},
    onFiltersChange: jest.fn(),
    onApplyFilters: jest.fn(),
    onResetFilters: jest.fn(),
    availableUsers: mockUsers,
    loading: false,
    ...props
  }

  return {
    ...render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <AuditFilters {...defaultProps} />
      </NextIntlClientProvider>
    ),
    props: defaultProps
  }
}

describe('AuditFilters Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render all filter components', () => {
      renderAuditFilters()

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

      renderAuditFilters({ filters })

      expect(screen.getByText('(Active)')).toBeInTheDocument()
      expect(screen.getByText('2 active filters')).toBeInTheDocument()
    })

    it('should not show active filters indicator when no filters are applied', () => {
      renderAuditFilters({ filters: {} })

      expect(screen.queryByText('(Active)')).not.toBeInTheDocument()
      expect(screen.queryByText(/active filters/)).not.toBeInTheDocument()
    })

    it('should disable reset button when no filters are active', () => {
      renderAuditFilters({ filters: {} })

      const resetButton = screen.getByText('Reset Filters')
      expect(resetButton).toBeDisabled()
    })

    it('should enable reset button when filters are active', () => {
      const filters: AuditFiltersType = { search: 'test' }
      renderAuditFilters({ filters })

      const resetButton = screen.getByText('Reset Filters')
      expect(resetButton).not.toBeDisabled()
    })
  })

  describe('Search Functionality', () => {
    it('should update search filter on input change', async () => {
      const user = userEvent.setup()
      renderAuditFilters()

      const searchInput = screen.getByLabelText(/search/i)
      await user.type(searchInput, 'test search')

      expect(searchInput).toHaveValue('test search')
    })

    it('should show search placeholder and description', () => {
      renderAuditFilters()

      const searchInput = screen.getByPlaceholderText('Search in audit logs...')
      expect(searchInput).toBeInTheDocument()
      expect(screen.getByText('Search in user emails, record IDs, and change descriptions')).toBeInTheDocument()
    })
  })

  describe('Table Filter', () => {
    it('should show table filter label', () => {
      renderAuditFilters()

      expect(screen.getByText('Table')).toBeInTheDocument()
    })

    it('should have table select component', () => {
      renderAuditFilters()

      // Look for select triggers (combobox role elements)
      const selectElements = screen.getAllByRole('combobox')
      expect(selectElements.length).toBeGreaterThan(0)
    })
  })

  describe('Action Filter', () => {
    it('should show action filter label', () => {
      renderAuditFilters()

      expect(screen.getByText('Action')).toBeInTheDocument()
    })

    it('should have action select component', () => {
      renderAuditFilters()

      const selectElements = screen.getAllByRole('combobox')
      expect(selectElements.length).toBeGreaterThan(0)
    })
  })

  describe('User Filter', () => {
    it('should show user filter label', () => {
      renderAuditFilters()

      expect(screen.getByText('User')).toBeInTheDocument()
    })

    it('should have user select component', () => {
      renderAuditFilters()

      const selectElements = screen.getAllByRole('combobox')
      expect(selectElements.length).toBeGreaterThan(0)
    })
  })

  describe('Record ID Filter', () => {
    it('should update record ID filter on input change', async () => {
      const user = userEvent.setup()
      renderAuditFilters()

      const recordIdInput = screen.getByLabelText(/record id/i)
      await user.type(recordIdInput, 'test-record-id')

      expect(recordIdInput).toHaveValue('test-record-id')
    })

    it('should show record ID placeholder', () => {
      renderAuditFilters()

      const recordIdInput = screen.getByPlaceholderText('Enter record ID...')
      expect(recordIdInput).toBeInTheDocument()
    })
  })

  describe('Date Range Filter', () => {
    it('should render date range picker', () => {
      renderAuditFilters()

      expect(screen.getByTestId('date-range-picker')).toBeInTheDocument()
      expect(screen.getByText('Filter by date range')).toBeInTheDocument()
    })

    it('should update date range filter', async () => {
      const user = userEvent.setup()
      renderAuditFilters()

      const dateFromInput = screen.getByTestId('date-from')
      const dateToInput = screen.getByTestId('date-to')

      await user.type(dateFromInput, '2024-01-01')
      await user.type(dateToInput, '2024-01-31')

      expect(dateFromInput).toHaveValue('2024-01-01')
      expect(dateToInput).toHaveValue('2024-01-31')
    })
  })

  describe('Filter Actions', () => {
    it('should call onApplyFilters when apply button is clicked', async () => {
      const user = userEvent.setup()
      const { props } = renderAuditFilters()

      const applyButton = screen.getByText('Apply Filters')
      await user.click(applyButton)

      expect(props.onApplyFilters).toHaveBeenCalledTimes(1)
    })

    it('should call onResetFilters when reset button is clicked', async () => {
      const user = userEvent.setup()
      const filters: AuditFiltersType = { search: 'test' }
      const { props } = renderAuditFilters({ filters })

      const resetButton = screen.getByText('Reset Filters')
      await user.click(resetButton)

      expect(props.onResetFilters).toHaveBeenCalledTimes(1)
      expect(props.onFiltersChange).toHaveBeenCalledWith({})
    })

    it('should update local filters on input changes', async () => {
      const user = userEvent.setup()
      renderAuditFilters()

      // Set search filter
      const searchInput = screen.getByLabelText(/search/i)
      await user.type(searchInput, 'test')

      expect(searchInput).toHaveValue('test')
    })
  })

  describe('Loading State', () => {
    it('should disable buttons when loading', () => {
      renderAuditFilters({ loading: true })

      const applyButton = screen.getByText('Apply Filters')
      const resetButton = screen.getByText('Reset Filters')

      expect(applyButton).toBeDisabled()
      expect(resetButton).toBeDisabled()
    })

    it('should enable buttons when not loading', () => {
      const filters: AuditFiltersType = { search: 'test' }
      renderAuditFilters({ loading: false, filters })

      const applyButton = screen.getByText('Apply Filters')
      const resetButton = screen.getByText('Reset Filters')

      expect(applyButton).not.toBeDisabled()
      expect(resetButton).not.toBeDisabled()
    })
  })

  describe('Props Synchronization', () => {
    it('should sync local filters with props on mount', () => {
      const initialFilters: AuditFiltersType = {
        search: 'initial search',
        tableName: 'tasks',
        action: 'UPDATE'
      }

      renderAuditFilters({ filters: initialFilters })

      const searchInput = screen.getByLabelText(/search/i)
      expect(searchInput).toHaveValue('initial search')
    })

    it('should update local filters when props change', () => {
      const { rerender } = renderAuditFilters({ filters: {} })

      const newFilters: AuditFiltersType = {
        search: 'updated search'
      }

      rerender(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <AuditFilters
            filters={newFilters}
            onFiltersChange={jest.fn()}
            onApplyFilters={jest.fn()}
            onResetFilters={jest.fn()}
            availableUsers={mockUsers}
            loading={false}
          />
        </NextIntlClientProvider>
      )

      const searchInput = screen.getByLabelText(/search/i)
      expect(searchInput).toHaveValue('updated search')
    })

    it('should sync date range with props', () => {
      const filtersWithDates: AuditFiltersType = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z'
      }

      renderAuditFilters({ filters: filtersWithDates })

      const dateFromInput = screen.getByTestId('date-from')
      const dateToInput = screen.getByTestId('date-to')

      expect(dateFromInput).toHaveValue('2024-01-01')
      expect(dateToInput).toHaveValue('2024-01-31')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for form controls', () => {
      renderAuditFilters()

      expect(screen.getByLabelText(/search/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/record id/i)).toBeInTheDocument()
      
      // Check for select elements by their labels
      expect(screen.getByText('Table')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('User')).toBeInTheDocument()
    })

    it('should have proper button roles and text', () => {
      renderAuditFilters()

      expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument()
    })
  })
})