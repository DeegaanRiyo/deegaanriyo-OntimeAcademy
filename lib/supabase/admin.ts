// Service-role Supabase client — bypasses RLS for admin operations.
// Use this in API routes that need to INSERT/UPDATE/DELETE tables
// where the calling user's role has no direct RLS policy.

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
