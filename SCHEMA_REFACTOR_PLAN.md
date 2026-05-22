# Ontime Academy — Schema Refactor Plan
**Status:** Draft · Not yet implemented  
**Purpose:** Document the mismatch between the current database schema and the simplified receptionist workflow, so a clean migration can be planned and executed without breaking the live system.

---

## 1. The Core Problem

The database was designed in an earlier phase when the receptionist dashboard handled a more complex workflow. Since then, the application has been significantly simplified, but **the database schema was never updated to match**. This causes two categories of bugs:

### A. Schema Cache / Table Recognition Failures
`walk_in_payments` is labelled "legacy" in project notes. PostgREST (the API layer Supabase uses) periodically caches table schemas. Because `walk_in_payments` has structural inconsistencies compared to how the app now uses it, PostgREST sometimes drops it from the cache, resulting in:
- `Could not find the table 'public.walk_in_payments' in the schema cache`
- Silent insert failures — booking is saved, payment record is lost
- API reads returning `null` instead of empty array, making all payment totals show KES 0

### B. Naming Confusion — "walk_in" Terminology
The original schema used the term "walk-in" to describe physical/in-person revenue. The receptionist portal now handles four distinct entity types with completely different shapes, but they are all being forced through one generic `walk_in_payments` table:

| What it actually is | What it's stored as | Problem |
|---|---|---|
| Student registration + fee | `walk_in_payments` type=`physical_class` | Later moved to `student_registrations` but references remain |
| Co-working membership payment | `walk_in_payments` type=`membership` | Queried by `profile_id`, not `booking_id` |
| Space/conference room booking payment | `walk_in_payments` type=`space_rental` | Queried by `booking_id`, causes join failures |
| Visitor/enquiry log | No table exists | Not persisted anywhere |

### C. Booking Table — Original Design vs Current Use
`bookings` was originally designed for **public website submissions** (guests booking online). The receptionist was never a first-class concept. The columns still reflect that old model:

| Original column | Original meaning | Now used for |
|---|---|---|
| `visitor_name` | Public guest name | Client name entered by receptionist |
| `visitor_phone` | Public guest phone | Client phone entered by receptionist |
| `status` (pending/confirmed/rejected/cancelled) | Public submission workflow | Simplified — receptionist only creates `confirmed` directly |
| `hours` CHECK (1 AND 9) | Assumed max 9 hours | Receptionists book 10–24 hour events (constraint was patched manually) |
| `end_time` | Was not in original schema | Added later — but `time` type includes seconds (HH:MM:SS), causing string comparison bugs |
| `booked_by` | Not in original schema | Added later to track which receptionist created it |

---

## 2. What the Receptionist Dashboard Actually Does Now

The receptionist portal is the **single point of entry** for all physical transactions at Ontime Academy. Everything they record should appear instantly and identically in the owner dashboard. One source of truth.

There are four things a receptionist records:

### 2.1 Student Registration
- A new student walks in and registers for a course
- Receptionist captures: name, phone, email (optional), student type, course name, fees, amount paid, payment method
- **Table used:** `student_registrations` ✅ (correctly moved from `walk_in_payments` in migration 017)
- **Owner sees:** full list in owner dashboard students section

### 2.2 Member Registration
- A person wants to use the co-working space monthly
- Receptionist captures: name, phone, email, profession, membership fee (KES 7,500), amount paid, method
- Creates: a Supabase auth account + `profiles` row + `members` row + payment record
- **Payment stored in:** `walk_in_payments` type=`membership`, linked by `profile_id` ⚠️
- **Issue:** `walk_in_payments` schema cache failures break member payment recording

### 2.3 Space / Conference Room Booking
- A client wants to book a space for a meeting, training, event, etc.
- Receptionist captures: client name, phone, space, date, start time, end time, cost, amount paid, method
- **Booking stored in:** `bookings` table ✅
- **Payment stored in:** `walk_in_payments` type=`space_rental`, linked by `booking_id` ⚠️
- **Issues:**
  - `walk_in_payments` schema cache failures — payment never saves
  - Time format stored as `HH:MM:SS` (PostgreSQL `time` type), form sends `HH:MM`, causes wrong conflict detection
  - `booked_by` column stores raw UUID — owner dashboard shows UUID not name
  - Conflict check uses string comparison on mixed-format times

### 2.4 Visitor / Enquiry Log
- Someone walks in asking for information, looking around, or inquiring about services
- Receptionist should log: name, phone, purpose of visit, notes
- **Current state:** No table exists. Not implemented. ❌

---

## 3. Current Table Map (Live Database)

```
profiles              — all users (students, members, staff, owner)
members               — co-working members (extends profiles)
spaces                — bookable rooms (Conference Room, Boardroom, etc.)
bookings              — space/room booking records
student_registrations — student walk-in registrations + fee records
walk_in_payments      — catch-all payment table (membership + space_rental)
student_flags         — receptionist flags for owner review
payments              — M-Pesa STK Push online payments (unrelated to receptionist)
courses, lessons, enrolments, progress — online academy (unrelated to receptionist)
invite_tokens, pending_registrations, password_reset_requests — team accounts
```

---

## 4. Problems That Need to Be Fixed in the Schema

### Problem 1: `walk_in_payments` — Split Into Purpose-Specific Tables

**Current state:** One generic table handles both membership payments (linked by `profile_id`) and space rental payments (linked by `booking_id`). The two use cases are fundamentally different but share a table, causing PostgREST join ambiguity and schema cache failures.

**Proposed fix:** Split into two clean tables:

```sql
-- For co-working membership payments
membership_payments (
  id, profile_id (FK → profiles), amount, method, reference,
  recorded_by, created_at
)

-- For space booking payments  
booking_payments (
  id, booking_id (FK → bookings), amount, method, reference,
  recorded_by, created_at
)
```

Both tables replace their respective use cases in `walk_in_payments`. The original `walk_in_payments` table can be kept read-only for historical records or dropped after data migration.

---

### Problem 2: `bookings` — Time Format Bug

**Current state:** PostgreSQL `time` type stores values as `HH:MM:SS`. The form sends `HH:MM`. String comparison in conflict detection (`start_time < bEnd`) breaks for back-to-back bookings because `"02:00" < "02:00:00"` evaluates as `true` in lexicographic comparison.

**Example of the bug:**
- Existing booking: `01:00:00` → `02:00:00`
- New booking: `02:00` → `03:00`
- Expected: No conflict (they are sequential, not overlapping)
- Actual: Conflict detected → user blocked from creating a valid booking

**Proposed fix options:**
1. Normalize all time comparisons to minutes-since-midnight integers before comparing (no schema change, code-only fix)
2. Change `start_time` and `end_time` columns to `text` type storing `HH:MM` only (schema migration required)
3. Cast times in SQL using `EXTRACT(EPOCH FROM start_time)` for comparisons (SQL-level fix)

**Recommended:** Option 1 (normalize in application code — safest, no migration risk)

---

### Problem 3: `bookings` — Missing `booked_by` Name Resolution

**Current state:** `booked_by` stores a raw UUID (the receptionist's `profiles.id`). The owner dashboard shows this UUID in the expanded row because it would need a PostgREST join on `profiles` using `bookings_booked_by_fkey`, which was also failing.

**Proposed fix:** The booking receipt page already solved this correctly — fetch the profile separately after fetching the booking, then merge in application code. The owner dashboard expanded row should do the same.

---

### Problem 4: `student_flags` — References `walk_in_payments` Not `student_registrations`

**Current state:**
```sql
-- 016_student_flags.sql (original)
payment_id  uuid  NOT NULL REFERENCES walk_in_payments(id) ON DELETE CASCADE
```

Migration 017 added `registration_id uuid REFERENCES student_registrations(id)` as an additional column, but the original `payment_id` FK still references `walk_in_payments`. This means:
- When flagging a student registration, the flag tries to link to a `walk_in_payments` row that may not exist
- For newer registrations (stored in `student_registrations`), `payment_id` is meaningless
- The `registration_id` column is there but the application uses the API endpoint `/api/receptionist/student-flags` which was built for the old schema

**Proposed fix:** Migrate `student_flags` to use only `registration_id` (drop `payment_id` requirement). The flag system for members and bookings should use separate identifier columns too.

---

### Problem 5: `walk_in_payments` — Missing INSERT RLS Policy

**Current state:**
```sql
-- 011_walk_in_payments.sql comment:
-- Inserts via service role only (API routes) — no direct client inserts
```

There is **no INSERT policy** on `walk_in_payments`. This is intentional — inserts should only come through API routes using the service role key, which bypasses RLS. This is correct design.

However, the problem is the schema cache failures prevent even the service role client from inserting. This is a PostgREST infrastructure issue, not an RLS issue. The fix is:
1. Run `NOTIFY pgrst, 'reload schema';` in the SQL editor to force a cache refresh
2. Long-term: replace `walk_in_payments` with purpose-specific tables (Problem 1 above)

---

### Problem 6: No Visitor / Enquiry Log Table

**Current state:** Receptionists have no way to log visitors who come in for information, tours, or enquiries. This is a business requirement — the owner wants to see visitor traffic.

**Proposed new table:**
```sql
visitor_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL,
  visitor_phone text,
  purpose      text,  -- 'enquiry', 'tour', 'pickup', 'other'
  notes        text,
  logged_by    uuid NOT NULL REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
)
```

---

## 5. What the Owner Dashboard Must Show (Source of Truth)

The owner and receptionist dashboards must read from the **exact same tables**. The receptionist writes, the owner reads. No duplication, no derived copies.

| Owner Section | Data Source | Receptionist Action That Creates It |
|---|---|---|
| Students | `student_registrations` | Register Student form |
| Members | `profiles` + `members` + `membership_payments` (proposed) | Register Member form |
| Bookings | `bookings` + `booking_payments` (proposed) | New Booking form |
| Walk-in / Visitors | `visitor_logs` (proposed) | Log Visitor form |
| Flags / Issues | `student_flags` (to be cleaned up) | Flag button on any record |

---

## 6. Migration Strategy (Recommended Execution Order)

> **Do not run these all at once. Each migration must be verified before the next.**

### Step 1 — Fix the immediate blocker (no code changes needed)
Run in Supabase SQL Editor:
```sql
NOTIFY pgrst, 'reload schema';
```
This fixes the `walk_in_payments` schema cache failure immediately. Payments will start saving correctly for bookings and memberships.

### Step 2 — Fix the booking time comparison bug (code only, no migration)
In `app/api/receptionist/bookings/route.ts`, convert times to minutes before comparing. No schema change required.

### Step 3 — Create `booking_payments` table
New clean table for space rental payments. Migrate existing `walk_in_payments` rows where `type = 'space_rental'` into it. Update all API routes to use the new table.

### Step 4 — Create `membership_payments` table
New clean table for membership payments. Migrate existing `walk_in_payments` rows where `type = 'membership'` into it. Update member registration and member receipt pages to use the new table.

### Step 5 — Create `visitor_logs` table
New table for visitor/enquiry tracking. Build the log visitor form in the receptionist portal. Add the visitor section to the owner dashboard.

### Step 6 — Clean up `student_flags`
Drop `payment_id` requirement. Make `registration_id` the primary reference. Add `booking_id` and `member_id` columns for flagging bookings and members separately.

### Step 7 — Deprecate `walk_in_payments`
Once all data is migrated and all API routes updated, rename `walk_in_payments` to `_legacy_walk_in_payments` (prefix with underscore to exclude from PostgREST). Keep for historical audit reference only.

---

## 7. Files That Will Need Code Changes (When Migration Executes)

| File | Change Needed |
|---|---|
| `app/api/receptionist/bookings/route.ts` | Fix time comparison (minutes), switch payment insert to `booking_payments` |
| `app/api/receptionist/bookings/[id]/route.ts` | Switch payment reads/inserts to `booking_payments` |
| `app/api/receptionist/register-member/route.ts` | Switch payment insert to `membership_payments` |
| `app/api/receptionist/record-member-payment/route.ts` | Switch to `membership_payments` |
| `app/dashboard/receptionist/booking-receipt/[id]/page.tsx` | Read from `booking_payments` via API |
| `app/dashboard/receptionist/member-receipt/[profile_id]/page.tsx` | Read from `membership_payments` |
| `app/dashboard/receptionist/members/page.tsx` | Data source for payment totals |
| `app/dashboard/owner/bookings/page.tsx` | Read from `booking_payments` |
| `app/dashboard/owner/_components/MemberExpandTable.tsx` | Read from `membership_payments` |
| `app/api/receptionist/student-flags/route.ts` | Support booking_id and member profile_id as flag targets |

---

## 8. Known Bugs Active Right Now (Pre-Migration)

| Bug | Cause | Temporary Fix | Permanent Fix |
|---|---|---|---|
| Booking payment not saved | `walk_in_payments` schema cache miss | `NOTIFY pgrst, 'reload schema'` | Replace with `booking_payments` table |
| All bookings show KES 0 paid | Same schema cache miss affects reads | Same reload | Same table replacement |
| Back-to-back bookings blocked | Time format HH:MM vs HH:MM:SS string comparison | Code fix in conflict check | Normalize to minutes |
| Receipt shows KES 0 paid | Was using browser Supabase client (RLS blocks) | Fixed — now uses API route with service role | Resolved in current code |
| Owner booking dashboard shows 0 bookings | `walk_in_payments(amount)` embedded join failed | Fixed — now uses separate query | Resolved in current code |
| Member receipt links were wrong | Linked to student_registrations instead of membership payments | Fixed — dedicated /member-receipt/ page | Resolved in current code |
| Flag table references wrong FK | `student_flags.payment_id` → `walk_in_payments` | Currently flags post to API without FK validation | Clean up in Step 6 |

---

## 9. Decisions Still Needed From the Owner

1. **Visitor log** — What fields should be captured? Name + phone is minimum. Should purpose of visit be a dropdown or free text? Should there be a follow-up flag?

2. **Membership fee** — Is KES 7,500 always fixed, or can receptionists enter a custom fee? Currently hard-coded in the member receipt page.

3. **Booking conflict detection** — Should back-to-back bookings be allowed (one ending at 2:00 PM, next starting at 2:00 PM)? Currently, a 30-minute gap between the existing bug and the fix being applied accidentally blocks them.

4. **Historical walk_in_payments data** — Some older payment records exist in `walk_in_payments`. Should these be migrated to the new tables or kept as-is for audit purposes?

5. **Delete permissions** — Currently only owner/admin can delete bookings and member subscriptions. Should managers also be able to delete?
