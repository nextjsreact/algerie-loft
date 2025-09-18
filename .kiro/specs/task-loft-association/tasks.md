# Implementation Plan

- [x] 1. Database Schema Migration



  - Create database migration script to add loft_id column to tasks table
  - Add foreign key constraint with ON DELETE SET NULL behavior
  - Create performance index for loft_id queries




  - _Requirements: 1.2, 5.1, 5.2_



- [ ] 2. Update TypeScript Types and Validation Schemas
  - Extend Task type to include optional loft_id property




  - Create TaskWithLoft interface for queries with loft information
  - Update task validation schemas to accept loft_id parameter
  - _Requirements: 1.1, 1.2_





- [ ] 3. Create Loft Selection API Endpoint
  - Implement GET /api/lofts endpoint for task form loft selector
  - Add proper filtering and search capabilities for loft selection


  - Implement proper error handling and validation





  - _Requirements: 1.1_

- [ ] 4. Update Task Database Queries
  - Modify existing task queries to include loft information via LEFT JOIN





  - Create new query functions for filtering tasks by loft
  - Update task creation and update queries to handle loft_id
  - _Requirements: 1.2, 2.1, 3.1_








- [ ] 5. Extend Task Form Component
  - Add loft selection dropdown to TaskForm component
  - Implement loft search/filter functionality in the selector





  - Add proper validation and error handling for loft selection
  - Ensure only admins and managers can modify loft associations


  - _Requirements: 1.1, 1.4, 4.2_






- [ ] 6. Update Task List Display
  - Modify ModernTasksPage component to display loft information in task cards
  - Add visual indicators for tasks without associated lofts






  - Implement responsive design for loft information display
  - _Requirements: 2.1, 2.2, 4.1_




- [ ] 7. Implement Loft Filtering in Task List
  - Add loft filter dropdown to existing filter section
  - Implement filter logic to show tasks by selected loft



  - Ensure filter works in combination with existing filters
  - Add "All Lofts" option and proper filter clearing
  - _Requirements: 3.1, 3.2, 3.3, 3.4_




- [ ] 8. Update Task API Endpoints
  - Modify POST /api/tasks to accept and validate loft_id
  - Update PUT /api/tasks/:id to handle loft_id changes


  - Extend GET /api/tasks to return loft information with tasks
  - Add proper error handling for invalid loft references
  - _Requirements: 1.2, 1.4_

- [ ] 9. Handle Orphaned Loft References
  - Implement logic to detect and display "Loft supprimé" for deleted lofts
  - Add database constraint to set loft_id to NULL when loft is deleted
  - Create user interface to handle tasks with deleted loft references
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 10. Add Task Details Loft Information
  - Create or update task details view to show complete loft information
  - Add navigation link from task to associated loft details
  - Implement proper display for tasks without loft association
  - _Requirements: 2.4, 4.3_

- [ ] 11. Update Translation Files
  - Add French translations for new loft-related task labels
  - Add English and Arabic translations for loft association features
  - Update existing translation keys for enhanced task display
  - _Requirements: 2.2, 4.3_

- [ ] 12. Create Integration Tests
  - Write tests for task creation with loft association
  - Test task filtering by loft functionality
  - Test loft deletion impact on associated tasks
  - Test permission-based loft association restrictions
  - _Requirements: 1.1, 1.4, 3.1, 5.1_

- [ ] 13. Update Task Statistics and Analytics
  - Modify task statistics to include loft-based grouping
  - Update dashboard components to show tasks per loft metrics
  - Implement proper handling of tasks without loft associations in statistics
  - _Requirements: 2.1, 3.1_

- [ ] 14. Performance Optimization and Testing
  - Test query performance with large datasets of tasks and lofts
  - Implement proper pagination with loft filtering
  - Add database query optimization for task-loft joins
  - Test responsive design on various screen sizes
  - _Requirements: 2.1, 3.1, 3.4_