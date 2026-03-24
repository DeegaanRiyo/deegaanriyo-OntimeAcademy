-- ============================================================
-- 011_walk_in_payments.sql
-- Physical / walk-in revenue recorded by receptionist
-- ============================================================

create table if not exists walk_in_payments (
  id           uuid        primary key default gen_random_uuid(),

  -- What kind of payment
  type         text        not null
               check (type in ('membership', 'physical_class', 'space_rental')),

  -- Customer details (stored directly — no auth account required yet)
  customer_name  text      not null,
  customer_phone text      not null,
  customer_email text,

  -- Optional links
  profile_id   uuid        references profiles(id) on delete set null,  -- set when member account is created
  booking_id   uuid        references bookings(id) on delete set null,  -- set for space_rental payments

  -- Payment details
  amount       integer     not null check (amount > 0),   -- KES
  method       text        not null check (method in ('cash', 'bank_transfer')),
  reference    text,       -- bank transfer ref / receipt number
  notes        text,

  -- Who recorded it
  recorded_by  uuid        not null references profiles(id),

  created_at   timestamptz not null default now()
);

-- Indexes for common queries
create index on walk_in_payments (type);
create index on walk_in_payments (recorded_by);
create index on walk_in_payments (created_at);
create index on walk_in_payments (booking_id);

-- ── RLS ─────────────────────────────────────────────────────
alter table walk_in_payments enable row level security;

-- Receptionist: read their own payments only
create policy "receptionist_own_payments"
  on walk_in_payments for select
  using (
    recorded_by = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'receptionist'
    )
  );

-- Manager: read all walk-in payments
create policy "manager_read_walk_in"
  on walk_in_payments for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- Owner: read all walk-in payments
create policy "owner_read_walk_in"
  on walk_in_payments for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner'
    )
  );

-- Inserts via service role only (API routes) — no direct client inserts
