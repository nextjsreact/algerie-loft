# Implementation Plan

- [x] 1. Fix immediate missing translation keys

  - Move reportsLabel to proper reservations namespace in French translation file
  - Verify calendar translations structure in reservations.calendar section
  - Test that all calendar controls display proper French text
  - _Requirements: 1.1, 1.2_

- [x] 2. Standardize ReservationCalendar component translation usage

  - Update component to use consistent translation namespace pattern
  - Ensure all calendar-related translations use reservations.calendar prefix
  - Test calendar view switching (month, week, day) displays correct French labels
  - _Requirements: 2.1, 2.2_

- [x] 3. Fix reservations page translation namespace inconsistencies

  - Move root-level translation keys (reportsLabel, guests, new) to reservations.actions namespace
  - Update page component to use proper nested translation keys
  - Verify all action buttons display correct French text
  - _Requirements: 1.1, 2.1_

- [x] 4. Create translation validation utility

  - Write script to scan all useTranslations calls in components

  - Extract all translation keys used in the codebase
  - Compare against available keys in translation files
  - Generate report of missing translations with file locations
  - _Requirements: 3.1, 3.2_

- [ ] 5. Implement SafeTranslation fallback component

  - Create reusable component for safe translation rendering
  - Add fallback mechanism for missing translation keys
  - Include development warnings for missing translations
  - Replace critical translation calls with SafeTranslation component
  - _Requirements: 1.2, 3.3_

- [ ] 6. Add comprehensive translation tests

  - Create unit tests for all translation-dependent components
  - Test that no raw translation keys are displayed in rendered output
  - Verify all French translations are properly loaded and displayed
  - Add integration tests for full page translation coverage
  - _Requirements: 1.1, 1.3_

- [x] 7. Update Arabic translation file consistency

  - Ensure Arabic translations follow same namespace structure as French
  - Add missing keys identified in validation to Arabic translation file
  - Test Arabic locale displays properly without raw translation keys
  - _Requirements: 1.1, 2.2_

- [x] 8. Fix currency form mixed language issue

  - Replace hardcoded English text "Enter the currency details below" with translation key
  - Replace hardcoded "Symbol" label with translation key
  - Add missing translation keys to all language files (ar.json, fr.json, en.json)
  - Test that currency form displays consistently in Arabic without mixed languages
  - _Requirements: 1.1, 1.2_

- [x] 9. Fix missing payment methods new route (404 error)

  - Create missing app/[locale]/settings/payment-methods/new/page.tsx file
  - Import and use existing PaymentMethodForm component with createPaymentMethod action
  - Ensure route structure matches other settings pages (currencies, categories, etc.)
  - Fix missing common.name translation key in all language files (ar.json, fr.json, en.json)
  - _Requirements: 1.1, 2.1_

- [x] 10. Fix missing common translation keys


  - Add missing common.name key to all language files
  - Ensure all common translation keys are consistent across languages
  - Verify no more MISSING_MESSAGE errors for common namespace
  - _Requirements: 1.1, 1.2_

- [ ] 11. Create translation development guidelines
  - Document standardized namespace conventions for future development
  - Create checklist for adding new translation keys
  - Add pre-commit hooks to validate translation consistency
  - _Requirements: 2.2, 2.3_
