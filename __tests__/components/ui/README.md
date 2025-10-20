# UI Component Tests

This directory contains comprehensive unit tests for all UI components used in the public website. The tests are built using React Testing Library and follow best practices for component testing.

## Test Coverage

### Components Tested

1. **Button** (`button.test.tsx`)
   - Variant rendering (default, destructive, outline, secondary, ghost, link)
   - Size variations (default, sm, lg, icon)
   - Event handling (click events)
   - Disabled state
   - AsChild prop functionality
   - Custom className application

2. **Card** (`card.test.tsx`)
   - All card sub-components (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
   - Complete card composition
   - Custom styling
   - Ref forwarding

3. **PropertyCard** (`property-card.test.tsx`)
   - Property information display
   - Multiple variants (grid, list, featured)
   - Image gallery interaction
   - Contact modal integration
   - Favorite functionality
   - Status badges
   - Price display handling
   - PropertyGrid component

4. **ServiceCard** (`service-card.test.tsx`)
   - Service information display
   - Multiple variants (default, compact, detailed, pricing)
   - Feature and benefit display
   - Pricing information
   - CTA button handling
   - Popular and new badges
   - ServiceGrid component

5. **ResponsiveImage** (`responsive-image.test.tsx`)
   - Image loading states
   - Error handling and fallbacks
   - Specialized image components (HeroImage, PropertyImage, ServiceIcon)
   - Loading and error states
   - Custom props handling
   - Responsive behavior

6. **Modal** (`modal.test.tsx`)
   - Basic modal functionality
   - Size variations
   - Close button behavior
   - Overlay click handling
   - Specialized modals (ConfirmationModal, ImageModal, ContactModal)
   - Form integration

7. **LanguageSelector** (`language-selector.test.tsx`)
   - Language switching functionality
   - Display modes (with/without text)
   - Cookie management
   - URL navigation
   - Responsive behavior
   - Hydration handling

## Testing Patterns

### React Testing Library Usage

All tests use React Testing Library for:
- Component rendering
- User interaction simulation
- Accessibility-focused queries
- Event handling verification

### Mock Strategy

Tests include comprehensive mocking for:
- Next.js components (Image, navigation hooks)
- External dependencies (next-intl)
- Browser APIs (matchMedia, IntersectionObserver, ResizeObserver)
- Component dependencies

### Test Structure

Each test file follows a consistent structure:
1. Import statements and mocks
2. Mock data setup
3. Test suites organized by functionality
4. Individual test cases with descriptive names
5. Cleanup and teardown

## Running Tests

```bash
# Run all UI component tests
npm test -- __tests__/components/ui

# Run specific component test
npm test -- __tests__/components/ui/button.test.tsx

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Statistics

- **Total Test Cases**: 119
- **Components Covered**: 7/7 (100%)
- **Testing Patterns**: 
  - React Testing Library render: 100%
  - Screen queries: 100%
  - Event simulation: 86%
  - Assertions: 100%
  - Mock functions: 100%

## Requirements Compliance

These tests fulfill the following requirements:

- **Requirement 4.1**: Mobile responsiveness testing
- **Requirement 5.1**: Performance and loading state testing
- **Task 3.3**: Component unit testing with React Testing Library

## Best Practices Implemented

1. **Accessibility Testing**: Using semantic queries and ARIA attributes
2. **User-Centric Testing**: Testing from user perspective, not implementation details
3. **Comprehensive Coverage**: Testing happy paths, edge cases, and error states
4. **Mock Isolation**: Proper mocking to isolate component behavior
5. **Descriptive Tests**: Clear test names and organized test suites
6. **Type Safety**: Full TypeScript support in test files

## Visual Regression Testing

Companion Storybook stories are available in the `/stories` directory for visual regression testing and component documentation.