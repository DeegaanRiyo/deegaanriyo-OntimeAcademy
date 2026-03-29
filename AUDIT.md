# Ontime Academy & Co-Working Space
## Project Build Audit Log

**Project:** Ontime Academy & Co-Working Space
**Agreement No:** DGR-2026-005
**Developer:** Deegaan-Riyo Digital Solutions
**Representative:** Abdifatah Hajifarah
**Client:** Ontime Co-Working Space (CWS)
**Stack:** Next.js 14 + Supabase + Vercel
**Build Started:** Thursday, March 12, 2026

---

## Legend
- ✅ Complete & confirmed working
- 🔄 In progress
- ⏳ Pending
- ❌ Blocked

---

## PHASE 1 — Website + Dashboard

---

### STEP 1 — Project Initialization
**Date:** Thu Mar 12, 2026 — ~14:00 EAST
**Status:** ✅ Complete

#### What was done:
- Initialized Next.js 14 (App Router + TypeScript + Tailwind CSS)
- Installed packages: `@supabase/supabase-js`, `@supabase/ssr`, `react-hook-form`, `@hookform/resolvers`, `zod`, `zustand`
- Built full folder structure:
  - `app/(public)/` — all public routes
  - `app/(auth)/` — login, signup, invite, reset-password
  - `app/dashboard/` — owner, admin, teacher, student, member dashboards
  - `app/api/payments/mpesa/` — Daraja API routes (Phase 2)
  - `components/layout/`, `components/public/`, `components/dashboard/`, `components/elearning/`, `components/payment/`, `components/ui/`
  - `lib/supabase/` — browser + server clients
  - `types/index.ts` — all TypeScript types
  - `supabase/migrations/` — SQL migration files
  - `supabase/seeds/` — seed data files
- Configured Tailwind with full brand design system (teal palette, Poppins font)
- Built `globals.css` — utility classes: `.btn-primary`, `.btn-outline`, `.card`, `.form-input`, `.eyebrow`, `.badge-open`, `.badge-occupied`
- Created `middleware.ts` — session refresh + `/dashboard/*` route protection
- Created `.env.local` template

#### Files created:
- `app/layout.tsx`
- `app/page.tsx`
- `middleware.ts`
- `tailwind.config.ts`
- `app/globals.css`
- `types/index.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `.env.local`

---

### STEP 2 — Environment Credentials
**Date:** Thu Mar 12, 2026 — ~14:30 EAST
**Status:** ✅ Complete

#### What was done:
- Filled `.env.local` with client's Supabase credentials:
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public anon key
  - `SUPABASE_SERVICE_ROLE_KEY` — Server-side service role key (bypasses RLS)
  - `NEXT_PUBLIC_WHATSAPP_NUMBER` — 254746628668
  - `NEXT_PUBLIC_SITE_URL` — http://localhost:3000

#### Supabase Project:
- Project URL: `https://jwjjccfowatsbkjmgcxw.supabase.co`
- Auth: Email + Password (configured)

---

### STEP 3 — Landing Page (Home `/`)
**Date:** Thu Mar 12, 2026 — ~15:00 EAST
**Status:** ✅ Complete

#### What was built:
Full public landing page with all sections, branded correctly as "Ontime Academy & Co-Working Space".

| Section | Component | Description |
|---------|-----------|-------------|
| Navbar | `Navbar.tsx` | Fixed, two-line logo, scroll shadow, mobile hamburger, Log In + Book CTA |
| Hero | `HeroSection.tsx` | Headline "Learn. Create. Collaborate.", dual-wing badges, interactive booking card (space selector, duration picker, live price calc, WhatsApp CTA) |
| Stats | `StatsSection.tsx` | 500+ Co-Working Members, 4 Spaces, 20+ Academy Courses, 98% Satisfaction |
| About | `AboutSection.tsx` | Two-wing breakdown cards (Academy + Co-Working), feature list |
| Spaces Preview | `SpacesPreview.tsx` | All 4 space cards with availability badge, teal hover animation, live Supabase data |
| How to Book | `HowToBook.tsx` | 4-step flow with dashed connector line |
| Courses Preview | `CoursesPreview.tsx` | 4 course teasers (Academy section), Academy CTA strip |
| Membership Teaser | `MembershipTeaser.tsx` | KES 7,500/mo pricing, feature list, member count badge on image |
| CTA | `CTASection.tsx` | Full teal section, WhatsApp + Explore Academy buttons, contact info |
| Footer | `Footer.tsx` | Two-line logo, nav links, socials, copyright |

#### Files created:
- `app/page.tsx` (home page — server component, fetches spaces)
- `app/(public)/layout.tsx`
- `components/layout/Navbar.tsx`
- `components/layout/Footer.tsx`
- `components/public/HeroSection.tsx`
- `components/public/StatsSection.tsx`
- `components/public/AboutSection.tsx`
- `components/public/SpacesPreview.tsx`
- `components/public/HowToBook.tsx`
- `components/public/CoursesPreview.tsx`
- `components/public/MembershipTeaser.tsx`
- `components/public/CTASection.tsx`

#### Confirmed working:
- `npm run dev` → `http://localhost:3000` → **HTTP 200 OK** ✅
- No TypeScript or compilation errors ✅
- All sections render correctly ✅

---

### STEP 4 — Database: Spaces Table
**Date:** Thu Mar 12, 2026 — ~15:30 EAST
**Status:** ✅ Complete

#### Migration file:
`supabase/migrations/001_spaces.sql`

#### What was created in Supabase:
- Table: `spaces`
- RLS enabled ✅
- Policy: `spaces_public_read` — allows unauthenticated visitors to read spaces ✅

#### Seeded data (confirmed by client):
| id | name | slug | hourly_rate | is_available |
|----|------|------|-------------|--------------|
| 8c867207 | Boardroom | boardroom | 1000 | true |
| 7db023b1 | Conference Room | conference-room | 0 | true |
| 6ef61c5c | Podcast Studio | podcast-studio | 0 | true |
| 19a6f8e0 | Content Studio | content-studio | 0 | true |

> **Note:** Conference Room, Podcast Studio, and Content Studio rates are set to 0 (TBC). Client to confirm rates — Owner can update via `/dashboard/owner/settings` once built.

#### Supabase connection confirmed:
- `SpacesPreview` fetches live space data ✅
- `HeroSection` receives live spaces as props from server ✅
- Spaces with `hourly_rate = 0` display "Enquire for pricing" gracefully ✅
- Fallback static data in place if Supabase is unreachable ✅

---

### STEP 5 — Spaces Pages ✅
**Status:** ✅ Complete

- `app/(public)/spaces/page.tsx` — listing page, all 4 spaces
- `app/(public)/spaces/[slug]/page.tsx` — detail page: photo gallery, description, booking form, WhatsApp CTA
- `components/public/booking/BookingForm.tsx` — client booking form with live cost calc
- SQL: `002_bookings.sql` — `bookings` table ✅ ran

---

### STEP 6 — Courses Pages ✅
**Status:** ✅ Complete

- `app/(public)/courses/page.tsx` — listing: 6 static courses, category + level filters, instructor CTA strip
- `app/(public)/courses/[slug]/page.tsx` — detail: hero, enrol card (WhatsApp), outcomes, curriculum, instructor card
- Phase 1: static data. Phase 2 replaces with live Supabase + enrolment flow

---

### STEP 7 — Member Directory ✅
**Status:** ✅ Complete

- `app/(public)/members/page.tsx` — live Supabase fetch, card grid, empty state, membership CTA
- `app/(public)/members/[slug]/page.tsx` — public profile: avatar, bio, profession, social links, connect via WhatsApp
- SQL: `003_profiles_members.sql` — `profiles` + `members` tables ✅ ran

---

### STEP 8 — Static Public Pages ✅
**Status:** ✅ Complete

- `app/(public)/about/page.tsx` — Our Story, Mission two-wings, Values grid, CTA
- `app/(public)/faq/page.tsx` — 3 categories (Co-Working, Academy, Membership), WhatsApp CTA
- `app/(public)/contact/page.tsx` — WhatsApp + email cards, social links, booking + academy enquiry panels
- `app/(public)/blog/page.tsx` — hero + coming soon placeholder with WhatsApp CTA

---

### STEP 9 — Authentication ✅
**Status:** ✅ Complete

- `app/(auth)/login/page.tsx` — email/password login → /dashboard (role redirect)
- `app/(auth)/signup/page.tsx` — student self-registration, email confirmation flow
- `app/(auth)/reset-password/page.tsx` — request link + update password (PASSWORD_RECOVERY event)
- `app/(auth)/invite/[token]/page.tsx` — invite landing: set name + password → /dashboard/member
- `app/auth/callback/route.ts` — exchanges Supabase auth codes (invite, recovery, signup)
- `app/dashboard/page.tsx` — reads profile.role → redirects to correct dashboard
- `middleware.ts` — blocks /signup for authenticated users

---

### STEP 10 — Owner Dashboard ✅
**Date:** Thu Mar 12, 2026
**Status:** ✅ Complete

#### What was built:
- `/dashboard/owner` — financial overview: 4 stat cards (revenue, bookings, active members, all-time confirmed), bookings table with status badges
- `/dashboard/owner/accounts` — team accounts table (owner/admin/teacher), Invite Admin/Teacher modal form
- `/dashboard/owner/settings` — per-space cards with hourly rate input + availability toggle, saves via PATCH API
- `app/api/spaces/[id]/route.ts` — PATCH endpoint for space rate + availability (owner-only, verified server-side)
- `app/api/auth/invite/route.ts` — POST endpoint to send Supabase invite email (owner-only)
- `components/dashboard/SignOutButton.tsx` — client sign-out button
- `components/dashboard/InviteForm.tsx` — inline invite form with role selector
- `components/dashboard/SpaceSettingsForm.tsx` — space rate + availability form
- `app/dashboard/page.tsx` — role-based redirect (owner → /dashboard/owner, etc.)
- Fixed pre-existing TypeScript errors: Space type, members pages, BookingForm zodResolver

#### Confirmed:
- `npx tsc --noEmit` → zero errors ✅

---

### STEP 11 — Admin Dashboard ✅
**Date:** Thu Mar 12, 2026
**Status:** ✅ Complete

#### What was built:
| File | Description |
|------|-------------|
| `app/dashboard/admin/layout.tsx` | Sidebar layout, role guard (admin only) |
| `app/dashboard/admin/page.tsx` | Overview: 4 stat cards + 3 quick-action links |
| `app/dashboard/admin/spaces/page.tsx` | Space availability + rate (reuses SpaceSettingsForm) |
| `app/dashboard/admin/members/page.tsx` | Member list, subscription colour-coding, status badges |
| `app/dashboard/admin/members/new/page.tsx` | Create member form → POST /api/admin/members |
| `app/dashboard/admin/members/[id]/page.tsx` | View member, renders EditMemberForm |
| `app/dashboard/admin/members/[id]/EditMemberForm.tsx` | Client form: edit profile + subscription + is_active toggle |
| `app/dashboard/admin/bookings/page.tsx` | Server fetch → passes to BookingsClient |
| `components/dashboard/admin/BookingsClient.tsx` | Client: filter tabs, confirm/reject with optimistic updates |
| `app/api/admin/members/route.ts` | POST: invite + create profile + member row |
| `app/api/admin/members/[id]/route.ts` | GET + PATCH: fetch/update member + profile |
| `app/api/admin/bookings/[id]/route.ts` | PATCH: confirm or reject booking (admin/owner only) |

#### Confirmed:
- `npx tsc --noEmit` → zero errors ✅

---

### STEP 12 — Member Dashboard ✅
**Date:** Thu Mar 12, 2026
**Status:** ✅ Complete

#### What was built:
| File | Description |
|------|-------------|
| `app/dashboard/member/layout.tsx` | Sidebar layout, role guard (member only) |
| `app/dashboard/member/page.tsx` | Home: greeting, subscription card (active/expiring/expired states), quick links, directory teaser |
| `app/dashboard/member/profile/page.tsx` | Server shell: fetches profile + member, renders EditProfileForm + sidebar info cards |
| `components/dashboard/member/EditProfileForm.tsx` | Client form: personal info, bio (char counter), social links, is_public toggle |
| `app/api/member/profile/route.ts` | PATCH: member updates own profile + member record |

#### Confirmed:
- `npx tsc --noEmit` → zero errors ✅

---

### STEP 13 — Full UI Design Migration ✅
**Date:** Mon Mar 16, 2026
**Status:** ✅ Complete

Complete 1:1 migration of the `ontime-ultimate (2).html` and `ontime-dashboard (2).html` UI designs into the Next.js app. Every CSS class, animation, and JavaScript interaction ported exactly.

#### Design system:
- **Fonts:** Fraunces (serif, headings) + Plus Jakarta Sans (sans, body) via Google Fonts
- **Palette:** Dark (`#060d0e`, `#0b1617`, `#111e1f`), Teal (`#0a7c82`, `#0fb3bb`), Gold (`#c9921a`, `#f0b832`)
- **CSS:** Full design system in `app/globals.css` (~900 lines) — all original class names preserved
- **Scripts:** GSAP 3.12.2 + ScrollTrigger + Three.js r128 loaded via CDN `beforeInteractive`

#### Landing page (`app/page.tsx`):
| Section | Description |
|---------|-------------|
| Preloader | Animated loading bar with line sweep + percentage counter |
| Custom cursor | Dot + ring cursor with xl/text-mode hover states |
| Navbar | Dark fixed nav, text scramble effect, mobile drawer |
| Hero | 5-slide slideshow, 3D video card with tilt, floating badges, particle dots |
| Marquee x2 | Infinite scroll marquees (spaces + services) |
| Stats | Animated counters (ease-out quartic via IntersectionObserver) |
| About | Two-column reveal with image clip animation |
| Spaces | Live Supabase data, 3D card tilt on hover |
| Studio | Deep-dive section with horizontal scroll gallery |
| Globe | Three.js r128 interactive 3D globe with city dots + arcs |
| Courses | 3-tab panel (Online / Physical / Hybrid), course cards |
| Booking Steps | 4-step flow with GSAP number reveal |
| Calculator | Live KES pricing calculator with range input |
| Testimonials | Quote cards with star ratings |
| CTA | Full-width dark section with WhatsApp button |
| Footer | 4-column dark footer |

#### Client component (`components/public/HomeAnimations.tsx`):
All JavaScript ported: preloader, cursor, slideshow, scroll reveal, counters, parallax, 3D tilts, magnetic buttons, floating particles, scroll progress bar, GSAP animations, Three.js globe, calculator, course tabs, text scramble, sparkles, smooth scroll, cleanup.

#### Auth pages (dark design):
| File | Description |
|------|-------------|
| `app/(auth)/layout.tsx` | Dark full-screen wrapper with animated mesh + grid lines |
| `app/(auth)/login/page.tsx` | Dark `login-box` with corner accents, teal gradient button, show/hide password |
| `app/(auth)/signup/page.tsx` | Same dark design, student branding |
| `app/(auth)/reset-password/page.tsx` | Same dark design, request + update flows |

#### Dashboard layouts (all 5 roles):
All layouts use the exact sidebar/topbar from `ontime-dashboard (2).html`:
- Fixed sidebar: `.sb-logo`, `.sb-nav`, `.sb-section`, `.sb-item`, `.sb-avatar`, `.sb-profile`
- Sticky topbar: `.topbar`, `.tb-search`, `.tb-btn`
- Roles: Admin, Owner, Member, Teacher (new), Student (new)

#### Dashboard pages (dark design system):
| File | Design classes used |
|------|---------------------|
| `admin/page.tsx` | `.kpi-grid` × 4 KPI cards + quick actions `.card` |
| `admin/members/page.tsx` | Summary strip + `.tbl-wrap` table, `.badge`, `.act-btn` |
| `admin/bookings/page.tsx` | `.sec-head` wrapper |
| `admin/spaces/page.tsx` | `.grid-2` + SpaceSettingsForm |
| `owner/page.tsx` | `.kpi-grid` × 4 + `.tbl-wrap` bookings |
| `owner/accounts/page.tsx` | `.tbl-wrap` with role badges |
| `owner/settings/page.tsx` | `.grid-2` + SpaceSettingsForm |
| `member/page.tsx` | Membership `.card` (active/expired/pending), `.grid-3` quick links |
| `BookingsClient.tsx` | `.pill-tab`, `.tbl-wrap`, `.badge`, `.act-btn`/`.act-btn.del` |
| `SpaceSettingsForm.tsx` | `.card`/`.card-head`, `.badge.gr`/`.badge.rd`, `.form-input` |

#### Bug fixed:
- Duplicate `id` attribute on `<section>` in `app/page.tsx` (TypeScript error)
- `onClick` event handler on server component slideshow dots → extracted to `components/public/SlideDots.tsx` (client component)

#### Build confirmed:
- `npm run build` → ✅ compiled successfully, zero errors

---

## PHASE 2 — E-Learning + Payments

---

### STEP 14 — M-Pesa Daraja Sandbox Integration ✅
**Date:** Tue Mar 17, 2026
**Status:** ✅ Complete

#### Architecture:
Course enrolment is the only paid feature. The payment flow:
1. Student clicks "Pay with M-Pesa" on the course detail page
2. Enters phone number → front-end calls `POST /api/payments/mpesa/initiate`
3. Server initiates STK Push via Daraja API → Safaricom sends prompt to student's phone
4. Student enters M-Pesa PIN → Daraja calls `POST /api/payments/mpesa/callback`
5. Callback updates payment → paid, then upserts enrolment
6. Front-end polls `GET /api/payments/mpesa/status?id=...` every 3 s → on paid → redirect to course player

#### Database (`009_payments.sql`) — ⏳ Run in Supabase before going live:
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `student_id` | uuid FK → profiles | |
| `course_id` | uuid FK → courses | |
| `amount` | integer | KES, no decimals |
| `phone` | text | 254XXXXXXXXX format |
| `merchant_request_id` | text | from Daraja |
| `checkout_request_id` | text UNIQUE | used for polling |
| `mpesa_receipt_number` | text | filled on success |
| `status` | text | pending / paid / failed / cancelled |
| `failure_reason` | text | from Daraja on failure |

#### Files created:
| File | Description |
|------|-------------|
| `supabase/migrations/009_payments.sql` | payments table + RLS |
| `lib/daraja.ts` | `formatPhone`, `initiateSTKPush` helpers |
| `app/api/payments/mpesa/initiate/route.ts` | POST — triggers STK Push, creates pending payment |
| `app/api/payments/mpesa/callback/route.ts` | POST — Daraja webhook → marks paid + creates enrolment |
| `app/api/payments/mpesa/status/route.ts` | GET `?id=checkoutRequestId` — front-end polling |
| `components/public/MpesaEnrolButton.tsx` | Client component: phone input → STK push → polling → redirect |

#### Files modified:
| File | Change |
|------|--------|
| `app/(public)/courses/[slug]/page.tsx` | Dynamic: fetches from Supabase first (by slug), falls back to static. Shows MpesaEnrolButton when course is in DB, WhatsApp button when static-only |
| `app/api/student/enrol/route.ts` | Payment gate: paid courses now require a verified payment record before direct enrolment is allowed |

#### Daraja configuration:
- Sandbox base: `https://sandbox.safaricom.co.ke`
- Switching to production = change one line in `lib/daraja.ts` (DARAJA_BASE)
- Sandbox shortcode: `174379`
- Sandbox passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

#### Environment variables to fill in `.env.local` and Vercel:
| Variable | Where to get |
|----------|-------------|
| `DARAJA_CONSUMER_KEY` | developer.safaricom.co.ke → My Apps → Sandbox |
| `DARAJA_CONSUMER_SECRET` | same |
| `DARAJA_SHORTCODE` | 174379 (sandbox) |
| `DARAJA_PASSKEY` | bfb279f9… (sandbox, see .env.local) |
| `DARAJA_CALLBACK_URL` | `https://your-vercel-domain.vercel.app/api/payments/mpesa/callback` |

#### Confirmed:
- `npx tsc --noEmit` → zero errors ✅

---

### STEP 15 — Teacher Dashboard ✅
**Date:** Mon Mar 16, 2026
**Status:** ✅ Complete

#### Database migrations:
| File | Tables |
|------|--------|
| `supabase/migrations/004_courses_lessons.sql` | `courses`, `lessons`, `quizzes` — full RLS |
| `supabase/migrations/005_enrolments_progress.sql` | `enrolments`, `lesson_progress`, `quiz_attempts` — full RLS |

#### API routes:
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/teacher/courses` | GET, POST | List teacher's courses; create course (auto-slug) |
| `/api/teacher/courses/[id]` | GET, PATCH, DELETE | Fetch/update/delete course (teacher_id guard) |
| `/api/teacher/courses/[id]/lessons` | GET, POST | List lessons; add lesson (auto order_index) |
| `/api/teacher/lessons/[id]` | PATCH, DELETE | Update/delete lesson |
| `/api/teacher/lessons/[id]/quiz` | GET, POST, DELETE | Fetch/upsert/delete quiz (one per lesson) |

#### Pages & components:
| File | Description |
|------|-------------|
| `app/dashboard/teacher/layout.tsx` | Dark sidebar layout, role guard (teacher only) |
| `app/dashboard/teacher/page.tsx` | Overview: KPI grid (total courses, published, enrolled students) + quick actions |
| `app/dashboard/teacher/courses/page.tsx` | Course table: mode badge, price, lesson count, published status, edit link |
| `app/dashboard/teacher/courses/new/page.tsx` | Auth-guarded shell → `CreateCourseForm` |
| `app/dashboard/teacher/courses/[id]/page.tsx` | Fetches course + lessons + quizzes + enrolment count → `CourseEditor` |
| `components/dashboard/teacher/CreateCourseForm.tsx` | Client form: title, description, mode, price, thumbnail URL |
| `components/dashboard/teacher/CourseEditor.tsx` | Full editor: editable details, publish toggle, lesson list, `AddLessonForm`, `QuizEditor` (MCQ builder) |

#### Features:
- Course publish/unpublish toggle (live PATCH)
- Inline lesson add with Vimeo URL
- Per-lesson MCQ quiz builder (radio for correct answer, one quiz per lesson)
- Delete lesson with confirmation
- Enrolment count displayed on course editor

---

### STEP 16 — Student Dashboard ✅
**Date:** Mon Mar 16, 2026
**Status:** ✅ Complete

#### API routes:
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/student/enrol` | GET, POST | List enrolments; upsert enrolment (published courses only) |
| `/api/student/progress/[lessonId]` | GET, POST | Fetch lesson progress; mark complete + optional quiz answer |
| `/api/student/profile` | PATCH | Update student's own full_name + avatar_url |

#### Pages & components:
| File | Description |
|------|-------------|
| `app/dashboard/student/layout.tsx` | Dark sidebar layout, role guard (student only) |
| `app/dashboard/student/page.tsx` | Overview: Enrolled Courses + Lessons Completed KPIs; recent courses list |
| `app/dashboard/student/courses/page.tsx` | Course grid with thumbnail, mode badge, per-course progress bar |
| `app/dashboard/student/courses/[id]/page.tsx` | Auth + enrolment guard, fetches course + progress + quiz attempts → `CoursePlayer` |
| `app/dashboard/student/profile/page.tsx` | Auth-guarded shell → `StudentProfileForm` |
| `components/dashboard/student/CoursePlayer.tsx` | Full player: Vimeo iframe embed, lesson sidebar (check marks), mark-complete button, MCQ quiz with live correct/incorrect feedback, previous/next navigation |
| `components/dashboard/student/StudentProfileForm.tsx` | Client form: full name, avatar URL, read-only email |

#### Features:
- Vimeo ID extracted from any Vimeo URL format (`/video/ID`, `/ID`)
- Per-lesson progress tracked in `lesson_progress` table
- `last_accessed_at` updated on lesson completion
- Quiz submission stored in `quiz_attempts` (upsert — one attempt per quiz)
- Correct answer revealed after submission with colour feedback
- Course completion shown with green "Completed" badge
- Previous/Next lesson navigation; "Finish Course" button on last lesson

---

### STEP 17 — Subscription Automation ✅
**Date:** Tue Mar 17, 2026
**Status:** ✅ Complete

#### What was built:

**Vercel Cron:**
- `vercel.json` — cron schedule `0 5 * * *` (5:00 AM UTC = 8:00 AM EAT daily)
- Route: `GET /api/cron/subscription-check`
- Secured with `Authorization: Bearer {CRON_SECRET}` — any other caller gets 401

**Email system (`lib/email.ts`):**
- Resend SDK initialized with `RESEND_API_KEY`
- `FROM`: `Ontime CWS <no-reply@ontimecws.co.ke>`
- Branded dark-theme HTML wrapper (matches dashboard design system)
- `sendFiveDayReminder(to, name, expiryDate)` — 5-day warning email
- `sendOneDayReminder(to, name, expiryDate)` — urgent 1-day warning email
- `sendExpiredNotice(to, name)` — expiry/deactivation notice
- All emails include WhatsApp renewal CTA link

**Cron handler (`app/api/cron/subscription-check/route.ts`):**
- Fetches all `members` where `is_active = true` and `subscription_end` is not null
- Joins `profiles` (inner join) for `full_name` and `email`
- Per-member logic:
  - `expiry === today + 5 days` → sendFiveDayReminder
  - `expiry === today + 1 day` → sendOneDayReminder
  - `expiry < today` → set `members.is_active = false` + sendExpiredNotice
- Note: does NOT touch `profiles.is_active` — expired members still log in and see the expired dashboard state with WhatsApp renewal CTA
- Returns `{ success, date, reminders_5day, reminders_1day, deactivated, errors[] }`

#### Files created:
- `vercel.json`
- `lib/email.ts`
- `app/api/cron/subscription-check/route.ts`

#### Environment variables added to `.env.local`:
- `RESEND_API_KEY` — obtain from resend.com dashboard
- `CRON_SECRET` — generate with `openssl rand -base64 32`; must also be set in Vercel dashboard

#### Confirmed:
- `npx tsc --noEmit` → zero errors ✅

---

### STEP 18 — Team Account Management System ✅
**Date:** Tue Mar 17, 2026
**Status:** ✅ Complete

#### Architecture:
| Role | Created by | Method |
|------|-----------|--------|
| Owner | Developer | Directly in Supabase (one-time) |
| Manager | Owner | Username + password in Owner Dashboard |
| Receptionist | Owner | Username + password in Owner Dashboard |
| Teacher | Manager | One-time invite link → signup form → Manager approves |
| Social Media | Manager | One-time invite link → signup form → Manager approves |
| Member (staff) | Manager | One-time invite link → signup form → Manager approves |
| Student | Self | Self-registers, automated (separate flow) |

#### Database (008_team_accounts.sql) — ✅ Ran — Tue Mar 17, 2026:
| Change | Detail |
|--------|--------|
| `profiles.username` | Unique — staff login identifier |
| `profiles.is_active` | Soft deactivation; middleware blocks inactive users instantly |
| `profiles.role` | Expanded: added `manager`, `receptionist`, `social_media` |
| `invite_tokens` | One-time links (7-day expiry, single-use, role-locked) |
| `pending_registrations` | Signup form submissions held until Manager approves |
| `password_reset_requests` | Forgot-password requests routed to Manager queue |

#### Login system updates:
| File | Change |
|------|--------|
| `app/(auth)/login/page.tsx` | Accepts username OR email; converts username → `username@ontimecws.app` |
| `middleware.ts` | Checks `user_metadata.is_active`; deactivated users signed out → `/login?deactivated=1` |
| `types/index.ts` | UserRole expanded with `manager`, `receptionist`, `social_media` |
| `app/dashboard/page.tsx` | Role redirect map updated for all new roles |

#### Owner Team pages:
| File | Description |
|------|-------------|
| `app/dashboard/owner/team/page.tsx` | List all Manager + Receptionist accounts with stats strip |
| `app/dashboard/owner/team/new/page.tsx` | Create account form → credentials card (copy username + password) |
| `app/dashboard/owner/team/[id]/page.tsx` | Profile view |
| `app/dashboard/owner/team/[id]/ProfileActions.tsx` | Change password, activate/deactivate, delete with confirmation modal |

#### Manager Dashboard:
| File | Description |
|------|-------------|
| `app/dashboard/manager/layout.tsx` | Sidebar with live pending count badges on Approvals + Pwd Requests |
| `app/dashboard/manager/page.tsx` | KPI overview + quick actions + recent pending signups table |
| `app/dashboard/manager/team/page.tsx` | List all Teacher / Social Media / Member accounts |
| `app/dashboard/manager/team/[id]/page.tsx` | Profile view + ProfileActions |
| `app/dashboard/manager/invite/page.tsx` | Generate one-time invite token → copy link + how-it-works card |
| `app/dashboard/manager/approvals/page.tsx` | Pending/Approved/Rejected tabs — approve creates auth account |
| `app/dashboard/manager/password-requests/page.tsx` | Pending/Approved/Rejected tabs — approve sends reset email |

#### Public pages:
| File | Description |
|------|-------------|
| `app/(auth)/register/page.tsx` | Token-validated signup form — 3 states: loading / invalid / form |
| `app/(auth)/forgot-password/page.tsx` | Username-based password reset request → Manager queue |

#### API routes:
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/create-user` | POST | Owner creates Manager/Receptionist (username + password) |
| `/api/admin/delete-user` | DELETE | Owner/Manager deletes staff account (scoped by role) |
| `/api/admin/toggle-user` | PATCH | Activate/deactivate + syncs JWT metadata for middleware |
| `/api/admin/change-password` | PATCH | Owner/Manager changes staff password |
| `/api/manager/invite` | POST/DELETE | Generate or revoke invite token |
| `/api/manager/approvals` | GET | List pending_registrations by status |
| `/api/manager/approvals/[id]` | PATCH | Approve (creates auth user) or reject |
| `/api/manager/password-requests` | GET | List password_reset_requests by status |
| `/api/manager/password-requests/[id]` | PATCH | Approve (sends Supabase recovery email) or reject |
| `/api/register/validate` | GET | Validate invite token, return role + note |
| `/api/register` | POST | Submit signup form, burn token, create pending_registration |
| `/api/forgot-password` | POST | Create password_reset_request in Manager queue |

#### Confirmed:
- `npx tsc --noEmit` → zero errors ✅

---

### STEP 19 — RLS Bug Fix: Service Role Client for Profile Checks ✅
**Date:** Tue Mar 17, 2026
**Status:** ✅ Complete

#### Bug:
All dashboard layouts and the `/api/admin/create-user` route were querying the `profiles` table using the anon Supabase client. RLS blocked these reads, returning `null`. Since `null !== "owner"` (etc.) evaluates to `true`, every role guard redirected back to `/dashboard` — causing an infinite redirect loop for all dashboard roles, and a 403 Forbidden on owner account creation.

#### Root cause:
The session check (`getUser()`) correctly uses the anon client, but the subsequent `profiles` role lookup must bypass RLS using the service role client.

#### Files fixed:
| File | Change |
|------|--------|
| `app/dashboard/owner/layout.tsx` | Profile query → service role client |
| `app/dashboard/manager/layout.tsx` | Profile query → service role client |
| `app/dashboard/admin/layout.tsx` | Profile query → service role client |
| `app/dashboard/teacher/layout.tsx` | Profile query → service role client |
| `app/dashboard/student/layout.tsx` | Profile query → service role client |
| `app/dashboard/member/layout.tsx` | Profile query → service role client |
| `app/api/admin/create-user/route.ts` | Profile role check → service role client; duplicate `adminClient` declaration removed |

#### Pattern applied (all files):
- `createClient()` (anon) — used only for `getUser()` session verification
- `createServiceClient()` (service role) — used for all `profiles` table queries

#### Confirmed:
- Dashboard redirect loop resolved ✅
- Owner → `/api/admin/create-user` 403 resolved ✅

---

### STEP 20 — Trigger search_path Fix + create-user Client Fix ✅
**Date:** Tue Mar 17, 2026
**Status:** ✅ Complete

#### Bug:
`POST /api/admin/create-user` returned 400 — "Database error creating new user" — when the owner tried to create a Manager account. Root cause was two separate issues:

**Issue A — Wrong Supabase client for admin operations:**
The `createServiceClient()` helper used `createServerClient` from `@supabase/ssr` (designed for cookie-based sessions). `auth.admin.createUser()` requires the plain `createClient` from `@supabase/supabase-js`. Replaced with the correct client.

**Issue B — Trigger missing `SET search_path`:**
When GoTrue's admin API creates a user, it calls the `on_auth_user_created` trigger in a context where `public` may not be in the search path. The trigger used an unqualified `INSERT INTO profiles` — GoTrue couldn't resolve the table, causing the DB error.

#### Fix A — `app/api/admin/create-user/route.ts`:
- Replaced `createServerClient` (from `@supabase/ssr`) with `createClient` (from `@supabase/supabase-js`) for the service role client factory
- Moved `adminClient` construction before the profile role check (service role used for all DB queries; anon client kept for `getUser()` only)

#### Fix B — Supabase SQL Editor (applied live):
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE((NEW.raw_user_meta_data->>'is_active')::boolean, true)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```
Changes: fully qualified `public.profiles`, pinned `SET search_path = public`.

#### Confirmed:
- `POST /api/admin/create-user` → 200 OK ✅
- Manager account created successfully ✅

---

### STEP 21 — Teacher Dashboard: DB Fixes + YouTube Integration ✅
**Date:** Tue Mar 17, 2026
**Status:** ✅ Complete

#### Problems fixed:

**A — Missing courses table columns (manual table, no migration):**
The `courses` table was created manually in Supabase without the migration file, so it was missing nearly all columns. Applied directly in SQL Editor:
```sql
ALTER TABLE courses ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'online' CHECK (mode IN ('online','physical','hybrid'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price integer NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
```

**B — Column name mismatch (`instructor_id` vs `teacher_id`):**
The manually created table used `instructor_id`; all code expected `teacher_id`. The new `teacher_id` column added above conflicted. Fix:
```sql
ALTER TABLE courses DROP COLUMN teacher_id; -- drop the new blank one
ALTER TABLE courses RENAME COLUMN instructor_id TO teacher_id;
```

**C — Missing lessons columns:**
```sql
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 1;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS vimeo_url text;
NOTIFY pgrst, 'reload schema';
```

**D — Infinite recursion in profiles RLS:**
`profiles_admin_all` and `courses_admin_all` policies had subqueries on `profiles` inside policies ON `profiles` → infinite recursion. Fixed with a `SECURITY DEFINER` helper:
```sql
CREATE OR REPLACE FUNCTION get_my_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT role FROM public.profiles WHERE id = auth.uid(); $$;

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (get_my_role() IN ('owner','admin'));

DROP POLICY IF EXISTS "courses_admin_all" ON courses;
CREATE POLICY "courses_admin_all" ON courses FOR ALL USING (get_my_role() IN ('owner','admin'));
```

**E — RLS violation on courses INSERT:**
`courses_teacher_own` policy used `instructor_id` but the insert used `teacher_id`. Fixed by rebuilding the policy after the column rename:
```sql
DROP POLICY IF EXISTS "courses_teacher_own" ON courses;
CREATE POLICY "courses_teacher_own" ON courses FOR ALL
  USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
```

**F — RLS on profile reads in teacher dashboard pages:**
`app/dashboard/teacher/courses/page.tsx`, `courses/new/page.tsx`, and `courses/[id]/page.tsx` used anon client for profile role check. Fixed by adding service role client import and usage (same pattern as Steps 19–20).

#### YouTube integration (replaces Vimeo):

| File | Change |
|------|--------|
| `components/dashboard/teacher/CourseEditor.tsx` | Full rewrite: `youtubeEmbed()` + `youtubeId()` helpers; handles youtu.be, watch?v=, embed/, shorts/ URL formats; inline clickable thumbnail → embedded player preview; YouTube thumbnail from `img.youtube.com/vi/{id}/mqdefault.jpg` |
| `app/api/teacher/courses/[id]/lessons/route.ts` | Accepts `video_url` from client body, saves as `vimeo_url` column in DB |
| `app/api/teacher/lessons/[id]/route.ts` | Maps `updates.video_url` → `updates.vimeo_url` before DB update |

> Note: DB column remains named `vimeo_url` (legacy name); all new video content is YouTube URLs.

#### API 403 fix (POST /api/teacher/courses):
Service role client added to POST handler for the profile role check (anon client was being used, RLS returned null → 403).

---

### STEP 22 — Live Public Courses Page ✅
**Date:** Tue Mar 17, 2026
**Status:** ✅ Complete

#### What was done:
- Replaced static Phase 1 course data in `app/(public)/courses/page.tsx` with live Supabase fetch using service role client
- Separate lesson count query (no nested join — PostgREST FK relationship not configured for automatic nesting)
- `export const revalidate = 60` — ISR, refreshes every 60 seconds
- All styling uses globals.css classes (`.crs`, `.crs-h`, `.crs-p`, `.crs-top-bar`, `.crs-foot`, `.cbadges`, `.cb`, `.crs-enroll`, `.crs-meta`, `.cm`) — NOT Tailwind utilities (critical: Tailwind classes like `bg-white`, `rounded-[10px]` do not resolve correctly on public pages)

#### Key learning:
All public pages must use globals.css CSS variable classes, not Tailwind utility classes. This applies to every public page (`/courses`, `/spaces`, `/members`, `/about`, `/faq`, `/contact`, `/blog`).

---

### STEP 23 — Course Detail Page Redesign ✅
**Date:** Tue Mar 17, 2026
**Status:** ✅ Complete

#### What was done:
- Complete rewrite of `app/(public)/courses/[slug]/page.tsx` with dark theme using CSS variables (`var(--dark)`, `var(--teal2)`, `var(--border)`, etc.)
- Removed all static fallback courses — now 100% live Supabase data
- Fetches: course details + lesson count + teacher name (all via service role client)
- Removed `onMouseEnter`/`onMouseLeave` handlers (server component — event handlers not allowed)
- `MpesaEnrolButton` integrated with `courseSlug` prop for return URL
- Bottom CTA scrolls to enrol section via anchor link (not WhatsApp)

---

### STEP 24 — Enrollment Flow: Auth → M-Pesa ✅
**Date:** Tue Mar 17, 2026
**Status:** ✅ Complete

#### Flow implemented:
1. Student lands on `/courses/[slug]` → clicks "Enrol"
2. `MpesaEnrolButton` checks auth state → not logged in → shows two buttons:
   - "Log in to Enrol" → `/login?return=/courses/[slug]`
   - "Create Account & Enrol" → `/signup?return=/courses/[slug]`
3. After login/signup → redirected back to course page
4. Now authenticated → phone input + "Pay KES X with M-Pesa" button appears
5. STK Push initiated → student enters PIN on phone
6. Front-end polls `/api/payments/mpesa/status?id=...` every 3 s
7. On payment confirmed → redirect to `/dashboard/student/courses/[id]`

#### Udemy-style auth (no email verification gate):
- Email confirmations disabled in Supabase Auth settings
- `signUp` returns a session immediately → redirect to `returnTo` URL instantly
- No "verify email" gate blocking purchase flow
- When email confirmations are ON (future): shows "Check your email" screen with dynamic copy ("you'll be taken straight back to the course to complete payment")

#### Files updated:
| File | Change |
|------|--------|
| `app/(auth)/signup/page.tsx` | Reads `?return=` param; `emailRedirectTo` embeds return URL; instant redirect on session; dynamic subtitle for course context |
| `app/(auth)/login/page.tsx` | Redirects to `searchParams.get("return")` after successful sign-in; "Create account" link passes `?return=` through |
| `app/auth/callback/route.ts` | Reads `?return=` after code exchange; redirects there if it starts with `/` |
| `components/public/MpesaEnrolButton.tsx` | Added `courseSlug` prop; "loading" auth-check state; two unauthenticated buttons with return URL; dark theme styling using CSS variables |

---

### STEP 25 — M-Pesa Service Client Fix ✅
**Date:** Tue Mar 17, 2026
**Status:** ✅ Complete (code fixed; env vars pending)

#### Bug:
`POST /api/payments/mpesa/initiate` and `/callback` used `createServerClient` from `@supabase/ssr` as the service role client. This client requires cookie context (browser session) and cannot be used for server-side admin DB writes. Resulted in 502 errors.

#### Fix:
Both routes now use `createClient` from `@supabase/supabase-js` (the correct plain JS client) for all service role operations.

#### Remaining issue:
STK Push still returning 502 — Daraja env vars (`DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`) not yet filled in `.env.local`. Diagnostic logging added to confirm which variables are missing:
```ts
console.error("ENV CHECK — KEY:", !!process.env.DARAJA_CONSUMER_KEY, "SECRET:", !!process.env.DARAJA_CONSUMER_SECRET, "SHORTCODE:", process.env.DARAJA_SHORTCODE, "CALLBACK:", process.env.DARAJA_CALLBACK_URL);
```

**To fix M-Pesa:**
1. Go to `developer.safaricom.co.ke` → My Apps → create a sandbox app
2. Copy Consumer Key + Consumer Secret
3. Add to `.env.local`:
   ```
   DARAJA_CONSUMER_KEY=your_key
   DARAJA_CONSUMER_SECRET=your_secret
   DARAJA_SHORTCODE=174379
   DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
   DARAJA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/payments/mpesa/callback
   ```
4. Use ngrok for local testing: `ngrok http 3000` → copy HTTPS URL as callback

---

---

### STEP 26 — Space Booking Management + Live Status Board ✅
**Date:** Wed Mar 18, 2026
**Status:** ✅ Complete

#### Architecture:
Time-slot based operational booking system for Receptionist and Manager. Extended the existing `bookings` table with `end_time`, `setup`, and `booked_by` columns. Live status auto-polls every 30 seconds.

#### Database (010_space_sessions.sql) — ⏳ Run in Supabase before use:
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time  time;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS setup     text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booked_by uuid REFERENCES profiles(id);
-- Status constraint extended: adds 'active' and 'completed'
```

#### API routes:
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/spaces/live` | GET | All spaces + current/upcoming occupant for today |
| `/api/receptionist/bookings` | GET, POST | List bookings (last 30 days); create confirmed booking with overlap check |
| `/api/receptionist/bookings/[id]` | PATCH, DELETE | Update status; delete record |

#### Components:
| File | Description |
|------|-------------|
| `components/dashboard/BookSpaceForm.tsx` | Modal form: space selector, setup dropdown (per space), client name+phone, date, start→end time, overlap error display |
| `components/dashboard/SpaceLiveBoard.tsx` | Client component: polls every 30s, 4 space cards, green=available/red=occupied, Book + Schedule actions |

#### Receptionist Dashboard (full build):
| File | Description |
|------|-------------|
| `app/dashboard/receptionist/layout.tsx` | Sidebar: Dashboard, Live Status, All Bookings, Display Board; green live dot |
| `app/dashboard/receptionist/page.tsx` | Overview: SpaceLiveBoard + quick actions |
| `app/dashboard/receptionist/spaces/page.tsx` | All 4 spaces with live status + Book button |
| `app/dashboard/receptionist/spaces/[spaceId]/page.tsx` | Server shell → SpaceDetailClient |
| `app/dashboard/receptionist/spaces/[spaceId]/SpaceDetailClient.tsx` | Visual timeline (7am–10pm), NOW marker, booking blocks, status actions (play/check/cancel) |
| `app/dashboard/receptionist/bookings/page.tsx` | Server shell → BookingsManageClient |
| `app/dashboard/receptionist/bookings/BookingsManageClient.tsx` | Tabs: all/today/active/confirmed/pending/completed/cancelled; full status workflow |
| `app/dashboard/receptionist/live/page.tsx` | Shell |
| `app/dashboard/receptionist/live/LiveBoardDisplay.tsx` | Full-screen TV display: 2×2 grid, live clock, occupied=red/available=green, client name + setup + time |

#### Manager Dashboard (spaces added):
| File | Description |
|------|-------------|
| `app/dashboard/manager/layout.tsx` | Added "Spaces" nav section with Live Status link |
| `app/dashboard/manager/spaces/page.tsx` | Same SpaceLiveBoard + Book button |
| `app/dashboard/manager/spaces/[spaceId]/page.tsx` | Reuses SpaceDetailClient (shared component) |

#### Booking flow (staff-created):
1. Staff selects space → setup (e.g. "Podcast Recording") → client name + phone → date → start time → end time
2. System checks for overlaps — blocks conflicting bookings with error message
3. Booking saved as `confirmed` with `booked_by` = staff id
4. Space card shows "OCCUPIED" immediately on next poll
5. Staff can: **Play** (→ active/checked in), **Check** (→ completed), **✕** (→ cancelled)

#### Live Status Board:
- Full-screen TV view at `/dashboard/receptionist/live`
- 2×2 grid of space cards; green glow = available, red glow = occupied
- Shows: client name, setup, time window for current occupant; next booking preview
- Live clock (seconds) + last sync timestamp
- Auto-refreshes every 30s

#### Space setups per space:
| Space | Setup options |
|-------|--------------|
| Boardroom | Standard Meeting, Executive Meeting, Client Presentation, Interview |
| Conference Room | Conference Layout, Training Layout, Seminar Layout, Event/Workshop |
| Podcast Studio | Podcast Recording, Interview Setup, Live Stream Setup, Audio Recording |
| Content Studio | YouTube Shoot, Photography Session, Product Shoot, Social Media Content |

#### Confirmed:
- `npx tsc --noEmit` → zero new errors ✅ (5 pre-existing errors in teacher/courses pages unchanged)

---

---

### STEP 26 — Walk-in Revenue & Receptionist Registration
**Date:** Wed Mar 18, 2026
**Status:** ✅ Complete

#### Problem solved:
- Receptionist had no way to register members, physical students, or record cash/bank payments
- Revenue was only tracking space booking `estimated_cost` — no memberships, no physical classes, no space rental payments recorded anywhere
- Owner and Manager dashboards had no revenue breakdown

#### What was built:

**Migration:**
| File | Purpose |
|------|---------|
| `supabase/migrations/011_walk_in_payments.sql` | New `walk_in_payments` table — type (membership/physical_class/space_rental), customer info, amount, method (cash/bank_transfer), recorded_by, booking_id |

**API Routes:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/receptionist/register-member` | POST | Create member profile + members row + 7,500 KES payment record |
| `/api/receptionist/register-physical-student` | POST | Record physical class student + payment (no auth account yet) |
| `/api/receptionist/record-space-payment` | POST | Record cash/bank payment against existing booking |
| `/api/receptionist/walk-in-payments` | GET | Fetch walk-in payments (receptionist = own; manager/owner = all) |

**Receptionist Dashboard:**
| File | Purpose |
|------|---------|
| `app/dashboard/receptionist/register/page.tsx` | Shell |
| `app/dashboard/receptionist/register/RegisterClient.tsx` | 3-tab UI: Register Member / Register Physical Student / Record Space Payment |
| `app/dashboard/receptionist/layout.tsx` | Added "Walk-ins → Register" nav item |

**Owner Dashboard:**
- Grand total revenue banner (walk-in + online combined)
- Side-by-side breakdown: Walk-in (memberships / physical classes / space rentals) + Online (M-Pesa course payments)
- KPI grid: active members, bookings this month, walk-in payments count, online enrolments

**Manager Dashboard:**
- Same two-category breakdown as owner but NO grand total (by design)
- Revenue categories: Walk-in KES X + Online KES X shown separately
- Existing team KPIs and pending approvals preserved

#### Revenue visibility rules:
| Role | Walk-in Revenue | Online Course Revenue | Grand Total |
|------|----------------|----------------------|-------------|
| Receptionist | ✅ (own recordings only) | ❌ | ❌ |
| Manager | ✅ (all) | ✅ | ❌ |
| Owner | ✅ (all) | ✅ | ✅ |

#### Receptionist registration flows:
1. **Co-working Member** → invite email sent → profile + members row + walk_in_payment (7,500 KES, 30-day sub)
2. **Physical Student** → payment record only (no auth account — deferred)
3. **Space Rental Payment** → walk_in_payment linked to booking_id

#### Bug fix included:
- `app/dashboard/page.tsx`: removed `receptionist: "admin"` alias that was causing infinite redirect loop for receptionists

---

## REMAINING WORK — Priority Roadmap

### PRIORITY 1 — M-Pesa Sandbox Fix 🔄
**Status:** Code complete. Blocked on env vars.

**Steps to unblock:**
1. Fill Daraja sandbox credentials in `.env.local` (see Step 25 above)
2. Start ngrok: `ngrok http 3000` → use the HTTPS URL as `DARAJA_CALLBACK_URL`
3. Test full flow: enrol on a paid course → phone receives STK Push → enter PIN → confirm redirect

---

### PRIORITY 2 — Student Dashboard: YouTube Player Update ⏳
**Status:** Pending

`components/dashboard/student/CoursePlayer.tsx` still embeds Vimeo. Since all new lessons now use YouTube URLs stored in the `vimeo_url` column, the player must be updated to:
- Detect YouTube URL in `vimeo_url` field
- Extract YouTube video ID
- Render `<iframe src="https://www.youtube.com/embed/{id}" ...>` instead of Vimeo embed

---

### PRIORITY 5 — UI Consistency: Apply Home Page Style to All Public Pages ⏳
**Status:** Pending

The Home page uses the full dark design system from `ontime-ultimate (2).html`. Other public pages were built before the UI migration and have inconsistent styling. Pages to update:

| Page | Current state | Target |
|------|--------------|--------|
| `/about` | Mix of Tailwind + custom CSS | Dark design system, full sections |
| `/faq` | Mix | Dark design system |
| `/contact` | Mix | Dark design system |
| `/blog` | Placeholder | Dark design system |
| `/members` | Mix | Dark design system |
| `/spaces` | Mix | Dark design system |
| `/spaces/[slug]` | Mix | Dark design system |

**Approach:** Rewrite each page's JSX using the CSS variable inline-style pattern established in `/courses/[slug]/page.tsx` and the globals.css classes already defined.

---

### PRIORITY 6 — Deploy to Vercel + Production Config ⏳
**Status:** Pending

**Steps:**
1. Push repo to GitHub
2. Import to Vercel
3. Set all environment variables in Vercel dashboard (see Environment Variables table)
4. Update `NEXT_PUBLIC_SITE_URL` → production URL
5. Update `DARAJA_CALLBACK_URL` → production URL + `/api/payments/mpesa/callback`
6. Test M-Pesa on production (sandbox first, then live credentials)
7. Add custom domain in Vercel

---

## Database Migration Index

| File | Table(s) | Status |
|------|----------|--------|
| `001_spaces.sql` | `spaces` | ✅ Ran — Thu Mar 12, 2026 |
| `002_bookings.sql` | `bookings` | ✅ Ran — Thu Mar 12, 2026 |
| `003_profiles_members.sql` | `profiles`, `members` | ✅ Ran — Thu Mar 12, 2026 |
| `004_courses_lessons.sql` | `courses`, `lessons`, `quizzes` | ✅ Ran — Mon Mar 16, 2026 |
| `005_enrolments_progress.sql` | `enrolments`, `lesson_progress`, `quiz_attempts` | ✅ Ran — Mon Mar 16, 2026 |
| `006_payments.sql` | `payments` | ✅ Ran — Mon Mar 16, 2026 |
| `007_rls_policies.sql` | All tables — full RLS | ✅ Ran — Mon Mar 16, 2026 |
| `008_team_accounts.sql` | `profiles` (username, is_active, expanded roles), `invite_tokens`, `pending_registrations`, `password_reset_requests` | ✅ Ran — Tue Mar 17, 2026 |

---

## Environment Variables Status

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ Set (254746628668) |
| `NEXT_PUBLIC_SITE_URL` | ✅ Set (localhost for now — update to production URL on deploy) |
| `RESEND_API_KEY` | ⏳ Needs filling (resend.com dashboard) |
| `CRON_SECRET` | ⏳ Needs filling (`openssl rand -base64 32`) — also set in Vercel |
| `DARAJA_CONSUMER_KEY` | ⏳ Needs filling (developer.safaricom.co.ke → Sandbox) |
| `DARAJA_CONSUMER_SECRET` | ⏳ Needs filling (same) |
| `DARAJA_SHORTCODE` | ⏳ Sandbox: 174379 |
| `DARAJA_PASSKEY` | ⏳ Sandbox passkey in .env.local comments |
| `DARAJA_CALLBACK_URL` | ⏳ Set to `https://your-domain.vercel.app/api/payments/mpesa/callback` after deploy |

---

---

### STEP 27 — Full UI Consistency: Dark Design System on All Public Pages ✅
**Date:** Wed Mar 18, 2026
**Status:** ✅ Complete

#### What was done:
- **Custom cursor removed** — `#CUR` div deleted from `app/layout.tsx`, cursor JS removed from `HomeAnimations.tsx`, simplified inline preloader script. Browser default cursor used everywhere.
- **All public pages rewritten** from Tailwind utility classes (light/white) to the dark CSS variable design system

#### Pages rewritten:
| Page | Before | After |
|------|--------|-------|
| `/about` | bg-white/bg-teal-primary Tailwind | Dark system, Fraunces heading, dark2 cards |
| `/faq` | bg-white Tailwind | Dark system, teal border-left Q&A cards |
| `/contact` | bg-white Tailwind | Dark system, teal accent cards, social links |
| `/blog` | bg-white Tailwind | Dark system, coming-soon placeholder |
| `/members` | bg-gray-50 Tailwind | Dark system, gradient avatars, teal CTA banner |
| `/members/[slug]` | bg-gray-50 Tailwind | Dark system, profile hero, membership card |
| `/spaces` | bg-gray-50 Tailwind | Dark system, space cards with green/red badges |
| `/spaces/[slug]` | bg-gray-50 Tailwind | Dark system, full hero image, sticky booking card |

#### Rules enforced (per Step 22 learning):
- Zero Tailwind utility classes on public pages — all `style={{ }}` with CSS variables
- Hero sections all have `paddingTop: 120px` for fixed navbar clearance
- Font families use `var(--font-fraunces)` / `var(--font-jakarta)` variables
- Status badges use rgba colour system (green/red with matching glow)

#### Bugs also fixed:
- `courses/page.tsx` — `[...new Set(...)]` → `Array.from(new Set(...))` (TS2802)
- `teacher/page.tsx` — null-safe `user` + `profile` access (TS18047)

#### Build confirmed:
- `npm run build` → ✅ compiled successfully, zero errors

*Last updated: Wed Mar 18, 2026 — EAT*
*Steps complete: 1–27 ✅ | Remaining: M-Pesa env vars, YouTube player, Deploy*

---

### STEP 28 — Receptionist Dashboard: Registration System & Walk-in Revenue
**Date:** Wed Mar 18, 2026
**Status:** ✅ Complete

#### New migration: `011_walk_in_payments.sql`
Table `walk_in_payments`: id, type, customer_name, customer_phone, customer_email, profile_id, booking_id, amount, method, reference, notes, recorded_by, created_at
- Types: `membership | physical_class | space_rental`
- Methods: `cash | bank_transfer`
- RLS: receptionist reads own rows; manager/owner reads all

#### New API routes:
- `POST /api/receptionist/register-member` — Creates auth account via `admin.auth.admin.createUser()`, generates temp password, records 7,500 KES walk_in_payment
- `POST /api/receptionist/register-physical-student` — Records payment only, no auth account
- `POST /api/receptionist/record-space-payment` — Links cash/bank payment to existing booking_id
- `GET /api/receptionist/walk-in-members` — Deduped list with period_paid, outstanding, total_paid, sub_start, due_date
- `POST /api/receptionist/record-member-payment` — Records additional partial payment against profile_id
- `GET /api/receptionist/walk-in-payments` — Month payments (role-scoped)
- `GET /api/receptionist/receipt/[id]` — Single payment for receipt

#### UI built:
- `app/dashboard/receptionist/register/RegisterClient.tsx` — 3-tab form (Member / Physical Student / Space Payment). Member success shows credentials card + Print Receipt link
- `app/dashboard/receptionist/members/page.tsx` — Table with toggle (Members|Students), search bar, alert banners, row click opens MemberModal with contact info, balance, inline payment form, WhatsApp reminder, Print Receipt
- `app/dashboard/receptionist/receipt/[id]/page.tsx` — Printable receipt with print-only CSS

#### Bug fixed:
- `app/dashboard/page.tsx` removed `receptionist: "admin"` alias that caused infinite redirect loop

#### Revenue visibility:
| Role | Walk-in | Online | Grand Total |
|------|---------|--------|-------------|
| Receptionist | own only | No | No |
| Manager | all | Yes | No |
| Owner | all | Yes | Yes |

---

### STEP 29 — Walk-in Members Page: Search, Partial Payment, Toggle, Modal
**Date:** Wed Mar 18, 2026
**Status:** ✅ Complete

- **MemberModal** — row click opens modal overlay (not separate page). Shows contact, membership period, balance (Plan 7,500 / Paid / Outstanding), inline payment form when outstanding > 0, WhatsApp reminder, Print Receipt
- **Search** — client-side filter by name or phone with clear button
- **Partial payments** — outstanding = 7500 - SUM(payments since sub_start). Optimistic UI update on success
- **Segmented toggle** — Members / Physical Students with live badge counts
- **Alert banners** — expiring within 5 days + outstanding balances

---

### STEP 30 — Owner + Manager Dashboard Sync and Redesign
**Date:** Wed Mar 18, 2026
**Status:** ✅ Complete

#### Owner (`app/dashboard/owner/page.tsx`):
- Grand total banner (walk-in + online breakdown inline)
- Revenue cards with visual progress bars per category
- 4 KPIs: Active Members, Expiring Soon (7d), Expired/Lapsed, Bookings This Month
- Recent Walk-in Activity table — last 12 payments with customer, type badge, amount, method, receptionist name (FK join on recorded_by), date+time
- Bookings table preserved

#### Manager (`app/dashboard/manager/page.tsx`):
- NO grand total (by design)
- Revenue cards with progress bars
- Action item alert banners (pending approvals, expiring, expired) — clickable, shown only when count > 0
- 3-column member health KPIs
- Recent Walk-in Activity table (labeled "Synced from reception")
- Team KPIs, Quick Actions, Pending Signups preserved

#### Sync mechanism:
Both dashboards read `walk_in_payments` directly. Receptionist name shown via `profiles!walk_in_payments_recorded_by_fkey(full_name)` FK join. Changes are live on next page load.

---

### STEP 31 — Teacher Course Form: Rich Metadata
**Date:** Wed Mar 18, 2026
**Status:** ✅ Complete

#### New migration: `012_courses_extra_fields.sql`
Added to `courses` table: `category`, `level` (beginner/intermediate/advanced), `duration`, `outcomes`, `prerequisites`, `language`, `max_students`, `has_certificate`

#### API updated: `POST /api/teacher/courses` saves all new fields

#### Form redesigned (`components/dashboard/teacher/CreateCourseForm.tsx`):
5 sections: Course Identity (title, category, level) | About (description, outcomes, prerequisites) | Delivery (mode card toggle, language, duration, max students) | Pricing (free/paid toggle) | Media & Certificate (thumbnail with live preview, certificate checkbox)

---

### STEP 32 — M-Pesa STK Query Fix (Sandbox Workaround)
**Date:** Wed Mar 18, 2026
**Status:** ✅ Complete

#### Problem:
In sandbox, Safaricom cannot reach localhost callbacks. Payments stay pending forever — student never gets enrolled.

#### Solution (learned from Desktop/LC/laacib-scores):
Add a **direct STK Query** endpoint that asks Safaricom "did this payment succeed?" — bypasses the callback entirely.

#### What was added:

**`lib/daraja.ts` — `querySTKStatus(checkoutRequestId)`:**
Calls `POST /mpesa/stkpushquery/v1/query`. Returns ResultCode: "0" = paid, "1032" = cancelled, other = still processing.

**`app/api/payments/mpesa/query/route.ts`:**
- `POST { checkout_request_id }` — verifies payment belongs to student, calls querySTKStatus
- If paid: updates `payments.status = "paid"` + upserts enrolment + returns `{ status: "paid" }`
- If cancelled: updates DB + returns `{ status: "cancelled" }`
- If pending: returns `{ status: "pending" }` without touching DB
- Idempotent — safe to call repeatedly

#### Client polling pattern (to wire in payment UI):
```
Every 3s → GET /api/payments/mpesa/status?id=X   (DB check)
Every 6s → POST /api/payments/mpesa/query         (Safaricom direct)
```
Either returning `status: "paid"` triggers success UI.

#### Key insight from laacib-scores:
The callback route handles production (Safaricom can reach the server). The query route handles sandbox and acts as a production fallback. Both write to the same DB — they are complementary, not mutually exclusive.

---

## Database Migration Index (Updated — Mar 18, 2026)

| File | Table(s) | Status |
|------|----------|--------|
| `001_spaces.sql` | `spaces` | ✅ Ran Thu Mar 12 |
| `002_bookings.sql` | `bookings` | ✅ Ran Thu Mar 12 |
| `003_profiles_members.sql` | `profiles`, `members` | ✅ Ran Thu Mar 12 |
| `004_courses_lessons.sql` | `courses`, `lessons`, `quizzes` | ✅ Ran Mon Mar 16 |
| `005_enrolments_progress.sql` | `enrolments`, `lesson_progress`, `quiz_attempts` | ✅ Ran Mon Mar 16 |
| `008_team_accounts.sql` | `profiles` extensions, `invite_tokens`, `pending_registrations`, `password_reset_requests` | ✅ Ran Tue Mar 17 |
| `009_payments.sql` | `payments` | ✅ Ran Tue Mar 17 |
| `011_walk_in_payments.sql` | `walk_in_payments` | ⏳ Run in Supabase SQL Editor |
| `012_courses_extra_fields.sql` | `courses` (8 new columns) | ⏳ Run in Supabase SQL Editor |

---

## Environment Variables (Updated)

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ Set |
| `NEXT_PUBLIC_SITE_URL` | ✅ Set (localhost — update on deploy) |
| `RESEND_API_KEY` | ⏳ Needs filling |
| `CRON_SECRET` | ⏳ Needs filling |
| `DARAJA_CONSUMER_KEY` | ⏳ developer.safaricom.co.ke sandbox |
| `DARAJA_CONSUMER_SECRET` | ⏳ Same |
| `DARAJA_SHORTCODE` | ⏳ Sandbox: 174379 |
| `DARAJA_PASSKEY` | ⏳ From Safaricom portal |
| `DARAJA_CALLBACK_URL` | ⏳ Any URL works in sandbox — query route bypasses it |

---

## REMAINING WORK (Updated Mar 18, 2026)

### PRIORITY 1 — Wire M-Pesa Dual Polling in Student UI ⏳
Backend complete. The student course enrolment component needs dual polling:
1. Fill `.env.local` with Daraja sandbox credentials
2. After STK Push initiated, poll every 3s: `GET /api/payments/mpesa/status?id=X`
3. Also poll every 6s: `POST /api/payments/mpesa/query` with checkout_request_id
4. When either returns `status: "paid"` show success and redirect to course

### PRIORITY 2 — Student Dashboard: YouTube Player ⏳
`CoursePlayer.tsx` still embeds Vimeo. Lessons now store YouTube URLs in `vimeo_url` column. Extract YouTube ID and render `youtube.com/embed/{id}`.

### PRIORITY 3 — Deploy to Vercel ⏳
Push to GitHub, import to Vercel, set all env vars, update `DARAJA_CALLBACK_URL` to production URL (callbacks will work without ngrok once deployed).

---

### STEP 33 — Owner Dashboard: Full Restructure into Tabbed Navigation ✅
**Date:** Mon Mar 23, 2026
**Status:** ✅ Complete

#### What was done:
Transformed the owner dashboard from a single long-scroll page into a clearly structured navigation with dedicated pages per section.

#### Navigation structure (`app/dashboard/owner/layout.tsx`):
| Section | Nav Items |
|---------|-----------|
| Overview | Dashboard (stats + charts) |
| People | Staff, Members, Students |
| Management | Financials, Expenses, Corrections, Settings |
| Site | (existing public site links) |

- Layout fetches `pendingCorrections` (status=pending) and `pendingExpenses` (status=pending) with `try/catch` to prevent crashes if tables don't exist yet
- Red badge on Corrections nav item showing pending count
- Orange badge on Expenses nav item showing pending count

#### `app/dashboard/owner/page.tsx` — Complete rewrite:
- Dark revenue banner: Grand Total + walk-in breakdown + online breakdown + expense deduction + **Net Revenue** (= Total − Issued Expenses)
- 4 category KPI cards with progress bars: Memberships, Physical Classes, Space Rentals, Online Courses
- 6-month revenue trend — stacked horizontal bar chart using inline SVG/divs
- People snapshot: Active Members, Physical Students, Online Students, Staff
- Recent 8 payments table with type badge, customer, amount, method, receptionist, date

#### `app/dashboard/owner/team/page.tsx` + `StaffTabsClient.tsx` — New:
- Server page fetches all staff roles separately (manager, receptionist, teacher, content team)
- 4 KPI cards (total staff per role)
- Client component with 4 tabs: Managers | Receptionists | Teachers | Content Team
- Each tab shows full table with name, email, phone, status badge
- Teachers tab has expandable rows showing assigned courses
- Fix: used `<React.Fragment key={id}>` (not shorthand `<>`) inside `.map()` to avoid React key error

#### `app/dashboard/owner/members/page.tsx` — New:
- Fetches `profiles` (role=member) joined with `members` subscription data
- 4 KPI cards: Total, Active, Expiring Soon (≤7 days), Lapsed
- Reuses existing `MemberExpandTable` component

#### `app/dashboard/owner/students/page.tsx` + `StudentsTabClient.tsx` — New:
- Server page fetches physical students from `walk_in_payments` (type=physical_class) and online students from `profiles` (role=student) + `enrolments`
- Toggle UI: Physical Classes | Online Students
- Physical: grouped by class_name, expandable rows per student
- Online: expandable rows with enrolled courses and progress
- Fix: `<React.Fragment key={id}>` for online student row expansion

#### `app/dashboard/owner/financials/page.tsx` — Updated:
- Added `allExpensesRaw` query (`status="issued"`)
- Revenue banner now shows Expenses line + Net total
- Added "Issued Expenses" table section before the online payments table

---

### STEP 34 — Expense Management System ✅
**Date:** Tue Mar 24, 2026
**Status:** ✅ Complete

#### Architecture:
| Expense amount | Path |
|---------------|------|
| < KES 5,000 | Manager records → auto-issued immediately |
| ≥ KES 5,000 | Manager records → status=pending → Owner approves/rejects → Manager issues |

Only `status="issued"` expenses are deducted from financials as Net Revenue.

#### Database (`expenses` table) — ✅ Created in Supabase:
```sql
CREATE TABLE expenses (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title            text        NOT NULL,
  category         text        NOT NULL DEFAULT 'other',
  amount           numeric     NOT NULL CHECK (amount > 0),
  payment_method   text,
  reference        text,
  notes            text,
  recorded_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  recorded_at      timestamptz DEFAULT now(),
  status           text        NOT NULL DEFAULT 'issued',
  requires_approval boolean    NOT NULL DEFAULT false,
  approved_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at      timestamptz,
  issued_at        timestamptz,
  rejection_reason text
);
```

#### API (`app/api/expenses/route.ts`):
| Method | Actor | Action |
|--------|-------|--------|
| POST | Manager | Record expense. amount < 5000 → status=issued; ≥5000 → status=pending, requires_approval=true |
| GET | Manager | Own expenses. Owner → all expenses |
| PATCH action="approve" | Owner | Sets status=approved |
| PATCH action="reject" | Owner | Sets status=rejected, stores rejection_reason |
| PATCH action="issue" | Manager | Sets status=issued on approved expense, captures payment_method + reference |

#### Manager Dashboard (`app/dashboard/manager/expenses/page.tsx`):
- Full client component (single file)
- `RecordExpenseModal` — title, category, amount, notes. Auto-detects ≥5000 → switches to "Send for Approval" mode (hides payment method)
- 4 tabs: Issued | Pending | Approved | Rejected
- Approved tab: "Issue" button → opens `IssueModal` to capture payment_method + reference
- `app/dashboard/manager/layout.tsx` — Added Expenses nav item under Work section with green badge for `approvedExpenses` count

#### Owner Dashboard (`app/dashboard/owner/expenses/page.tsx`):
- Pending Review | Approved | Rejected tabs
- `ReviewModal` — Approve / Reject radio toggle + rejection reason textarea
- Pending tab shows expense detail + "Review" button

#### Financial impact:
- `app/dashboard/owner/page.tsx` — Net Revenue = Grand Total − sum of issued expenses
- `app/dashboard/owner/financials/page.tsx` — Issued Expenses table + expense deduction in banner

---

### STEP 35 — Correction Notes: Payment Discrepancy Fields ✅
**Date:** Tue Mar 24, 2026
**Status:** ✅ Complete

#### Problem solved:
When a receptionist or manager flags a correction, there was no way to capture numerical amounts — making reconciliation difficult.

#### Database change — ✅ Applied in Supabase:
```sql
ALTER TABLE correction_notes
ADD COLUMN recorded_amount numeric,
ADD COLUMN correct_amount  numeric;
```

#### `components/dashboard/CorrectionNoteModal.tsx` — Updated:
- Added "Payment discrepancy involved" toggle (pill-style, amber color)
- When toggled on: shows "Recorded Amount (KES)" + "Correct Amount (KES)" number fields
- Live discrepancy preview: calculates diff, shows "KES X underpaid (client paid less)" or "KES X overpaid (client paid more)" with color-coded banner
- Validation: both amounts required when toggle is on; amounts must differ
- Sends `recorded_amount` and `correct_amount` in POST body when toggle is active

#### `app/api/corrections/route.ts` — Updated:
- POST now accepts and stores `recorded_amount` and `correct_amount`
- GET selects both new columns
- Returns both in response

#### `app/dashboard/owner/corrections/page.tsx` — Updated:
- `Correction` TypeScript type now includes `recorded_amount` and `correct_amount`
- Discrepancy badge shown inline in the Note column: underpaid (red) / overpaid (amber)
- `ResponseModal` also shows the discrepancy summary when amounts are present

---

### STEP 36 — Member Registration: Partial Payment Support ✅
**Date:** Tue Mar 24, 2026
**Status:** ✅ Complete

#### Problem solved:
The member registration form hardcoded KES 7,500 with no way for a client to pay partially. The outstanding balance calculation in the API also hardcoded 7,500.

#### Database change — ⏳ Run in Supabase:
```sql
ALTER TABLE walk_in_payments
ADD COLUMN membership_fee numeric;
```

#### `app/dashboard/receptionist/register/RegisterClient.tsx` — Updated:
- **Removed** hardcoded "Co-working membership · KES 7,500/month" info banner entirely
- **Split amount field** into two: "Membership Fee (KES)" (pre-filled 7500, editable) + "Amount Paid (KES)" (blank, required)
- **Live balance preview** appears as both fields are filled:
  - Partial: amber banner → "KES X outstanding"
  - Full: green banner → "Full payment · KES X settled"
  - Overpayment: blue banner → "KES X over the agreed fee"
- Submit button label: `Register Member · KES X paid`
- Sends both `membership_fee` and `amount` (amount paid) to API

#### `app/api/receptionist/register-member/route.ts` — Updated:
- Body now requires `membership_fee` (number, > 0) and `amount` (amount paid, > 0)
- Both validated with clear error messages
- `membership_fee` stored in `walk_in_payments` record alongside `amount`

#### `app/api/receptionist/walk-in-members/route.ts` — Updated:
- SELECT now includes `membership_fee` column
- `agreedFee = p.membership_fee ?? DEFAULT_MEMBERSHIP_FEE` (fallback = 7500 for old records)
- Outstanding = `agreedFee − period_paid` (was hardcoded `MONTHLY_PLAN − period_paid`)
- `membership_fee` exposed in the response object for each member row
- Hardcoded `MONTHLY_PLAN` constant replaced with `DEFAULT_MEMBERSHIP_FEE` (fallback only)

---

## Database Migration Index (Updated — Mar 24, 2026)

| File / Change | Table(s) | Status |
|---------------|----------|--------|
| `001_spaces.sql` | `spaces` | ✅ Ran Thu Mar 12 |
| `002_bookings.sql` | `bookings` | ✅ Ran Thu Mar 12 |
| `003_profiles_members.sql` | `profiles`, `members` | ✅ Ran Thu Mar 12 |
| `004_courses_lessons.sql` | `courses`, `lessons`, `quizzes` | ✅ Ran Mon Mar 16 |
| `005_enrolments_progress.sql` | `enrolments`, `lesson_progress`, `quiz_attempts` | ✅ Ran Mon Mar 16 |
| `008_team_accounts.sql` | `profiles` extensions, `invite_tokens`, `pending_registrations`, `password_reset_requests` | ✅ Ran Tue Mar 17 |
| `009_payments.sql` | `payments` | ✅ Ran Tue Mar 17 |
| `011_walk_in_payments.sql` | `walk_in_payments` | ✅ Ran (confirmed) |
| `012_courses_extra_fields.sql` | `courses` (8 new columns) | ⏳ Run in Supabase |
| `ALTER TABLE bookings ADD end_time, setup, booked_by` | `bookings` | ✅ Applied |
| `CREATE TABLE correction_notes (...)` | `correction_notes` | ✅ Applied |
| `ALTER TABLE correction_notes ADD recorded_amount, correct_amount` | `correction_notes` | ✅ Applied |
| `CREATE TABLE expenses (...)` | `expenses` | ✅ Applied |
| `ALTER TABLE walk_in_payments ADD membership_fee` | `walk_in_payments` | ⏳ Run in Supabase |

---

## Environment Variables (Updated — Mar 24, 2026)

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ Set (254746628668) |
| `NEXT_PUBLIC_SITE_URL` | ✅ Set (localhost — update on deploy) |
| `RESEND_API_KEY` | ⏳ Needs filling (resend.com) |
| `CRON_SECRET` | ⏳ Generate: `openssl rand -base64 32` — also set in Vercel |
| `DARAJA_CONSUMER_KEY` | ⏳ developer.safaricom.co.ke sandbox |
| `DARAJA_CONSUMER_SECRET` | ⏳ Same |
| `DARAJA_SHORTCODE` | ⏳ Sandbox: 174379 |
| `DARAJA_PASSKEY` | ⏳ From Safaricom portal |
| `DARAJA_CALLBACK_URL` | ⏳ Set to production URL after deploy |

---

## REMAINING WORK (Updated — Mar 24, 2026)

### PRIORITY 1 — DB: Add membership_fee column ⏳
Run in Supabase SQL Editor:
```sql
ALTER TABLE walk_in_payments ADD COLUMN membership_fee numeric;
```
Required for partial payment support (Step 36) to work end-to-end.

### PRIORITY 2 — Wire M-Pesa Dual Polling in Student UI ⏳
Backend complete. `MpesaEnrolButton.tsx` needs dual polling after STK Push:
1. Every 3s: `GET /api/payments/mpesa/status?id=X` (DB check)
2. Every 6s: `POST /api/payments/mpesa/query` with checkout_request_id (Safaricom direct)
Requires Daraja sandbox credentials in `.env.local`.

### PRIORITY 3 — Student Dashboard: YouTube Player ⏳
`CoursePlayer.tsx` still renders Vimeo. Lessons now store YouTube URLs in the `vimeo_url` column. Extract YouTube video ID and render `<iframe src="https://www.youtube.com/embed/{id}">`.

### PRIORITY 4 — Run `012_courses_extra_fields.sql` ⏳
Course rich metadata migration not yet confirmed as run. Needed for category, level, outcomes, prerequisites, duration, max_students, has_certificate fields to persist.

### PRIORITY 5 — Deploy to Vercel ⏳
1. Push repo to GitHub
2. Import to Vercel
3. Set all env vars in Vercel dashboard
4. Update `NEXT_PUBLIC_SITE_URL` → production URL
5. Update `DARAJA_CALLBACK_URL` → `https://your-domain.vercel.app/api/payments/mpesa/callback`
6. Test M-Pesa end-to-end in production

---

---

### STEP 37 — Pre-Deploy Polish: SEO, PWA, Mobile, Branding ✅
**Date:** Mon Mar 24, 2026
**Status:** ✅ Complete

#### Favicon & PWA
- Extracted client-provided `favicon_io (7).zip` → all 7 files placed in `public/`
  (`android-chrome-192x192.png`, `android-chrome-512x512.png`, `apple-touch-icon.png`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico`, `site.webmanifest`)
- Replaced `app/favicon.ico` with the new branded icon
- `public/site.webmanifest` — fully branded: name, short_name, description, theme_color `#C1440E`, background_color `#111111`, display `standalone`, 4 icon sizes, 2 shortcuts (Book a Space + View Courses)
- `public/sw.js` — Service Worker: pre-caches homepage + icons on install, network-first for HTML pages, cache-first for static assets, auto-purges old cache on activate. Skips API/dashboard/auth routes.
- iOS PWA: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, `apple-mobile-web-app-title` meta tags added in `app/layout.tsx`

#### SEO + LLM Search Optimization
- `app/layout.tsx` — full Next.js `Metadata` object:
  - `metadataBase: https://ontime.academy`
  - `title` template: `%s | Ontime Academy`
  - `keywords` array: 10 targeted Nairobi/Kenya co-working + academy terms
  - `openGraph`: type, locale `en_KE`, url, siteName, images (points to `public/og-image.jpg`)
  - `twitter`: card `summary_large_image`, creator `@OntimeAcademy`
  - `icons`: favicon.ico, 16px, 32px, apple-touch-icon
  - `manifest`: `/site.webmanifest`
  - `viewport` exported separately with `themeColor` for light + dark
- `JSON-LD` structured data in `<head>` (all 3 schemas):
  - `Organization` — name, url, logo, description, address (Nairobi/KE), contactPoint, sameAs: [`ontimeacademy.com`, `ontimeacademy.org`]
  - `WebSite` — publisher FK, SearchAction pointing to `/courses?q={search_term_string}`
  - `LocalBusiness` — priceRange KES, paymentAccepted, openingHoursSpecification (Mon–Sat 08:00–20:00)
- `next.config.mjs` — added HTTP headers: `sw.js` → `no-cache, no-store`; `site.webmanifest` → correct `Content-Type`

#### Branding: CEO Title
- `app/dashboard/owner/layout.tsx`:
  - `role="Owner"` → `role="Chief Executive Officer"`
  - `portalLabel="Owner Portal"` → `portalLabel="CEO Portal"`
  - `topbarBreadcrumb="Owner Portal"` → `topbarBreadcrumb="CEO Portal"`
  - Fallback name: `"Owner"` → `"Chief Executive Officer"`

#### Login Page Contrast Fixes
All opacity values boosted on the dark login-box for WCAG compliance:
- `.login-subtitle` — `rgba(255,255,255,.5)` → `.72` + slight font-size boost
- `.login-logo-sub` — `.45` → `.70`
- `.login-remember span` — `.55` → `.75`
- `.login-divider span` — `.35` → `.55`
- `.login-hint` — `.4` → `.62`, font-size `.68rem` → `.72rem`
- `.login-hint strong` — `.5` → `.75`

#### Staff Login Link Share (Manager Invite Page)
- `app/dashboard/manager/invite/page.tsx` — added **Staff Login Link** card below the invite generator:
  - Shows `https://ontime.academy/login`
  - Copy to clipboard button with visual confirmation
  - WhatsApp share button with pre-filled message
  - Instructional copy: staff log in with username + password

#### Mobile Responsiveness
- `app/globals.css` — new/updated media query rules:
  - **480px**: `.hero-h` clamped to `clamp(2.4rem, 10vw, 3.2rem)` (was uncapped at 3.2rem); `.hero-sub` → `1.05rem`; `.sec-h` clamped smaller; `.stats-row` / `.stat` tightened
  - **480px (auth)**: `auth-screen` gets `padding-top: max(40px, env(safe-area-inset-top))`; `login-box` padding reduced to `32px 22px`; logo + title scaled down
  - **768px**: `.vid-float-badge { display: none }` — hero video floating badges hidden on mobile (prevent overflow)
  - `.hmb` touch target: `padding: 4px` → `padding: 10px; margin: -10px` (44px+ tap area)
  - Body text: `.sec-p` → `1.22rem` line-height `1.85`, slightly darker `#3d3d3d`
- `components/layout/Navbar.tsx` — added `useEffect` that sets `document.body.style.overflow = "hidden"` when mobile menu is open (prevents background scroll)

#### Build
- `npm run build` → ✅ compiled successfully, 90/90 static pages, zero errors

#### ⚠️ One item still needed before deploy
- `public/og-image.jpg` — 1200×630px branded image (used by WhatsApp/Twitter/LinkedIn link previews). All metadata is wired; just needs the image file in `public/`.

---

### STEP 38 — Course Card Contrast Fixes + Mobile Responsiveness
**Date:** Mon Mar 24, 2026
**Status:** ✅ Complete
**Commit:** `1f08a79`

#### Problem
Course cards on the public `/courses` page had two issues:
1. **Color contrast below WCAG AA** — `.crs-type` (teacher name), mode badges (`.cb.on`, `.cb.pp`, `.cb.gr`), `.crs-enroll`, and price text all used `var(--teal2)` = `#E05520` on a white card background (~4.1:1 ratio, below the 4.5:1 AA threshold for small text).
2. **Thumbnail overflow on mobile** — the thumbnail used hardcoded Tailwind `-mx-[30px] -mt-[30px]` negative margins. When card padding changed at smaller breakpoints, the margins no longer aligned correctly.

#### What was fixed

**`app/globals.css`**
- `.crs-type` — color `var(--teal2)` → `var(--teal)` (`#C1440E`, ~6:1 contrast)
- `.cb.on` — text `var(--teal2)` → `var(--teal)`; added subtle `border: 1px solid rgba(193,68,14,.2)`
- `.cb.pp` — text `var(--gold2)` (`#f0b832`, ~1.5:1) → `var(--gold)` (`#c9921a`, ~4.8:1); added border
- `.cb.gr` — darkened bg slightly, text → `#3d3d3d`; added border
- `.crs-enroll` — color `var(--teal2)` → `var(--teal)`
- Added `.crs-thumb` class: `margin: -30px -30px 20px -30px` (replaces hardcoded Tailwind classes)
- Added to `@media (max-width: 480px)`: `.crs { padding: 20px }` and `.crs-thumb { margin: -20px -20px 16px -20px }` — thumbnail always bleeds flush to card edge regardless of padding

**`app/(public)/courses/page.tsx`**
- Thumbnail div: replaced `-mx-[30px] -mt-[30px] mb-5` Tailwind classes → `crs-thumb` CSS class
- Price text: `text-[var(--teal2)]` → `text-[var(--teal)]`

---

### STEP 39 — PWA Fix: Service Worker + Manifest
**Date:** Mon Mar 24, 2026
**Status:** ✅ Complete
**Commit:** `0031957`

#### Problem
PWA "Add to Home Screen" was not working on Android Chrome. Compared against working Hornza project to identify root cause.

**Root cause:** `sw.js` called `cache.addAll(["/", ...])`. Next.js server-rendered pages are served with `Cache-Control: no-store`. The Cache Storage API **throws a TypeError** when asked to store a `no-store` response. This caused the service worker `install` event to fail, meaning the SW never activated — which blocked Chrome's PWA installability check.

Secondary issues in `site.webmanifest`: included `16×16` and `32×32` icons (too small for PWA, only 192 and 512 are needed) and an empty `"screenshots": []` array (caused manifest validation warnings).

#### What was fixed

**`public/sw.js`**
- Removed `"/"` from `PRECACHE_ASSETS` — HTML pages are never pre-cached
- Bumped cache name `ontime-v1` → `ontime-v2` (forces old broken SW to be replaced on next visit)
- Fetch handler: HTML pages now use network-first with no caching attempt (avoids `no-store` errors entirely)
- Static assets (images, icons, manifest) still use cache-first strategy

**`public/site.webmanifest`**
- Removed `favicon-16x16.png` and `favicon-32x32.png` from `icons` array (not valid PWA icons)
- Removed empty `"screenshots": []` field
- Removed `"orientation"`, `"categories"`, `"lang"` fields (not needed; Hornza works without them)
- Retained: `name`, `short_name`, `description`, `start_url`, `display`, `background_color`, `theme_color`, `icons` (192 + 512), `shortcuts`

---

## Database Migration Index (Updated — Mar 24, 2026)

| File / Change | Table(s) | Status |
|---------------|----------|--------|
| `001_spaces.sql` | `spaces` | ✅ Ran Thu Mar 12 |
| `002_bookings.sql` | `bookings` | ✅ Ran Thu Mar 12 |
| `003_profiles_members.sql` | `profiles`, `members` | ✅ Ran Thu Mar 12 |
| `004_courses_lessons.sql` | `courses`, `lessons`, `quizzes` | ✅ Ran Mon Mar 16 |
| `005_enrolments_progress.sql` | `enrolments`, `lesson_progress`, `quiz_attempts` | ✅ Ran Mon Mar 16 |
| `008_team_accounts.sql` | `profiles` extensions, `invite_tokens`, `pending_registrations`, `password_reset_requests` | ✅ Ran Tue Mar 17 |
| `009_payments.sql` | `payments` | ✅ Ran Tue Mar 17 |
| `011_walk_in_payments.sql` | `walk_in_payments` | ✅ Ran |
| `012_courses_extra_fields.sql` | `courses` (8 new columns) | ✅ Ran Mar 24 |
| `ALTER TABLE bookings ADD end_time, setup, booked_by` | `bookings` | ✅ Applied |
| `CREATE TABLE correction_notes (...)` | `correction_notes` | ✅ Applied |
| `ALTER TABLE correction_notes ADD recorded_amount, correct_amount` | `correction_notes` | ✅ Applied |
| `CREATE TABLE expenses (...)` | `expenses` | ✅ Applied |
| `ALTER TABLE walk_in_payments ADD membership_fee` | `walk_in_payments` | ⏳ Run in Supabase |

---

## Environment Variables (Updated — Mar 24, 2026)

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ Set (254746628668) |
| `NEXT_PUBLIC_SITE_URL` | ✅ Set (localhost — update on deploy) |
| `RESEND_API_KEY` | ⏳ Needs filling (resend.com) |
| `CRON_SECRET` | ⏳ Generate: `openssl rand -base64 32` — also set in Vercel |
| `DARAJA_CONSUMER_KEY` | ⏳ developer.safaricom.co.ke sandbox |
| `DARAJA_CONSUMER_SECRET` | ⏳ Same |
| `DARAJA_SHORTCODE` | ⏳ Sandbox: 174379 |
| `DARAJA_PASSKEY` | ⏳ From Safaricom portal |
| `DARAJA_CALLBACK_URL` | ⏳ Set to production URL after deploy |

---

## REMAINING WORK (Updated — Mar 24, 2026)

### PRIORITY 1 — Create `public/og-image.jpg` ⏳
1200×630px branded image for WhatsApp / Twitter / LinkedIn link previews.
All metadata is wired in `layout.tsx` — just drop the file in `public/`.

### PRIORITY 2 — DB: Run pending migration ⏳
```sql
-- Partial payments (Step 36)
ALTER TABLE walk_in_payments ADD COLUMN IF NOT EXISTS membership_fee numeric;
```
> `012_courses_extra_fields.sql` ✅ already ran Mar 24.

### PRIORITY 3 — Wire M-Pesa Dual Polling in Student UI ⏳
Backend complete. `MpesaEnrolButton.tsx` needs dual polling after STK Push:
1. Every 3s: `GET /api/payments/mpesa/status?id=X` (DB check)
2. Every 6s: `POST /api/payments/mpesa/query` with checkout_request_id (Safaricom direct)
Requires Daraja sandbox credentials in `.env.local`.

### PRIORITY 4 — Student Dashboard: YouTube Player ⏳
`CoursePlayer.tsx` still renders Vimeo. Lessons now store YouTube URLs in the `vimeo_url` column. Extract YouTube video ID and render `<iframe src="https://www.youtube.com/embed/{id}">`.

### PRIORITY 5 — Deploy to Vercel ✅ Live at ontime.academy
Site is live. Remaining env vars to confirm in Vercel dashboard:
- `RESEND_API_KEY` — for subscription reminder emails
- `CRON_SECRET` — for Vercel cron job (`openssl rand -base64 32`)
- `DARAJA_*` — Safaricom sandbox credentials
- `DARAJA_CALLBACK_URL` → `https://ontime.academy/api/payments/mpesa/callback`

---

---

### STEP 40 — XML Sitemap ✅
**Date:** Mon Mar 24, 2026
**Status:** ✅ Complete
**Commit:** `fa89a27`

#### What was built:
- `app/sitemap.ts` — Next.js dynamic sitemap auto-served at `/sitemap.xml`
- Static routes: `/`, `/courses`, `/spaces`, `/about`, `/contact`, `/blog`, `/faq`, `/members`
- Dynamic routes: fetches all published courses (by slug) + all spaces from Supabase using service role client
- Priority and changeFrequency set per-page type

---

### STEP 41 — Receptionist Members/Students: Split into Separate Pages ✅
**Date:** Between Mar 18–24, 2026
**Status:** ✅ Complete

#### What changed from Step 29:
Step 29 built a single page (`/receptionist/members`) with a segmented toggle switching between Members and Physical Students. This was later split into two dedicated pages for clarity and independent navigation:

| File | Description |
|------|-------------|
| `app/dashboard/receptionist/members/page.tsx` | Members only — search by name/phone, alert banners (expiring, outstanding), MemberModal with inline payment, Print Receipt |
| `app/dashboard/receptionist/students/page.tsx` | Physical students only — search by name/phone/class, grouped by class_name, StudentModal with inline payment, Print Receipt |

Both pages share the same API (`GET /api/receptionist/walk-in-members`) — members page filters `type="membership"`, students page filters `type="physical_class"`.

The receptionist sidebar was updated with two separate nav links under a "People" section.

---

### STEP 42 — Manager Dashboard: Members, Students, Bookings ✅
**Date:** Between Mar 18–24, 2026
**Status:** ✅ Complete

Three pages built for Manager that were omitted from previous AUDIT entries:

| File | Description |
|------|-------------|
| `app/dashboard/manager/members/page.tsx` | Walk-in members list with search (name/phone), MemberModal, inline payments, correction note flag |
| `app/dashboard/manager/students/page.tsx` | Physical students grouped by class with search (name/phone/class), StudentModal, correction note flag |
| `app/dashboard/manager/bookings/page.tsx` | Server shell → `ManagerBookingsClient` |
| `app/dashboard/manager/bookings/ManagerBookingsClient.tsx` | Full bookings management table with status tabs, same workflow as receptionist bookings |

Both members and students pages use `GET /api/receptionist/walk-in-members` (same API, manager scope sees all records).

---

### STEP 43 — Search Filters: Owner Students, Owner Members, Admin Members ✅
**Date:** Thu Mar 26, 2026
**Status:** ✅ Complete

Added missing search bars to the three dashboard views that lacked them:

#### Owner Students (`StudentsTabClient.tsx`):
- Search bar above the Physical/Online tab toggle
- Physical tab: filters by name, phone, or class name
- Online tab: filters by name, email, or enrolled course title
- Tab count badges update live as search query changes
- Placeholder text updates per active tab

#### Owner Members (`MemberExpandTable.tsx`):
- Search bar added at the top of the component (already client-side)
- Filters by full name, email, phone, or profession
- Empty state shown inline when no results match

#### Admin Members (new `AdminMembersClient.tsx`):
- Admin members page was a pure server component — extracted table into new client component
- `app/dashboard/admin/members/AdminMembersClient.tsx` handles search state
- `app/dashboard/admin/members/page.tsx` now passes members array to client component
- Search filters by name, email, phone, or profession

---

## Database Migration Index (Updated — Mar 26, 2026)

| File / Change | Table(s) | Status |
|---------------|----------|--------|
| `001_spaces.sql` | `spaces` | ✅ Ran Thu Mar 12 |
| `002_bookings.sql` | `bookings` | ✅ Ran Thu Mar 12 |
| `003_profiles_members.sql` | `profiles`, `members` | ✅ Ran Thu Mar 12 |
| `004_courses_lessons.sql` | `courses`, `lessons`, `quizzes` | ✅ Ran Mon Mar 16 |
| `005_enrolments_progress.sql` | `enrolments`, `lesson_progress`, `quiz_attempts` | ✅ Ran Mon Mar 16 |
| `008_team_accounts.sql` | `profiles` extensions, `invite_tokens`, `pending_registrations`, `password_reset_requests` | ✅ Ran Tue Mar 17 |
| `009_payments.sql` | `payments` | ✅ Ran Tue Mar 17 |
| `011_walk_in_payments.sql` | `walk_in_payments` | ✅ Ran |
| `012_courses_extra_fields.sql` | `courses` (8 new columns) | ✅ Ran Mar 24 |
| `ALTER TABLE bookings ADD end_time, setup, booked_by` | `bookings` | ✅ Applied |
| `CREATE TABLE correction_notes (...)` | `correction_notes` | ✅ Applied |
| `ALTER TABLE correction_notes ADD recorded_amount, correct_amount` | `correction_notes` | ✅ Applied |
| `CREATE TABLE expenses (...)` | `expenses` | ✅ Applied |
| `ALTER TABLE walk_in_payments ADD membership_fee` | `walk_in_payments` | ⏳ **Run in Supabase** |

---

## Environment Variables (Updated — Mar 26, 2026)

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ Set (254746628668) |
| `NEXT_PUBLIC_SITE_URL` | ✅ Set (update to production URL on deploy) |
| `RESEND_API_KEY` | ⏳ Needs filling (resend.com) |
| `CRON_SECRET` | ⏳ Generate: `openssl rand -base64 32` — also set in Vercel |
| `DARAJA_CONSUMER_KEY` | ⏳ developer.safaricom.co.ke sandbox |
| `DARAJA_CONSUMER_SECRET` | ⏳ Same |
| `DARAJA_SHORTCODE` | ⏳ Sandbox: 174379 |
| `DARAJA_PASSKEY` | ⏳ From Safaricom portal |
| `DARAJA_CALLBACK_URL` | ⏳ `https://ontime.academy/api/payments/mpesa/callback` |

---

## REMAINING WORK (Updated — Mar 26, 2026)

### PRIORITY 1 — Create `public/og-image.jpg` ⏳
1200×630px branded image for WhatsApp / Twitter / LinkedIn link previews.
All metadata is wired in `layout.tsx` — just drop the file in `public/`.

### PRIORITY 2 — DB: Run pending migration ⏳
```sql
ALTER TABLE walk_in_payments ADD COLUMN IF NOT EXISTS membership_fee numeric;
```
Required for partial payment support (Step 36) to work end-to-end.

### PRIORITY 3 — Wire M-Pesa Dual Polling in Student UI ⏳
Backend complete. `MpesaEnrolButton.tsx` needs dual polling after STK Push:
1. Every 3s: `GET /api/payments/mpesa/status?id=X` (DB check)
2. Every 6s: `POST /api/payments/mpesa/query` with checkout_request_id (Safaricom direct)
Requires Daraja sandbox credentials in `.env.local`.

### PRIORITY 4 — Student Dashboard: YouTube Player ⏳
`CoursePlayer.tsx` still renders Vimeo. Lessons now store YouTube URLs in the `vimeo_url` column. Extract YouTube video ID and render `<iframe src="https://www.youtube.com/embed/{id}">`.

### PRIORITY 5 — Set Remaining Env Vars in Vercel ⏳
- `RESEND_API_KEY` — for subscription reminder emails
- `CRON_SECRET` — for Vercel cron job
- `DARAJA_*` — Safaricom sandbox credentials

---

*Last updated: Thu Mar 26, 2026 — EAT*
*Steps complete: 1–43 ✅ | Pending DB: membership_fee column | Remaining: OG image, M-Pesa UI polling, YouTube player, env vars*
