/**
 * Integration tests for TaskForm component with loft association
 * Tests the UI components and user interactions for loft selection
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskForm } from '@/components/forms/task-form'
import { NextIntlClientProvider } from 'next-intl'

// Mock the loft service
jest.mock('@/lib/services/loft', () => ({
  fetchLoftsForSelection: jest.fn(() => Promise.resolve({
    lofts: [
      { id: 'loft-1', name: 'Loft A', address: '123 Main St' },
      { id: 'loft-2', name: 'Loft B', address: '456 Oak Ave' }
    ],
    total: 2
  })),
  formatLoftDisplayName: jest.fn((loft) => `${loft.name} - ${loft.address}`)
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(() => Promise.resolve({
    user: { id: 'test-user', role: 'admin' }
  }))
}))

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

const mockMessages = {
  tasks: {
    taskTitle: 'Task Title',
    taskDescription: 'Task Description',
    taskStatus: 'Task Status',
    taskDueDate: 'Due Date',
    assignTo: 'Assign To',
    associatedLoft: 'Associated Loft',
    noLoftAssociated: 'No loft associated',
    loadingLofts: 'Loading lofts...',
    createTask: 'Create Task',
    cancel: 'Cancel',
    fillTaskInformation: 'Fill task information',
    'status.todo': 'To Do',
    'status.inProgress': 'In Progress',
    'status.completed': 'Completed'
  },
  common: {
    selectOption: 'Select an option',
    none: 'None'
  }
}

const renderTaskForm = (props = {}) => {
  const defaultProps = {
    users: [
      { id: 'user-1', full_name: 'John Doe', email: 'john@example.com', role: 'member' },
      { id: 'user-2', full_name: 'Jane Smith', email: 'jane@example.com', role: 'member' }
    ],
    onSubmit: jest.fn(),
    isSubmitting: false,
    ...props
  }

  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      <TaskForm {...defaultProps} />
    </NextIntlClientProvider>
  )
}

describe('TaskForm Loft Association Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loft Selection for Admins/Managers', () => {
    it('should display loft selector for admin users', async () => {
      renderTaskForm()

      await waitFor(() => {
        expect(screen.getByText('Associated Loft')).toBeInTheDocument()
      })

      const loftSelect = screen.getByRole('combobox', { name: /associated loft/i })
      expect(loftSelect).toBeInTheDocument()
    })

    it('should load and display loft options', async () => {
      renderTaskForm()

      await waitFor(() => {
        const loftSelect = screen.getByRole('combobox', { name: /associated loft/i })
        fireEvent.click(loftSelect)
      })

      await waitFor(() => {
        expect(screen.getByText('Loft A - 123 Main St')).toBeInTheDocument()
        expect(screen.getByText('Loft B - 456 Oak Ave')).toBeInTheDocument()
        expect(screen.getByText('No loft associated')).toBeInTheDocument()
      })
    })

    it('should allow selecting a loft', async () => {
      const mockOnSubmit = jest.fn()
      renderTaskForm({ onSubmit: mockOnSubmit })

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/task title/i), {
        target: { value: 'Test Task' }
      })

      // Select loft
      await waitFor(() => {
        const loftSelect = screen.getByRole('combobox', { name: /associated loft/i })
        fireEvent.click(loftSelect)
      })

      await waitFor(() => {
        fireEvent.click(screen.getByText('Loft A - 123 Main St'))
      })

      // Submit form
      fireEvent.click(screen.getByText('Create Task'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Task',
            loft_id: 'loft-1'
          })
        )
      })
    })

    it('should allow selecting no loft', async () => {
      const mockOnSubmit = jest.fn()
      renderTaskForm({ onSubmit: mockOnSubmit })

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/task title/i), {
        target: { value: 'Test Task' }
      })

      // Select no loft
      await waitFor(() => {
        const loftSelect = screen.getByRole('combobox', { name: /associated loft/i })
        fireEvent.click(loftSelect)
      })

      await waitFor(() => {
        fireEvent.click(screen.getByText('No loft associated'))
      })

      // Submit form
      fireEvent.click(screen.getByText('Create Task'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Task',
            loft_id: null
          })
        )
      })
    })
  })

  describe('Loft Display for Members', () => {
    beforeEach(() => {
      // Mock member session
      jest.mocked(require('@/lib/auth').getSession).mockResolvedValue({
        user: { id: 'test-user', role: 'member' }
      })
    })

    it('should display loft information in read-only mode for members', async () => {
      const taskWithLoft = {
        id: 'task-1',
        title: 'Existing Task',
        description: 'Task description',
        status: 'todo',
        loft: {
          id: 'loft-1',
          name: 'Loft A',
          address: '123 Main St'
        }
      }

      renderTaskForm({ task: taskWithLoft })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Loft A - 123 Main St')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Loft A - 123 Main St')).toBeDisabled()
      })
    })

    it('should display no loft message for tasks without loft', async () => {
      const taskWithoutLoft = {
        id: 'task-1',
        title: 'Existing Task',
        description: 'Task description',
        status: 'todo',
        loft: null
      }

      renderTaskForm({ task: taskWithoutLoft })

      await waitFor(() => {
        expect(screen.getByDisplayValue('No loft associated')).toBeInTheDocument()
      })
    })

    it('should display orphaned loft information', async () => {
      const taskWithOrphanedLoft = {
        id: 'task-1',
        title: 'Existing Task',
        description: 'Task description',
        status: 'todo',
        loft: null,
        isOrphaned: true,
        orphanedLoftId: 'deleted-loft-id'
      }

      // Mock formatLoftDisplayName to handle orphaned case
      jest.mocked(require('@/lib/services/loft').formatLoftDisplayName).mockReturnValue('Loft not found')

      renderTaskForm({ task: taskWithOrphanedLoft })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Loft not found')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields with loft selection', async () => {
      const mockOnSubmit = jest.fn()
      renderTaskForm({ onSubmit: mockOnSubmit })

      // Try to submit without required fields
      fireEvent.click(screen.getByText('Create Task'))

      await waitFor(() => {
        // Should not call onSubmit due to validation errors
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/task title/i), {
        target: { value: 'Test Task' }
      })

      // Select loft
      await waitFor(() => {
        const loftSelect = screen.getByRole('combobox', { name: /associated loft/i })
        fireEvent.click(loftSelect)
      })

      await waitFor(() => {
        fireEvent.click(screen.getByText('Loft A - 123 Main St'))
      })

      // Submit form
      fireEvent.click(screen.getByText('Create Task'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state while fetching lofts', async () => {
      // Mock delayed loft loading
      jest.mocked(require('@/lib/services/loft').fetchLoftsForSelection).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ lofts: [], total: 0 }), 100))
      )

      renderTaskForm()

      await waitFor(() => {
        expect(screen.getByText('Loading lofts...')).toBeInTheDocument()
      })
    })

    it('should disable loft selector during loading', async () => {
      // Mock delayed loft loading
      jest.mocked(require('@/lib/services/loft').fetchLoftsForSelection).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ lofts: [], total: 0 }), 100))
      )

      renderTaskForm()

      await waitFor(() => {
        const loftSelect = screen.getByRole('combobox', { name: /associated loft/i })
        expect(loftSelect).toBeDisabled()
      })
    })
  })
})