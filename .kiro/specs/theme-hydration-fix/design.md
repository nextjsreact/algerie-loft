# Design Document

## Overview

The hydration mismatch occurs because next-themes dynamically adds theme attributes to the `<html>` element on the client side, but these attributes don't exist during server-side rendering. This creates a mismatch between the server-rendered HTML and the client-rendered HTML.

The solution involves:
1. Suppressing hydration warnings for theme-related attributes
2. Using the `suppressHydrationWarning` prop on the html element
3. Ensuring proper theme initialization without layout shifts

## Architecture

The fix will be implemented at the root layout level where the `<html>` element is defined. We'll use React's built-in `suppressHydrationWarning` prop to handle the expected mismatch for theme attributes while maintaining hydration safety for other content.

## Components and Interfaces

### Root Layout Updates
- Add `suppressHydrationWarning` to the `<html>` element in `app/layout.tsx`
- This will suppress hydration warnings for attributes that are expected to differ between server and client
- The suppression is safe because theme attributes don't affect the content structure

### Theme Provider Configuration
- Ensure the ThemeProvider is properly configured with:
  - `attribute="class"` to use CSS classes for theming
  - `defaultTheme="system"` to respect user's system preference
  - `enableSystem` to detect system theme changes
  - `disableTransitionOnChange` to prevent flash during theme switches

## Data Models

No data model changes are required. The theme state is managed by next-themes internally.

## Error Handling

- The `suppressHydrationWarning` prop only suppresses warnings for the specific element it's applied to
- Content inside the element will still be validated for hydration mismatches
- This ensures we only suppress the expected theme-related warnings while catching other potential issues

## Testing Strategy

### Manual Testing
1. Load the application and verify no hydration warnings appear in the console
2. Test theme switching functionality to ensure it still works correctly
3. Test system theme detection and automatic switching
4. Verify no flash of unstyled content occurs during initial load

### Automated Testing
- Add tests to verify theme provider initialization
- Test theme persistence across page navigation
- Verify theme attributes are applied correctly without hydration issues

## Implementation Notes

The `suppressHydrationWarning` approach is the recommended solution for next-themes hydration issues according to the next-themes documentation and Next.js best practices. This is a targeted fix that only suppresses warnings for the specific case where we expect server/client differences (theme attributes) while maintaining hydration validation for all other content.