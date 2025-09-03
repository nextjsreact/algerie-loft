# Implementation Plan

- [x] 1. Migrate InternetConnectionTypeForm component to next-intl


  - Replace `useTranslation` from `react-i18next` with `useTranslations` from `next-intl`
  - Update translation key format from `t('internetConnections:key')` to `t('key')` with proper namespace
  - Replace `react-hot-toast` with `sonner` for consistency
  - Test form functionality after migration
  - _Requirements: 1.2, 2.2, 3.2, 3.3_











- [ ] 2. Create dynamic route structure for internet connections
- [ ] 2.1 Create edit route page
  - Create `app/[locale]/settings/internet-connections/[id]/page.tsx`
  - Implement server component that fetches connection data using `getInternetConnectionTypeById`
  - Handle 404 cases for invalid IDs using Next.js `notFound()`
  - Render `InternetConnectionTypeForm` with `initialData` prop






  - Add proper metadata and page title
  - _Requirements: 1.1, 1.2, 1.3_







- [x] 2.2 Create new connection route page





  - Create `app/[locale]/settings/internet-connections/new/page.tsx`




  - Implement server component for creating new connections
  - Render `InternetConnectionTypeForm` without `initialData` (create mode)
  - Add proper metadata and page title
  - _Requirements: 2.1, 2.3_





- [ ] 3. Test and verify functionality
- [ ] 3.1 Test edit flow
  - Navigate to existing connection edit page from list
  - Verify form loads with correct data
  - Test form submission and redirect back to list
  - Verify toast notifications work correctly

  - _Requirements: 1.1, 1.4, 3.3_

- [ ] 3.2 Test create flow
  - Navigate to new connection page from list
  - Verify empty form loads correctly
  - Test form submission and redirect back to list
  - Verify toast notifications work correctly
  - _Requirements: 2.1, 2.2, 2.4, 3.3_

- [ ] 3.3 Test error handling
  - Test with invalid connection IDs to ensure 404 behavior
  - Test form validation with invalid data
  - Verify proper error messages display
  - _Requirements: 1.3, 2.3_