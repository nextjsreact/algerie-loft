# Design Document

## Overview

This design addresses the missing dynamic routes for internet connection types by:
1. First migrating the existing `InternetConnectionTypeForm` component from `react-i18next` to `next-intl`
2. Then creating the necessary Next.js route structure to use the migrated form component

The form component exists but still uses `useTranslation` from `react-i18next` instead of `useTranslations` from `next-intl`.

## Architecture

The solution follows the existing pattern used by other settings sections (payment-methods, currencies, zone-areas) by creating:

1. **Edit Route**: `/[locale]/settings/internet-connections/[id]/page.tsx` - For editing existing connections
2. **New Route**: `/[locale]/settings/internet-connections/new/page.tsx` - For creating new connections

Both routes will use the existing `InternetConnectionTypeForm` component from `components/forms/internet-connection-type-form.tsx`.

## Components and Interfaces

### Existing Components (Migration Needed)
- `InternetConnectionTypeForm` - Exists but needs migration from `react-i18next` to `next-intl`
- `getInternetConnectionTypeById` - Already exists in actions (no changes needed)
- `createInternetConnectionType` - Already exists in actions (no changes needed)
- `updateInternetConnectionType` - Already exists in actions (no changes needed)

### Form Component Migration
The existing form needs these changes:
- Replace `useTranslation` with `useTranslations` from `next-intl`
- Update translation key format from `t('internetConnections:key')` to `t('key')` with proper namespace
- Replace `react-hot-toast` with `sonner` for consistency with other migrated components

### New Route Pages

#### 1. Edit Page (`/[locale]/settings/internet-connections/[id]/page.tsx`)
```typescript
interface EditPageProps {
  params: Promise<{ locale: string; id: string }>
}
```

**Responsibilities:**
- Fetch connection data using `getInternetConnectionTypeById`
- Handle 404 cases for invalid IDs
- Render `InternetConnectionTypeForm` with `initialData`
- Provide proper page metadata and layout

#### 2. New Page (`/[locale]/settings/internet-connections/new/page.tsx`)
```typescript
interface NewPageProps {
  params: Promise<{ locale: string }>
}
```

**Responsibilities:**
- Render `InternetConnectionTypeForm` without `initialData` (create mode)
- Provide proper page metadata and layout

## Data Models

No changes to existing data models. The `InternetConnectionType` interface is already defined and used by the existing form component.

## Error Handling

### 404 Handling
- When an invalid ID is provided to the edit route, use Next.js `notFound()` function
- The existing form component already handles API errors with toast notifications

### Validation
- Form validation is already handled by the existing `InternetConnectionTypeForm` component using Zod schema
- Server-side validation is handled by the existing action functions

## Testing Strategy

### Manual Testing
1. **Edit Flow**: Navigate to existing connection edit page, verify form loads with data, test updates
2. **Create Flow**: Navigate to new connection page, verify empty form, test creation
3. **404 Handling**: Test with invalid IDs to ensure proper 404 behavior
4. **Navigation**: Verify edit buttons in list page navigate correctly

### Integration Points
- Verify form submissions redirect properly to the list page
- Verify toast notifications work correctly
- Verify translations are properly loaded for the form

## Implementation Notes

### Route Structure
Following the existing pattern from other settings sections:
```
app/[locale]/settings/internet-connections/
├── page.tsx (existing - list view)
├── [id]/
│   └── page.tsx (new - edit view)
└── new/
    └── page.tsx (new - create view)
```

### Metadata and SEO
Both new pages should include proper metadata using Next.js metadata API, following the pattern of other settings pages.

### Internationalization
Both pages will use `next-intl` for translations, specifically the `internetConnections` namespace that's already configured for the form component.

### Navigation Flow
1. List page → Edit button → Edit page → Save → Back to list
2. List page → Add new button → New page → Create → Back to list
3. Edit/New page → Cancel/Back → Back to list