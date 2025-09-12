# GEMINI.md

## Project Overview

This is a comprehensive property management system for "Algerie Loft," built with Next.js 15 and TypeScript. The application is designed for managing loft properties in Algeria, with a focus on providing a modern, multi-language, and feature-rich experience for both property managers and owners.

**Key Technologies:**

*   **Framework:** Next.js 15 (with App Router)
*   **Language:** TypeScript
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth
*   **Styling:** Tailwind CSS
*   **Internationalization (i18n):** `next-intl`
*   **Testing:** Playwright (E2E), Jest (Unit)
*   **Deployment:** Vercel

**Architecture:**

The project follows a standard Next.js App Router structure. 
- The `app` directory contains the application's routes and pages.
- Reusable UI components are located in the `components` directory.
- The `lib` directory holds utility functions, and `messages` contains the translation files for `next-intl`.
- The application supports three languages: French (primary), Arabic (with RTL support), and English.

## Building and Running

**Prerequisites:**

*   Node.js 18+
*   npm or yarn
*   Supabase account

**Installation and Setup:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/nextjsreact/algerie-loft.git
    cd algerie-loft
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file by copying `.env.example` and fill in your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    ```

**Development:**

*   **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

**Building for Production:**

*   **Build the application:**
    ```bash
    npm run build
    ```

*   **Start the production server:**
    ```bash
    npm run start
    ```

**Testing:**

*   **Run unit tests:**
    ```bash
    npm run test
    ```

*   **Run end-to-end (E2E) tests:**
    ```bash
    npm run test:e2e
    ```

## Development Conventions

*   **Coding Style:** The project uses ESLint for code linting. Run `npm run lint` to check for issues.
*   **Internationalization:** All user-facing text should be added to the JSON files in the `messages` directory and accessed using `next-intl` hooks.
*   **State Management:** While not explicitly defined in the provided files, a modern React state management solution (like React Context or a third-party library) is likely used for managing global application state.
*   **Database:** Database interactions are handled through the Supabase client. SQL scripts for database setup and migrations are located in the `scripts` directory.
*   **Styling:** The project uses Tailwind CSS for styling. Utility classes should be used whenever possible. Global styles are defined in `app/globals.css`.
