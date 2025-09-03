# Requirements Document - Fix Reservations Page Translations

## Introduction

The reservations page currently displays translation keys instead of actual translations, creating a poor user experience. The page must work correctly in French, Arabic, and English, following the same translation architecture as the dashboard which works perfectly.

## Requirements

### Requirement 1

**User Story:** As a user, I want the reservations page to display in my selected language (French, Arabic, or English), so that I can understand and use the interface effectively.

#### Acceptance Criteria

1. WHEN I visit the reservations page THEN all text SHALL display in the correct language based on my language selection
2. WHEN I switch languages THEN the reservations page SHALL update to show the new language immediately
3. WHEN viewing in French THEN all text SHALL be in proper French without any Arabic or English mixed in
4. WHEN viewing in Arabic THEN all text SHALL be in proper Arabic without any French or English mixed in
5. WHEN viewing in English THEN all text SHALL be in proper English without any Arabic or French mixed in

### Requirement 2

**User Story:** As a developer, I want the reservations page to use the same translation architecture as the dashboard, so that it's consistent and maintainable.

#### Acceptance Criteria

1. WHEN examining the code THEN the reservations page SHALL use the same useTranslation hook as the dashboard
2. WHEN examining the translation files THEN they SHALL follow the same structure as other working translation files
3. WHEN adding new translations THEN they SHALL be added to all three language files (fr, ar, en)
4. WHEN the translation system loads THEN it SHALL find and use the reservations translation keys correctly

### Requirement 3

**User Story:** As a user, I want all reservation-related text to be properly translated, so that I can understand all functionality.

#### Acceptance Criteria

1. WHEN viewing statistics THEN "Total Reservations", "Monthly Revenue", "Occupancy Rate", and "Guest Satisfaction" SHALL be translated
2. WHEN viewing action buttons THEN "New Reservation", "Quick Actions" SHALL be translated
3. WHEN viewing sections THEN "Recent Activity", "Professional Tools", "Availability Management" SHALL be translated
4. WHEN viewing the calendar THEN "Reservations Calendar" and "Live View" SHALL be translated
5. WHEN viewing the page title THEN "Reservations" and subtitle SHALL be translated

## Success Criteria

- No translation keys (like "reservations.title") are visible to users
- All text displays in the correct language
- Language switching works immediately
- The page works identically to the dashboard in terms of translation behavior