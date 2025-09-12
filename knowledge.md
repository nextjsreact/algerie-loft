# Algerie Loft - Knowledge Base

## Project Overview
Algerie Loft is a comprehensive property management system for loft rentals in Algeria. Built with Next.js 15, this application manages lofts, reservations, owners, transactions, and provides multilingual support.

## Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Internationalization**: next-intl (migrated from i18next)
- **Authentication**: Supabase Auth
- **Language Support**: French (default), English, Arabic with RTL support

## Key Features
- Multi-language support (fr, en, ar)
- Real-time notifications and messaging
- Property availability calendar
- Financial transaction management
- Executive dashboard with analytics
- Photo upload and management
- Team and task management
- Responsive design with dark mode

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow Next.js App Router conventions
- Use server components by default, client components only when needed
- Implement proper error boundaries
- Use the existing UI component library in `components/ui/`

### Internationalization
- **IMPORTANT**: Project has migrated from i18next to next-intl
- Use `useTranslations('namespace')` hook for translations
- Translation files are in `messages/` directory (fr.json, en.json, ar.json)
- Always add translations for all 3 languages when adding new text
- Use namespaces to organize translations by feature area

### Database
- All database operations use Supabase client
- Server actions are in `app/actions/` directory
- RLS (Row Level Security) is enabled for all tables
- Use the utilities in `utils/supabase/` for client/server operations

### Common Patterns
- Forms use shadcn/ui components with proper validation
- Data fetching uses server components or server actions
- Real-time features use Supabase subscriptions
- File uploads go to Supabase Storage

### Testing
- E2E tests use Playwright (configured in `tests/e2e/`)
- Unit tests use Jest (configured in `__tests__/`)
- Run tests with: `npm test` or `npm run test:e2e`

### Deployment
- Project is deployed on Vercel
- Environment variables are configured for dev/staging/prod
- Database migrations are in `scripts/supabase_migrations/`

## Important Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests
- `npm run test:e2e` - Run Playwright tests

## Project Structure Notes
- `app/[locale]/` - Localized pages using Next.js App Router
- `components/` - Reusable UI components organized by feature
- `lib/` - Utility functions, types, and configurations
- `scripts/` - Database scripts and automation tools
- `public/` - Static assets and translation files

## Known Issues & Considerations
- Some legacy i18next code may still exist during migration
- Photo uploads require specific Supabase storage configuration
- Real-time features need proper WebSocket handling
- Arabic language requires RTL layout considerations

## Contact & Support
This is an internal property management system. Refer to project documentation and team leads for technical guidance.