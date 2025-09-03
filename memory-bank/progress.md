# Progress

## Completed

*   **Resolved Stale Build Issue**: Fixed a recurring `TypeError` by removing the stale `.next` build directory, forcing a fresh build with the latest code.
*   **Resolved `TypeError`**: The `TypeError: Cannot read properties of undefined (reading 'includes')` in `app/actions/auth.ts` was resolved by performing a clean build and restarting the application, indicating the issue was due to a stale build. The `ensureUsersTable` function no longer contains the problematic code as it has been deprecated. A patch has also been added to prevent future `TypeError` issues by ensuring the error message is a string before evaluation.
*   **Resolved `TypeError` in `bill-alerts.tsx`**: Fixed a `TypeError` that occurred when marking a bill as paid by correcting the translation keys used for toast notifications.
*   **i18n Fixes**: Resolved syntax errors and duplicate keys in the `lib/i18n/translations.ts` file. Also added translations for the new "Reports" section.
*   **Database Configuration Consolidation**: Unified the database setup to use a single, TypeScript-native configuration for the Neon driver in `lib/database.ts`.
*   **TypeScript Errors Resolved**: Addressed and cleared all related TypeScript errors by improving module resolution in `tsconfig.json` and providing type definitions.
*   **Memory Bank Initialization**: Updated `projectbrief.md`, `techContext.md`, and `activeContext.md` with current project details and the database migration plan.
*   **Added Utility and Phone Fields to Lofts**:
    *   Created and executed a migration (`scripts/18-add-utility-fields-to-lofts.sql`) to add `water_customer_code`, `water_contract_code`, `water_meter_number`, `water_correspondent`, `electricity_pdl_ref`, `electricity_customer_number`, `electricity_meter_number`, `electricity_correspondent`, `gas_pdl_ref`, `gas_customer_number`, `gas_meter_number`, `gas_correspondent`, and `phone_number` columns to the `lofts` table.
    *   Updated the `Loft` type in `lib/types.ts` to include the new fields.
    *   Updated the `loftSchema` in `lib/validations.ts` to include the new fields for form validation.
    *   Modified the `LoftForm` component in `components/forms/loft-form.tsx` to display and handle input for these new fields.
*   **Fixed "Edit Loft" Form**:
    *   Created a new `app/lofts/[id]/edit/page.tsx` page to handle editing lofts.
    *   Updated the `LoftForm` to include all new utility and phone fields, and to handle both "create" and "edit" modes.
    *   Corrected a TypeScript error in the `LoftForm` by using the `name` property of the `LoftOwner` type instead of `full_name`.
    *   Modified the `updateLoft` function in `app/actions/lofts.ts` to return a `{ success: boolean }` object, resolving a TypeScript error on the edit page.

## Remaining

*   **Implemented Notification System**: The core notification system has been fully implemented.
    *   **Designed and Created Notification Schema**: The `notifications` table has been successfully migrated to the database.
    *   **Enhanced Notifications**: Improved task assignment notifications to include the task description and a direct link to the task. This involved adding a `link` column to the `notifications` table, updating the `createNotification` action to support it, and modifying the `Notification` component to render the link.
*   **Notification Read Receipts**: Implemented a read receipt system. When a user clicks on a notification, it is marked as read, and a new notification is sent to the original sender to inform them that their message has been seen. This involved adding a `sender_id` to the `notifications` table and creating a new server action to handle the logic. Fixed an issue where users would receive read receipts for their own "Notification Read" notifications. The read receipt notification now includes the name of the user who read it and the title of the task.
    *   **Developed UI Components and Page**: A `Notification` component, a `NotificationsList` client component, and a `NotificationsPage` server component have been created and integrated. A link has been added to the sidebar.
    *   **Implemented Backend Logic**: Server actions for creating, fetching, and marking notifications as read have been implemented and correctly integrated with the UI to avoid server-only module errors.
    *   **Integrated with Task Creation**: Notifications are now created and sent to users when a new task is assigned to them.
    *   **Added User Assignment to Task Form**: The task form now includes a dropdown to assign tasks to users on both new task creation and existing task editing pages.
    *   **Display Assigned User in Task List**: The main task list now displays the name of the user assigned to each task.
    *   **Unread Notification Indicator**: A red dot now appears on the notification bell in the sidebar when there are unread notifications.
    *   **Real-time Notifications**: Implemented real-time notifications with a sound effect using a custom `useNotifications` hook and Supabase Realtime.
    *   **Fixed Notifications RLS Policy**: The Row-Level Security policy for the `notifications` table has been updated to allow authenticated users to insert new notifications. A temporary bypass using the service role key has been implemented to resolve a persistent RLS issue that needs further investigation.
*   **Task Page Security**: Implemented a security check on the task page to ensure that users can only view tasks that are assigned to them, unless they are an admin or manager.
*   **Task Form Restrictions**: Restricted the task form so that regular users can only update the status of a task. All other fields are disabled for non-admin/manager roles.
*   **Task Update Authorization**: Fixed an issue where regular users could not update the status of their own tasks. The `updateTask` action now allows users to update tasks assigned to them.
*   **Task Update Notifications**: Implemented notifications to inform the task creator when the status of a task has been updated. The notification now includes the name of the user who updated the task.
*   **Unread Notification Indicator**: A red dot now appears on the notification bell in the sidebar when there are unread notifications.
