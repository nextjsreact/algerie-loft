# System Patterns

## Architecture

This project follows a server-side rendered (SSR) architecture using Next.js. The front-end is built with React components, and the back-end logic is handled by server-side actions and API routes.

## Key Design Patterns

*   **Component-Based UI**: The user interface is built using reusable React components, organized by feature and type (e.g., `components/forms`, `components/layout`).
*   **Server Actions**: Business logic is encapsulated in server actions (`app/actions`), which allows for secure and direct communication between the client and server without needing to create separate API endpoints for every operation.
*   **Data-Fetching**: Data is fetched on the server using async components and server actions to ensure fast page loads and a good user experience.
*   **Styling**: The application uses Tailwind CSS for utility-first styling, with custom themes and components defined in `tailwind.config.ts` and `app/globals.css`.
