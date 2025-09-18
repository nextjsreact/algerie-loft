# Implementation Plan

- [x] 1. Create core permission system infrastructure

  - Implement centralized permission configuration with role-based access matrix
  - Create TypeScript interfaces for permissions, roles, and access control
  - Write unit tests for permission validation logic
  - _Requirements: 6.1, 6.2_

- [x] 1.1 Implement permission configuration and types

  - Create `lib/permissions/types.ts` with Permission, RolePermissions interfaces
  - Define ROLE_PERMISSIONS constant with complete access matrix
  - Implement permission validation utility functions
  - _Requirements: 6.1, 6.2_

- [x] 1.2 Create usePermissions hook

  - Implement `hooks/use-permissions.ts` with hasPermission, canAccess, filterData methods
  - Add role-based logic for checking resource access and action permissions
  - Write comprehensive unit tests for all permission scenarios
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Implement RoleBasedAccess component

  - Create reusable access control wrapper component
  - Add fallback rendering for unauthorized access
  - Integrate with permission system for dynamic access control
  - _Requirements: 6.1, 6.4_

- [x] 2.1 Create RoleBasedAccess wrapper component

  - Implement `components/auth/role-based-access.tsx` with allowedRoles prop validation
  - Add conditional rendering based on user role permissions
  - Create fallback UI components for access denied scenarios
  - _Requirements: 6.1, 6.4_

- [x] 2.2 Create error handling components

  - Implement `components/auth/unauthorized-access.tsx` for access denied scenarios
  - Create `components/auth/insufficient-permissions.tsx` for permission errors
  - Add proper error messaging and redirect functionality
  - _Requirements: 6.4_

- [x] 3. Implement data filtering service

  - Create service to filter sensitive data based on user roles
  - Implement filtering for tasks, notifications, lofts, and financial data
  - Add security measures to prevent data leakage
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4_

- [x] 3.1 Create data filtering utilities

  - Implement `lib/services/data-filter.ts` with role-based filtering functions
  - Add filterTasks, filterNotifications, filterLofts, filterFinancialData methods
  - Create filtered data type definitions for member role
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4_

- [x] 3.2 Implement member-specific data types

  - Create `lib/types/member-views.ts` with MemberLoftView, MemberTaskView interfaces
  - Define MemberDashboardData type with filtered data structure
  - Add type guards for data validation and security
  - _Requirements: 1.1, 3.3, 3.4_

- [x] 4. Refactor dashboard components for role-based access

  - Create SmartDashboard component that routes to appropriate dashboard
  - Enhance existing MemberDashboard with improved filtering
  - Implement role-specific dashboard variants
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4_

- [x] 4.1 Create SmartDashboard router component

  - Implement `components/dashboard/smart-dashboard.tsx` with role-based routing
  - Add automatic dashboard selection based on user role
  - Integrate with data filtering service for secure data passing
  - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4_

- [x] 4.2 Enhance MemberDashboard with security filtering

  - Update existing `components/dashboard/member-dashboard.tsx` with data filtering
  - Remove access to financial data and administrative sections
  - Add loft-specific task filtering for assigned lofts only
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4_

- [x] 4.3 Update DashboardWrapper with role-based access control

  - Modify `components/dashboard/dashboard-wrapper.tsx` to use SmartDashboard
  - Add RoleBasedAccess wrapper for financial components
  - Implement proper error handling for unauthorized access
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3, 4.4_

- [x] 5. Implement notification filtering system

  - Filter notifications based on user role and relevance
  - Ensure members only see task-related notifications
  - Add notification type validation for role-based access
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 5.1 Create notification filtering logic

  - Implement notification filtering in data filter service
  - Add role-based notification type restrictions for members
  - Create notification relevance checking for task assignments
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 5.2 Update notification components with filtering

  - Modify notification display components to use filtered data
  - Add role-based notification rendering logic
  - Implement proper fallback for empty notification lists
  - _Requirements: 5.1, 5.2_

- [x] 6. Secure task management with role-based permissions

  - Implement task filtering to show only assigned tasks for members
  - Add task status modification permissions for members
  - Create task assignment validation and notification system
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6.1 Update task filtering and display logic

  - Modify task queries to filter by user assignment for member role
  - Update task display components with role-based access controls
  - Add task status modification validation for member permissions
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 6.2 Implement task status update notifications

  - Add notification system for task status changes by members
  - Create supervisor notification logic for task updates
  - Implement task assignment notification system for new assignments
  - _Requirements: 2.4, 5.3, 5.4_

- [x] 7. Implement loft access control for members

  - Filter loft data to show only operationally relevant information
  - Remove financial data from loft views for member role
  - Show only lofts where member has assigned tasks
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7.1 Create member loft filtering system

  - Implement loft data filtering to remove financial information
  - Add logic to show only lofts with assigned tasks for members
  - Create MemberLoftView with limited data exposure
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7.2 Update loft display components for members

  - Modify loft listing and detail components with role-based data filtering
  - Add conditional rendering for financial sections based on user role
  - Implement proper fallback UI for restricted loft information
  - _Requirements: 3.3, 3.4_

- [x] 8. Add comprehensive testing for role-based access

  - Create unit tests for all permission scenarios and edge cases
  - Implement integration tests for dashboard role routing
  - Add security tests to prevent data leakage between roles
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8.1 Write permission system unit tests

  - Create test suite for usePermissions hook with all role combinations
  - Test permission validation logic for each resource and action
  - Add edge case testing for invalid roles and permissions
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 8.2 Create component access integration tests

  - Test RoleBasedAccess component with different role scenarios
  - Verify proper fallback rendering for unauthorized access
  - Test dashboard routing logic for each user role
  - _Requirements: 6.1, 6.4_

- [x] 8.3 Implement data filtering security tests

  - Test data filtering functions to ensure no sensitive data leakage
  - Verify member role cannot access financial or administrative data
  - Add tests for proper task and loft filtering by assignment
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4_

- [x] 9. Update existing pages with role-based access controls

  - Apply RoleBasedAccess wrapper to sensitive page sections
  - Update navigation and UI elements based on user permissions
  - Ensure consistent role-based experience across the application
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.4_

- [x] 9.1 Secure financial and administrative pages

  - Add RoleBasedAccess wrapper to transaction, report, and settings pages
  - Update navigation menu to hide restricted sections for members
  - Implement proper redirect logic for unauthorized page access
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.4_

- [x] 9.2 Update task and loft pages with member restrictions

  - Apply task filtering to task listing and detail pages for members
  - Add loft access restrictions for members on loft pages
  - Ensure consistent permission checking across all task operations
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_
