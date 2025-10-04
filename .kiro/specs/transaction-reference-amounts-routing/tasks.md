# Implementation Plan

- [x] 1. Create UUID validation utilities

  - Create `lib/utils/validation.ts` with UUID validation functions
  - Implement `isValidUUID(id: string): boolean` function using regex pattern
  - Implement `validateTransactionId(id: string)` function with detailed error responses
  - _Requirements: 2.3, 4.3_

- [x] 2. Create reference amounts static route page

  - Create `app/[locale]/transactions/reference-amounts/page.tsx` file
  - Implement server-side authentication check using `requireRole(["admin", "manager"])`
  - Import and render existing `TransactionReferenceAmounts` component

  - Add proper page metadata and internationalization setup
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 3. Enhance transaction detail page with UUID validation

  - Modify `app/[locale]/transactions/[id]/page.tsx` to validate UUID before database query
  - Add UUID validation using the validation utility before calling `getTransaction(id)`
  - Implement proper error handling for invalid UUID format (return 404)
  - Add user-friendly error messages for invalid transaction IDs
  - _Requirements: 1.3, 2.3, 4.1, 4.2_

- [x] 4. Update navigation links and components

  - Update transaction list page navigation to use correct `/transactions/reference-amounts` route
  - Verify existing navigation links in `components/transactions/modern-transactions-page.tsx`
  - Verify existing navigation links in `components/transactions/simple-transactions-page.tsx`
  - Add breadcrumb navigation to reference amounts page
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Add comprehensive error logging

  - Implement error logging in UUID validation functions
  - Add logging for routing resolution issues
  - Create error tracking for 404 scenarios
  - _Requirements: 4.4_

- [x] 6. Create unit tests for validation utilities

  - Write tests for `isValidUUID` function with valid and invalid UUID formats
  - Write tests for `validateTransactionId` function edge cases
  - Test error handling scenarios
  - _Requirements: 2.3, 4.1_

- [x] 7. Add integration tests for routing


  - Test static route resolution priority for `/transactions/reference-amounts`
  - Test dynamic route behavior with valid and invalid UUIDs
  - Test authentication flow on reference amounts page
  - _Requirements: 2.1, 2.2, 1.1_
