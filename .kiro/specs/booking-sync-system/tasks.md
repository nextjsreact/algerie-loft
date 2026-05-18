# Tasks - Système de Synchronisation Airbnb

## Phase 1: Database & Infrastructure (CRITIQUE)

### Task 1.1: Create Database Migrations
**Priority:** CRITICAL  
**Estimated Time:** 2h  
**Dependencies:** None

**Description:**
Create Supabase migrations for all tables and indexes.

**Acceptance Criteria:**
- [x] Create migration file `supabase/migrations/001_booking_sync_tables.sql`
- [x] Tables created: property_sync_config, bookings, conflicts, sync_logs, system_settings
- [x] All indexes created (6 indexes)
- [x] Unique constraints enforced: (property_id, check_in_date, check_out_date)
- [x] Check constraints enforced: check_in_date < check_out_date
- [x] Default values set: playwright_toggle = 'true'
- [ ] Migration runs successfully on local Supabase (à tester)

**Files Created:**
- ✅ `supabase/migrations/001_booking_sync_tables.sql`

---

### Task 1.2: Create RLS Policies
**Priority:** CRITICAL  
**Estimated Time:** 1h  
**Dependencies:** Task 1.1

**Description:**
Implement Row Level Security policies for all tables.

**Acceptance Criteria:**
- [x] RLS enabled on all 6 tables
- [x] Authenticated users can read properties and bookings
- [x] Only admins can write to sync_config, bookings, conflicts
- [x] Service role bypasses RLS
- [ ] Policies tested with different user roles (à tester)

**Files Created:**
- ✅ `supabase/migrations/002_rls_policies.sql`

---

### Task 1.3: Configure Vercel Cron
**Priority:** CRITICAL  
**Estimated Time:** 30min  
**Dependencies:** None

**Description:**
Configure Vercel Cron Jobs for iCal sync every 30 minutes.

**Acceptance Criteria:**
- [x] Create/update `vercel.json` with cron configuration
- [x] Cron path: `/api/cron/sync-ical`
- [x] Schedule: `*/30 * * * *` (every 30 minutes)
- [ ] Environment variable CRON_SECRET configured in Vercel (à configurer)

**Files Created/Updated:**
- ✅ `vercel.json` (updated)
- ✅ `supabase/SETUP.md` (setup guide created)

---

## Phase 2: Core Sync Components (CRITIQUE)

### Task 2.1: Implement iCal Fetcher
**Priority:** CRITICAL  
**Estimated Time:** 3h  
**Dependencies:** Task 1.1

**Description:**
Create the iCal fetcher component that retrieves and parses Airbnb iCal feeds.

**Acceptance Criteria:**
- [ ] Install `node-ical` package
- [ ] Function `fetchAndParseICal(icalUrl: string)` implemented
- [ ] Parses VEVENT entries (UID, DTSTART, DTEND, SUMMARY)
- [ ] Handles timezone information
- [ ] Returns array of Partial_Reservation objects
- [ ] Error handling for invalid iCal format
- [ ] Unit tests with sample iCal data

**Files to Create:**
- `lib/sync/icalFetcher.ts`
- `lib/sync/__tests__/icalFetcher.test.ts`

---

### Task 2.2: Implement Batch Processor
**Priority:** CRITICAL  
**Estimated Time:** 2h  
**Dependencies:** None

**Description:**
Create batch processor to handle 85 properties in batches of 20.

**Acceptance Criteria:**
- [ ] Function `processBatch(items: T[], batchSize: number, processor: Function)` implemented
- [ ] Divides 85 properties into batches of 20
- [ ] Each batch completes within 25 seconds
- [ ] Commits results after each batch
- [ ] Continues with next batch if one fails
- [ ] Returns cumulative metrics
- [ ] Unit tests with mock data

**Files to Create:**
- `lib/sync/batchProcessor.ts`
- `lib/sync/__tests__/batchProcessor.test.ts`

---

### Task 2.3: Implement Booking Repository
**Priority:** CRITICAL  
**Estimated Time:** 4h  
**Dependencies:** Task 1.1

**Description:**
Create repository layer for booking CRUD operations with Supabase.

**Acceptance Criteria:**
- [ ] Functions: createBooking, updateBooking, getBookingsByProperty, getBookingsByDateRange
- [ ] Validates check_in < check_out
- [ ] Validates check_in not more than 30 days in past
- [ ] Handles unique constraint violations gracefully
- [ ] Updates source from "airbnb_ical" to "airbnb_csv" when enriching
- [ ] Preserves created_at timestamp on updates
- [ ] Unit tests with Supabase mock

**Files to Create:**
- `lib/repositories/bookingRepository.ts`
- `lib/repositories/__tests__/bookingRepository.test.ts`

---

### Task 2.4: Implement Conflict Detector
**Priority:** CRITICAL  
**Estimated Time:** 3h  
**Dependencies:** Task 2.3

**Description:**
Create conflict detection system for overlapping reservations.

**Acceptance Criteria:**
- [ ] Function `detectConflicts(newBooking, existingBookings)` implemented
- [ ] Overlap logic: (new_checkin < existing_checkout) AND (new_checkout > existing_checkin)
- [ ] Only checks confirmed and checked_in reservations
- [ ] Creates conflict records with severity "critical"
- [ ] Calculates overlap_start and overlap_end dates
- [ ] Re-evaluates conflicts when reservation cancelled
- [ ] Unit tests with known overlapping/non-overlapping cases

**Files to Create:**
- `lib/sync/conflictDetector.ts`
- `lib/sync/__tests__/conflictDetector.test.ts`

---

## Phase 3: API Routes (CRITIQUE)

### Task 3.1: Create Cron Sync iCal Route
**Priority:** CRITICAL  
**Estimated Time:** 4h  
**Dependencies:** Task 2.1, 2.2, 2.3, 2.4

**Description:**
Create API route for automatic iCal synchronization triggered by Vercel Cron.

**Acceptance Criteria:**
- [ ] Route: `POST /api/cron/sync-ical`
- [ ] Validates CRON_SECRET in Authorization header
- [ ] Returns 401 if token invalid
- [ ] Fetches all active properties from property_sync_config
- [ ] Uses Batch Processor to process 20 properties per batch
- [ ] For each property: fetch iCal → parse → create/update bookings → detect conflicts
- [ ] Creates sync_log record with metrics
- [ ] Returns JSON with sync_log_id and metrics
- [ ] Error handling with rollback per batch

**Files to Create:**
- `app/api/cron/sync-ical/route.ts`

---

### Task 3.2: Create Sync Trigger Route
**Priority:** HIGH  
**Estimated Time:** 2h  
**Dependencies:** Task 3.1

**Description:**
Create API route for manual "Sync Now" button.

**Acceptance Criteria:**
- [ ] Route: `POST /api/sync/trigger`
- [ ] Validates user JWT token (authenticated)
- [ ] Checks last sync time (10 min delay OR last was automatic)
- [ ] Triggers same logic as cron sync
- [ ] Returns sync_log_id immediately
- [ ] Sync runs asynchronously

**Files to Create:**
- `app/api/sync/trigger/route.ts`

---

### Task 3.3: Create Playwright Toggle Route
**Priority:** HIGH  
**Estimated Time:** 1h  
**Dependencies:** Task 1.1

**Description:**
Create API route for GitHub Actions to check Playwright toggle status.

**Acceptance Criteria:**
- [ ] Route: `GET /api/settings/playwright-toggle`
- [ ] Validates API_SECRET in Authorization header
- [ ] Reads playwright_toggle from system_settings table
- [ ] Returns JSON: `{enabled: boolean}`
- [ ] Route: `PUT /api/settings/playwright-toggle` for admin updates
- [ ] Logs toggle changes with user_id and timestamp

**Files to Create:**
- `app/api/settings/playwright-toggle/route.ts`

---

## Phase 4: CSV Processing (HIGH)

### Task 4.1: Implement CSV Parser
**Priority:** HIGH  
**Estimated Time:** 3h  
**Dependencies:** Task 1.1

**Description:**
Create CSV parser for Airbnb export format.

**Acceptance Criteria:**
- [ ] Install `csv-parse` package
- [ ] Function `parseAirbnbCSV(csvContent: string)` implemented
- [ ] Parses columns: Listing Name, Check-in, Check-out, Guest Name, Email, Phone, Amount, Currency, Status
- [ ] Handles quoted fields and escaped commas
- [ ] Handles UTF-8 encoding
- [ ] Maps "Listing Name" to property_id via properties table
- [ ] Returns array of Complete_Reservation objects
- [ ] Error handling with line numbers
- [ ] Unit tests with sample Airbnb CSV

**Files to Create:**
- `lib/sync/csvParser.ts`
- `lib/sync/__tests__/csvParser.test.ts`
- `lib/sync/__fixtures__/sample-airbnb.csv`

---

### Task 4.2: Implement Reservation Matcher
**Priority:** HIGH  
**Estimated Time:** 4h  
**Dependencies:** Task 2.3, 4.1

**Description:**
Create intelligent matcher to associate CSV entries with iCal reservations.

**Acceptance Criteria:**
- [ ] Function `matchCSVWithICal(csvEntry, existingBookings)` implemented
- [ ] Exact match: property_id + check_in + check_out identical
- [ ] Fuzzy match: check_in ±1 day AND check_out ±1 day
- [ ] No match: create new booking with source "airbnb_csv" and flag "csv_only"
- [ ] Updates existing Partial_Reservation to Complete_Reservation
- [ ] Updates source to "airbnb_csv" when enriching
- [ ] Logs fuzzy matches for manual review
- [ ] Detects multiple iCal matches (conflict)
- [ ] Unit tests with exact/fuzzy/no-match scenarios

**Files to Create:**
- `lib/sync/reservationMatcher.ts`
- `lib/sync/__tests__/reservationMatcher.test.ts`

---

### Task 4.3: Create Manual CSV Import Route
**Priority:** HIGH  
**Estimated Time:** 3h  
**Dependencies:** Task 4.1, 4.2

**Description:**
Create API route for manual CSV upload by admin.

**Acceptance Criteria:**
- [ ] Route: `POST /api/import/csv`
- [ ] Accepts multipart/form-data with CSV file
- [ ] Validates user is admin
- [ ] Validates CSV format and required columns
- [ ] Parses CSV using csvParser
- [ ] Matches entries using reservationMatcher
- [ ] Creates/updates bookings
- [ ] Returns metrics: imported, matched, created, errors
- [ ] Supports up to 1000 reservations per file
- [ ] Error handling with detailed error report

**Files to Create:**
- `app/api/import/csv/route.ts`

---

## Phase 5: Playwright Automation (HIGH)

### Task 5.1: Create Playwright Export Script
**Priority:** HIGH  
**Estimated Time:** 6h  
**Dependencies:** Task 4.1, 4.2

**Description:**
Create Playwright script to automate Airbnb CSV export.

**Acceptance Criteria:**
- [ ] Install `playwright` package
- [ ] Script: `scripts/airbnbExport.ts`
- [ ] Authenticates to Airbnb using AIRBNB_EMAIL and AIRBNB_PASSWORD
- [ ] Navigates to reservations export page
- [ ] Clicks "Export CSV" button
- [ ] Downloads CSV file
- [ ] Parses CSV using csvParser
- [ ] Matches using reservationMatcher
- [ ] Pushes to Supabase using bookingRepository
- [ ] Random delays 5-15s between actions
- [ ] Randomized user agent
- [ ] CAPTCHA detection with alert
- [ ] Error handling with retry (3 attempts)
- [ ] Returns metrics

**Files to Create:**
- `scripts/airbnbExport.ts`
- `scripts/utils/playwrightHelpers.ts`

---

### Task 5.2: Create GitHub Actions Workflow
**Priority:** HIGH  
**Estimated Time:** 2h  
**Dependencies:** Task 5.1, 3.3

**Description:**
Create GitHub Actions workflow to run Playwright export daily at 3am.

**Acceptance Criteria:**
- [ ] Workflow file: `.github/workflows/airbnb-csv-export.yml`
- [ ] Schedule: `0 3 * * *` (3am UTC daily)
- [ ] Manual trigger: `workflow_dispatch`
- [ ] Checks Playwright toggle via API before running
- [ ] Installs Node.js 20 and Playwright
- [ ] Runs `scripts/airbnbExport.ts`
- [ ] Uses secrets: AIRBNB_EMAIL, AIRBNB_PASSWORD, API_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- [ ] Sends alert on failure

**Files to Create:**
- `.github/workflows/airbnb-csv-export.yml`

---

## Phase 6: UI Components (MEDIUM)

### Task 6.1: Create Unified Calendar Component
**Priority:** MEDIUM  
**Estimated Time:** 8h  
**Dependencies:** Task 2.3

**Description:**
Create monthly calendar view displaying all Airbnb reservations.

**Acceptance Criteria:**
- [ ] Component: `app/[locale]/admin/calendar/page.tsx`
- [ ] Displays monthly view with previous/next navigation
- [ ] Color-coded: blue (Complete_Reservation), light blue (Partial_Reservation)
- [ ] Conflict indicators on overlapping dates
- [ ] Property filter dropdown
- [ ] Click reservation → modal with full details
- [ ] "Sync Now" button with loading state
- [ ] Responsive design (mobile + desktop)

**Files to Create:**
- `app/[locale]/admin/calendar/page.tsx`
- `components/calendar/UnifiedCalendar.tsx`
- `components/calendar/ReservationModal.tsx`

---

### Task 6.2: Create Property Sync Config Page
**Priority:** MEDIUM  
**Estimated Time:** 4h  
**Dependencies:** Task 1.1

**Description:**
Create admin page to configure iCal URLs for properties.

**Acceptance Criteria:**
- [ ] Page: `app/[locale]/admin/properties/sync-config/page.tsx`
- [ ] Lists all 85 properties with sync status
- [ ] Edit iCal URL for each property
- [ ] Validates HTTPS URL format
- [ ] Toggle is_active per property
- [ ] Displays last_sync_at and last_sync_status
- [ ] Save button with success/error feedback

**Files to Create:**
- `app/[locale]/admin/properties/sync-config/page.tsx`
- `app/api/properties/sync-config/route.ts`

---

### Task 6.3: Create Sync Logs Dashboard
**Priority:** MEDIUM  
**Estimated Time:** 4h  
**Dependencies:** Task 1.1

**Description:**
Create dashboard to view sync history and metrics.

**Acceptance Criteria:**
- [ ] Page: `app/[locale]/admin/sync-logs/page.tsx`
- [ ] Table displaying last 30 days of sync_logs
- [ ] Columns: timestamp, type, status, properties_synced, bookings_created/updated, conflicts, duration
- [ ] Filter by sync_type (ical_auto, csv_auto, manual)
- [ ] Success rate percentage per type
- [ ] Expandable rows showing error details
- [ ] "Needs attention" flag for 3+ consecutive failures

**Files to Create:**
- `app/[locale]/admin/sync-logs/page.tsx`
- `app/api/sync/logs/route.ts`

---

### Task 6.4: Create Manual CSV Import Page
**Priority:** MEDIUM  
**Estimated Time:** 3h  
**Dependencies:** Task 4.3

**Description:**
Create admin page for manual CSV upload.

**Acceptance Criteria:**
- [ ] Page: `app/[locale]/admin/import-csv/page.tsx`
- [ ] File upload button with drag-and-drop
- [ ] Validates file type (.csv)
- [ ] Shows upload progress
- [ ] Displays import results: imported, matched, created, errors
- [ ] Error report with line numbers if validation fails
- [ ] Success message with metrics

**Files to Create:**
- `app/[locale]/admin/import-csv/page.tsx`

---

### Task 6.5: Create Settings Page (Playwright Toggle)
**Priority:** MEDIUM  
**Estimated Time:** 2h  
**Dependencies:** Task 3.3

**Description:**
Create admin settings page to manage Playwright toggle.

**Acceptance Criteria:**
- [ ] Page: `app/[locale]/admin/settings/page.tsx`
- [ ] Toggle switch for Playwright CSV export
- [ ] Warning message when disabled
- [ ] Save button with confirmation
- [ ] Displays last toggle change timestamp and user

**Files to Create:**
- `app/[locale]/admin/settings/page.tsx`

---

## Phase 7: Alerts & Monitoring (MEDIUM)

### Task 7.1: Implement Alert Service
**Priority:** MEDIUM  
**Estimated Time:** 3h  
**Dependencies:** Task 2.4

**Description:**
Create email alert service using Resend API.

**Acceptance Criteria:**
- [ ] Install `resend` package
- [ ] Function `sendConflictAlert(conflict)` implemented
- [ ] Function `sendPlaywrightFailureAlert(errorDetails)` implemented
- [ ] Email templates with property name, dates, details
- [ ] Batches multiple conflicts into single email
- [ ] Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- [ ] Logs alert failures
- [ ] Unit tests with Resend mock

**Files to Create:**
- `lib/services/alertService.ts`
- `lib/services/__tests__/alertService.test.ts`
- `lib/services/email-templates/conflictAlert.tsx`

---

### Task 7.2: Integrate Alerts with Conflict Detector
**Priority:** MEDIUM  
**Estimated Time:** 1h  
**Dependencies:** Task 7.1, 2.4

**Description:**
Connect conflict detector to alert service.

**Acceptance Criteria:**
- [ ] When Critical_Conflict detected, call alertService.sendConflictAlert()
- [ ] Alert sent within 60 seconds
- [ ] Batch conflicts from same Sync_Cycle
- [ ] Log alert success/failure in sync_logs

**Files to Update:**
- `lib/sync/conflictDetector.ts`

---

### Task 7.3: Integrate Alerts with Playwright
**Priority:** MEDIUM  
**Estimated Time:** 1h  
**Dependencies:** Task 7.1, 5.1

**Description:**
Send alerts when Playwright fails for 3 consecutive days.

**Acceptance Criteria:**
- [ ] Track Playwright failures in sync_logs
- [ ] Query last 3 days of csv_auto sync_logs
- [ ] If 3+ consecutive failures, call alertService.sendPlaywrightFailureAlert()
- [ ] Include error details in email

**Files to Update:**
- `scripts/airbnbExport.ts`

---

## Phase 8: Testing & Validation (HIGH)

### Task 8.1: Create Integration Tests
**Priority:** HIGH  
**Estimated Time:** 6h  
**Dependencies:** All Phase 2-5 tasks

**Description:**
Create end-to-end integration tests for sync pipeline.

**Acceptance Criteria:**
- [ ] Test: iCal fetch → parse → store → detect conflicts
- [ ] Test: CSV parse → match → enrich → detect conflicts
- [ ] Test: Manual CSV import → match → store
- [ ] Test: Batch processing with 85 properties
- [ ] Test: Conflict detection with overlapping reservations
- [ ] Test: Fuzzy matching with ±1 day tolerance
- [ ] Uses Supabase test database
- [ ] Cleanup after each test

**Files to Create:**
- `__tests__/integration/syncPipeline.test.ts`
- `__tests__/integration/csvImport.test.ts`
- `__tests__/integration/conflictDetection.test.ts`

---

### Task 8.2: Create Property-Based Tests
**Priority:** MEDIUM  
**Estimated Time:** 4h  
**Dependencies:** Task 2.1, 4.1

**Description:**
Create property-based tests for round-trip properties.

**Acceptance Criteria:**
- [ ] Install `fast-check` package
- [ ] Test: iCal parse → pretty-print → parse (round-trip)
- [ ] Test: CSV parse → pretty-print → parse (round-trip)
- [ ] Test: Batch processing invariant (sum of batches = total items)
- [ ] Test: Conflict detection with non-overlapping reservations (always false)
- [ ] Test: Unique constraint invariant

**Files to Create:**
- `__tests__/property-based/icalRoundTrip.test.ts`
- `__tests__/property-based/csvRoundTrip.test.ts`
- `__tests__/property-based/batchInvariant.test.ts`

---

## Phase 9: Documentation & Deployment (LOW)

### Task 9.1: Create README
**Priority:** LOW  
**Estimated Time:** 2h  
**Dependencies:** None

**Description:**
Create comprehensive README for the booking sync system.

**Acceptance Criteria:**
- [ ] Overview of 3-level architecture
- [ ] Setup instructions (environment variables, migrations)
- [ ] How to configure iCal URLs
- [ ] How to use manual CSV import
- [ ] How to disable Playwright toggle
- [ ] Troubleshooting guide
- [ ] Architecture diagrams

**Files to Create:**
- `docs/BOOKING_SYNC_README.md`

---

### Task 9.2: Deploy to Production
**Priority:** LOW  
**Estimated Time:** 2h  
**Dependencies:** All tasks

**Description:**
Deploy the booking sync system to production.

**Acceptance Criteria:**
- [ ] Run migrations on production Supabase
- [ ] Configure environment variables in Vercel
- [ ] Configure GitHub Secrets for Playwright
- [ ] Test cron job triggers correctly
- [ ] Test manual sync button
- [ ] Test manual CSV import
- [ ] Monitor first 24h of automatic syncs
- [ ] Verify alerts are sent correctly

---

## Summary

**Total Tasks:** 29  
**Estimated Total Time:** 85 hours (~2-3 weeks for 1 developer)

### Priority Breakdown:
- **CRITICAL:** 9 tasks (31 hours) - Phase 1-3
- **HIGH:** 8 tasks (28 hours) - Phase 4-5, 8
- **MEDIUM:** 10 tasks (22 hours) - Phase 6-7
- **LOW:** 2 tasks (4 hours) - Phase 9

### Recommended Implementation Order:
1. **Week 1:** Phase 1-3 (Database + Core Sync + API Routes)
2. **Week 2:** Phase 4-5 (CSV Processing + Playwright)
3. **Week 3:** Phase 6-8 (UI + Alerts + Testing)
4. **Week 4:** Phase 9 + Buffer (Documentation + Deployment + Fixes)

### Critical Path:
Task 1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 2.4 → 3.1 → 4.1 → 4.2 → 5.1 → 5.2

### Parallel Work Opportunities:
- Task 1.3 (Vercel config) can be done anytime
- Task 6.x (UI components) can start after Task 2.3
- Task 7.x (Alerts) can start after Task 2.4
- Task 8.x (Tests) can be written alongside implementation
