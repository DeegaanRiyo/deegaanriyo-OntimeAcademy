# Refinament01 — Owner Dashboard Refactor

## Status: IN PROGRESS
## Scope: Owner Dashboard first → then replicate/sync to all other dashboards

---

## Context

The Owner dashboard is currently overcrowded. The sidebar lacks clear categorisation, making it hard to navigate. The goal of this refactor is to restructure the sidebar into clearly defined tabs, each with focused content, then propagate the same structural thinking to all other role dashboards.

---

## Owner Dashboard — New Sidebar Structure

### Tab 1 — Overview
**Route:** `/dashboard/owner`

High-level snapshot of the entire business. Should NOT be overcrowded — one clean screen with KPIs and summary cards.

**Data to show:**
- Total Students (physical + zoom + online platform)
- Total Revenue (this month)
- Total Members (active co-working members)
- Total Bookings (space bookings this month)
- KPI statistics / trend charts (revenue over time, student growth, etc.)

---

### Tab 2 — Students
**Route:** `/dashboard/owner/students`

Sub-categories (tabs or filters within the page):

| Sub-tab | Description |
|---|---|
| New Students | Recently enrolled / joined students |
| Current / Old Students | Physical class students (active and past) |
| Zoom / Virtual Class Students | Students attending online live classes |
| Online Platform Students | Self-registered students via the public platform |

---

### Tab 3 — Co-Working Members
**Route:** `/dashboard/owner/members`

All co-working space members. Membership status, expiry, subscription details.

---

### Tab 4 — Bookings
**Route:** `/dashboard/owner/bookings`

Space booking history — conference room, hot desks, etc. Full log with status and details.

---

### Tab 5 — Financials
**Route:** `/dashboard/owner/financials`

All financial data — revenue, expenses, net, breakdowns by category, trends.

---

### Tab 6 — Team
**Route:** `/dashboard/owner/team`

All staff members organised by role (Manager, Receptionist, Teacher, Content Team).

---

### Tab 7 — Profile
**Route:** `/dashboard/owner/profile`

Owner's own profile / account settings.

---

## Implementation Plan

### Phase 1 — Owner Dashboard
- [x] Restructure sidebar navigation to match the 7-tab layout above
- [x] Refactor Overview page — 4 hero KPI cards, revenue strip, trend chart, breakdown chart, people snapshot, recent payments
- [ ] Refactor Students page — sub-category labels aligned to spec (New / Current-Old / Zoom / Online Platform)
- [x] Members page confirmed correct — matches Tab 3 spec
- [x] Bookings page created — `/dashboard/owner/bookings` with KPI strip, status filters, space filter, search, expandable rows
- [x] Financials page confirmed correct — matches Tab 5 spec
- [x] Team page confirmed correct — matches Tab 6 spec
- [x] Profile page created — `/dashboard/owner/profile` with profile card, password change, space settings

### Phase 2 — Sync to Other Dashboards
- [ ] Reflect relevant structural changes in Manager dashboard
- [x] Reflect relevant structural changes in Receptionist dashboard — 4-card accordion UI, enrollment-period payment fix, Zoom/Virtual label, Next Due column
- [ ] Reflect relevant structural changes in Teacher dashboard
- [ ] Reflect relevant structural changes in Member dashboard
- [ ] Reflect relevant structural changes in Student dashboard
- [ ] Reflect relevant structural changes in Admin dashboard

---

## Notes & Decisions

- The `social_media` role has no dedicated dashboard yet (Phase 3 placeholder — currently aliased to Member portal). This refactor does not cover it.
- After Owner dashboard is confirmed correct, all other dashboards will be reviewed and synced to match the same structural logic relevant to their role.
- Each fix applied to the Owner dashboard must be documented here before replication to other dashboards.

---

## Issues Log

> Issues discovered during the refactor will be logged here as they are identified.

| # | Dashboard | Issue | Status |
|---|---|---|---|
| — | — | — | — |


We have just completed a database refactor on a Next.js + Supabase project. Here is the full context before you touch any code.

---

## DATABASE STRUCTURE (just migrated — source of truth)

### Table: student_registrations
Captures all staff-recorded student payments at registration.

Columns:
- id (uuid)
- student_type: 'new' | 'current_old' | 'zoom_virtual'
- customer_name (text, required)
- customer_phone (text, required)
- customer_email (text, optional)
- profile_id (uuid, FK → profiles, nullable)
- amount (integer, KES, required)
- method: 'cash' | 'mpesa' | 'bank_transfer' | 'both'
- reference (text, optional)
- notes (text, optional)
- recorded_by (uuid, FK → profiles, nullable)
- created_at (timestamptz)

View: v_student_registrations_this_month
→ Same as above but filtered to current calendar month (Africa/Nairobi timezone) + recorder full_name and role joined from profiles.

### Table: space_payments
Captures membership and space booking payments.

Columns:
- id (uuid)
- payment_type: 'membership' | 'space_booking'
- customer_name (text, required)
- customer_phone (text, required)
- customer_email (text, optional)
- profile_id (uuid, FK → profiles, nullable)
- booking_id (uuid, FK → bookings, nullable — set for space_booking payments)
- amount (integer, KES, required)
- method: 'cash' | 'mpesa' | 'bank_transfer' | 'both'
- reference (text, optional)
- notes (text, optional)
- recorded_by (uuid, FK → profiles, nullable)
- created_at (timestamptz)

View: v_space_payments_this_month
→ Same as above but filtered to current calendar month + recorder name/role + booking_date and booking_space_id joined from bookings.

### Table: student_flags
Receptionist flags a student registration for owner review.

Columns:
- id (uuid)
- registration_id (uuid, FK → student_registrations, CASCADE)
- flagged_by (uuid, FK → profiles, nullable)
- message (text, required)
- status: 'open' | 'resolved' (default 'open')
- resolved_by (uuid, FK → profiles, nullable)
- resolved_at (timestamptz)
- created_at (timestamptz)

### Existing untouched tables (do not modify):
- payments → M-Pesa STK Push payments for online students (self-registered via course page). These are automatic, no staff involvement.
- profiles → user accounts with role column
- bookings → space bookings (booking_date, start_time, end_time, space_id, status, visitor_name etc.)
- enrolments, courses, lessons, lesson_progress → course/learning data

---

## STUDENT CATEGORIES — IMPORTANT

There are 4 student types in the system:

1. New Students → student_type = 'new' in student_registrations (registered by staff, recently joined)
2. Current/Old Students → student_type = 'current_old' in student_registrations (were attending before the system was built, migrated in by staff)
3. Zoom/Virtual Students → student_type = 'zoom_virtual' in student_registrations (attend live online classes, registered by staff)
4. Online Students → these are NOT in student_registrations. They self-register through the public course page. Their payments flow automatically through the payments table and their profiles are created automatically. Staff do not register them.

---

## PAYMENT CATEGORIES

### Students (student_registrations)
- Staff registers the student and records the payment in one action
- student_type is set explicitly at registration time

### Members (space_payments where payment_type = 'membership')
- People who subscribe to the co-working space
- These are freelancers, remote workers etc. using the co-working facility
- Payment recorded by receptionist

### Space Bookings (space_payments where payment_type = 'space_booking')
- People who book specific facilities: Podcast Studio, Conference Room, Hot Desk etc.
- booking_id links to the bookings table
- Payment recorded by receptionist

---

## WHAT WE NEED YOU TO BUILD

Refactor the payments capture UI in the Receptionist dashboard. The current UI uses the old walk_in_payments table which no longer exists. Build a clean, simple, focused payments capture interface.

### Requirements:

1. THREE clearly separated sections in the UI (tabs or cards — keep it simple):
   - Students
   - Members
   - Bookings

2. Students section:
   - A form to register and record payment for a student
   - student_type selector: New Student | Current/Old Student | Zoom/Virtual Student (do NOT show Online Student here — those are automatic)
   - Fields: Full Name, Phone, Email (optional), Amount (KES), Payment Method, Reference (shown only if method is mpesa, bank_transfer, or both), Notes (optional)
   - On submit → POST to an API route that inserts into student_registrations via Supabase service role
   - After successful submission show the current month's student registrations pulled from v_student_registrations_this_month, grouped by student_type

3. Members section:
   - A form to record a membership payment
   - Fields: Full Name, Phone, Email (optional), Amount (KES), Payment Method, Reference (conditional), Notes (optional)
   - On submit → POST to API route that inserts into space_payments with payment_type = 'membership'
   - After successful submission show current month's membership payments from v_space_payments_this_month filtered to payment_type = 'membership'

4. Bookings section:
   - A form to record a space booking payment
   - Fields: Full Name, Phone, Email (optional), Booking (dropdown — fetch from bookings table, show visitor_name + space + booking_date for confirmed/active bookings), Amount (KES), Payment Method, Reference (conditional), Notes (optional)
   - On submit → POST to API route that inserts into space_payments with payment_type = 'space_booking' and the selected booking_id
   - After successful submission show current month's space booking payments from v_space_payments_this_month filtered to payment_type = 'space_booking'

5. All API routes must use the Supabase service role key (bypasses RLS) since inserts are staff-only server-side actions.

6. recorded_by must be set to the currently authenticated user's id on every insert.

7. UI style: match the existing dashboard style already in the codebase. Do not introduce new design systems or component libraries. Keep forms minimal and functional — this is an internal staff tool.

8. Do not touch:
   - The payments table or any online student flows
   - The enrolments or course pages
   - Any owner/manager/teacher dashboard pages
   - The bookings table itself (read only from it for the dropdown)

---

## TECH STACK
- Next.js App Router (TypeScript)
- Supabase (PostgreSQL + RLS)
- Service role used for all inserts via API routes
- Existing Supabase client: @/lib/supabase/server and @/lib/supabase/client
- Existing service client pattern: createClient from @supabase/supabase-js with SUPABASE_SERVICE_ROLE_KEY

Start by reading the existing receptionist dashboard files to understand the current structure before writing any new code.
