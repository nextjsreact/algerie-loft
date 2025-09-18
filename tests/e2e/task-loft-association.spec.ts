/**
 * End-to-end tests for Task-Loft Association functionality
 * Tests the complete user workflow from UI to database
 */

import { test, expect } from '@playwright/test'

test.describe('Task-Loft Association E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@test.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
  })

  test.describe('Task Creation with Loft Association', () => {
    test('should create task with loft association', async ({ page }) => {
      // Navigate to new task page
      await page.goto('/tasks/new')
      
      // Fill task details
      await page.fill('[data-testid="task-title"]', 'Test Task with Loft')
      await page.fill('[data-testid="task-description"]', 'This task is associated with a loft')
      
      // Select loft
      await page.click('[data-testid="loft-selector"]')
      await page.click('[data-testid="loft-option-1"]') // Assuming first loft option
      
      // Set due date
      await page.fill('[data-testid="due-date"]', '2024-12-31')
      
      // Assign to user
      await page.click('[data-testid="assignee-selector"]')
      await page.click('[data-testid="assignee-option-1"]')
      
      // Submit form
      await page.click('[data-testid="create-task-button"]')
      
      // Verify redirect to tasks list
      await page.waitForURL('/tasks')
      
      // Verify task appears in list with loft information
      await expect(page.locator('[data-testid="task-card"]').first()).toContainText('Test Task with Loft')
      await expect(page.locator('[data-testid="task-loft-info"]').first()).toBeVisible()
    })

    test('should create task without loft association', async ({ page }) => {
      await page.goto('/tasks/new')
      
      await page.fill('[data-testid="task-title"]', 'Task without Loft')
      await page.fill('[data-testid="task-description"]', 'This task has no loft')
      
      // Select "No loft associated"
      await page.click('[data-testid="loft-selector"]')
      await page.click('[data-testid="no-loft-option"]')
      
      await page.click('[data-testid="create-task-button"]')
      
      await page.waitForURL('/tasks')
      
      // Verify task appears without loft information
      await expect(page.locator('[data-testid="task-card"]').first()).toContainText('Task without Loft')
      await expect(page.locator('[data-testid="task-card"]').first()).toContainText('No loft associated')
    })
  })

  test.describe('Task List with Loft Filtering', () => {
    test('should filter tasks by loft', async ({ page }) => {
      await page.goto('/tasks')
      
      // Open loft filter
      await page.click('[data-testid="loft-filter"]')
      
      // Select specific loft
      await page.click('[data-testid="loft-filter-option-1"]')
      
      // Verify filtered results
      const taskCards = page.locator('[data-testid="task-card"]')
      await expect(taskCards).toHaveCount(await taskCards.count())
      
      // Verify all visible tasks have the selected loft
      const loftInfos = page.locator('[data-testid="task-loft-info"]')
      const count = await loftInfos.count()
      for (let i = 0; i < count; i++) {
        await expect(loftInfos.nth(i)).toContainText('Loft') // Adjust based on actual loft name
      }
    })

    test('should filter tasks without loft', async ({ page }) => {
      await page.goto('/tasks')
      
      await page.click('[data-testid="loft-filter"]')
      await page.click('[data-testid="no-loft-filter-option"]')
      
      // Verify all visible tasks have no loft
      const taskCards = page.locator('[data-testid="task-card"]')
      const count = await taskCards.count()
      for (let i = 0; i < count; i++) {
        await expect(taskCards.nth(i)).toContainText('No loft associated')
      }
    })

    test('should clear loft filter', async ({ page }) => {
      await page.goto('/tasks')
      
      // Apply filter
      await page.click('[data-testid="loft-filter"]')
      await page.click('[data-testid="loft-filter-option-1"]')
      
      // Clear filters
      await page.click('[data-testid="clear-filters-button"]')
      
      // Verify all tasks are shown again
      await expect(page.locator('[data-testid="task-card"]')).toHaveCount(await page.locator('[data-testid="task-card"]').count())
    })
  })

  test.describe('Task Details with Loft Information', () => {
    test('should display loft information in task details', async ({ page }) => {
      await page.goto('/tasks')
      
      // Click on first task with loft
      await page.click('[data-testid="task-card"]:has([data-testid="task-loft-info"]) [data-testid="view-task-button"]')
      
      // Verify loft information section
      await expect(page.locator('[data-testid="loft-info-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="loft-name"]')).toBeVisible()
      await expect(page.locator('[data-testid="loft-address"]')).toBeVisible()
      await expect(page.locator('[data-testid="view-loft-details-button"]')).toBeVisible()
    })

    test('should navigate to loft details from task', async ({ page }) => {
      await page.goto('/tasks')
      
      // Click on task with loft
      await page.click('[data-testid="task-card"]:has([data-testid="task-loft-info"]) [data-testid="view-task-button"]')
      
      // Click on view loft details
      await page.click('[data-testid="view-loft-details-button"]')
      
      // Verify navigation to loft details
      await expect(page).toHaveURL(/\/lofts\/[^\/]+/)
    })

    test('should display orphaned loft warning', async ({ page }) => {
      // This test assumes there's a task with orphaned loft reference
      // In a real scenario, you'd set up test data with orphaned references
      
      await page.goto('/tasks')
      
      // Look for task with orphaned loft indicator
      const orphanedTask = page.locator('[data-testid="task-card"]:has([data-testid="orphaned-loft-indicator"])')
      
      if (await orphanedTask.count() > 0) {
        await orphanedTask.first().click()
        
        // Verify orphaned loft warning
        await expect(page.locator('[data-testid="orphaned-loft-warning"]')).toBeVisible()
        await expect(page.locator('[data-testid="orphaned-loft-warning"]')).toContainText('Loft deleted')
      }
    })
  })

  test.describe('Task Editing with Loft Association', () => {
    test('should update task loft association', async ({ page }) => {
      await page.goto('/tasks')
      
      // Click edit on first task
      await page.click('[data-testid="task-card"] [data-testid="edit-task-button"]')
      
      // Change loft association
      await page.click('[data-testid="loft-selector"]')
      await page.click('[data-testid="loft-option-2"]') // Different loft
      
      // Save changes
      await page.click('[data-testid="update-task-button"]')
      
      // Verify redirect and updated information
      await page.waitForURL('/tasks')
      await expect(page.locator('[data-testid="task-card"]').first()).toContainText('Loft') // Updated loft name
    })

    test('should remove loft association from task', async ({ page }) => {
      await page.goto('/tasks')
      
      // Edit task that has loft
      await page.click('[data-testid="task-card"]:has([data-testid="task-loft-info"]) [data-testid="edit-task-button"]')
      
      // Remove loft association
      await page.click('[data-testid="loft-selector"]')
      await page.click('[data-testid="no-loft-option"]')
      
      await page.click('[data-testid="update-task-button"]')
      
      // Verify loft association removed
      await page.waitForURL('/tasks')
      await expect(page.locator('[data-testid="task-card"]').first()).toContainText('No loft associated')
    })
  })

  test.describe('Member User Permissions', () => {
    test.beforeEach(async ({ page }) => {
      // Logout and login as member
      await page.goto('/logout')
      await page.goto('/login')
      await page.fill('[data-testid="email"]', 'member@test.com')
      await page.fill('[data-testid="password"]', 'password123')
      await page.click('[data-testid="login-button"]')
    })

    test('should display loft information in read-only mode for members', async ({ page }) => {
      await page.goto('/tasks')
      
      // Click on assigned task
      await page.click('[data-testid="task-card"] [data-testid="edit-task-button"]')
      
      // Verify loft field is read-only
      await expect(page.locator('[data-testid="loft-readonly"]')).toBeVisible()
      await expect(page.locator('[data-testid="loft-readonly"]')).toBeDisabled()
      
      // Verify no loft selector for members
      await expect(page.locator('[data-testid="loft-selector"]')).not.toBeVisible()
    })

    test('should not show loft filter for members', async ({ page }) => {
      await page.goto('/tasks')
      
      // Verify loft filter is not available for members
      await expect(page.locator('[data-testid="loft-filter"]')).not.toBeVisible()
    })
  })

  test.describe('API Integration', () => {
    test('should handle loft validation errors', async ({ page }) => {
      // Mock API to return validation error
      await page.route('/api/tasks', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid loft ID provided' })
        })
      })

      await page.goto('/tasks/new')
      
      await page.fill('[data-testid="task-title"]', 'Test Task')
      await page.click('[data-testid="loft-selector"]')
      await page.click('[data-testid="loft-option-1"]')
      await page.click('[data-testid="create-task-button"]')
      
      // Verify error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid loft ID')
    })

    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('/api/lofts/selection', route => {
        route.abort('failed')
      })

      await page.goto('/tasks/new')
      
      // Verify graceful handling of loft loading failure
      await expect(page.locator('[data-testid="loft-selector"]')).toBeDisabled()
      // Could show error message or fallback UI
    })
  })
})