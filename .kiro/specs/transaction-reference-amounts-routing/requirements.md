# Requirements Document

## Introduction

The system currently has a routing conflict where the transaction reference amounts management page (`/transactions/reference-amounts`) is being interpreted as a transaction detail page with ID "reference-amounts". This causes UUID validation errors since the system expects valid UUIDs for transaction IDs. We need to implement proper routing to handle the reference amounts management feature while maintaining the existing transaction detail functionality.

## Requirements

### Requirement 1

**User Story:** As an administrator or manager, I want to access the transaction reference amounts management page without encountering routing conflicts, so that I can configure reference amounts for expense and revenue categories.

#### Acceptance Criteria

1. WHEN a user navigates to `/transactions/reference-amounts` THEN the system SHALL display the reference amounts management interface
2. WHEN a user navigates to `/transactions/reference-amounts` THEN the system SHALL NOT attempt to parse "reference-amounts" as a transaction UUID
3. WHEN a user navigates to `/transactions/[valid-uuid]` THEN the system SHALL continue to display the transaction detail page as before
4. WHEN the reference amounts page loads THEN the system SHALL display tabs for "Expenses" and "Revenues"
5. WHEN the reference amounts page loads THEN the system SHALL allow editing of existing reference amounts

### Requirement 2

**User Story:** As a developer, I want the routing system to properly distinguish between static routes and dynamic routes, so that there are no conflicts between feature pages and parameterized pages.

#### Acceptance Criteria

1. WHEN the routing system processes `/transactions/reference-amounts` THEN it SHALL match the static route before attempting dynamic route matching
2. WHEN the routing system processes `/transactions/[uuid]` THEN it SHALL validate the UUID format before proceeding
3. WHEN an invalid UUID is provided to the transaction detail route THEN the system SHALL return a 404 error instead of a UUID validation error
4. WHEN the system encounters routing conflicts THEN it SHALL prioritize static routes over dynamic routes

### Requirement 3

**User Story:** As a user, I want clear navigation between the transactions list and reference amounts management, so that I can easily access both features without confusion.

#### Acceptance Criteria

1. WHEN a user is on the transactions page THEN they SHALL see a clearly labeled button to access reference amounts
2. WHEN a user clicks the reference amounts button THEN they SHALL be navigated to the correct reference amounts page
3. WHEN a user is on the reference amounts page THEN they SHALL have a way to navigate back to the transactions list
4. WHEN navigation occurs THEN the URL SHALL correctly reflect the current page location

### Requirement 4

**User Story:** As a system administrator, I want proper error handling for invalid transaction IDs, so that users receive clear feedback when accessing non-existent transactions.

#### Acceptance Criteria

1. WHEN a user provides an invalid UUID format for transaction ID THEN the system SHALL return a user-friendly 404 page
2. WHEN a user provides a valid UUID format but non-existent transaction ID THEN the system SHALL return a "transaction not found" message
3. WHEN UUID validation fails THEN the system SHALL NOT expose database error details to the user
4. WHEN routing errors occur THEN the system SHALL log appropriate error information for debugging