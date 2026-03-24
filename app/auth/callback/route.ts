// Supabase Auth Callback Route
// Exchanges the auth code for a session after:
// - Email confirmation (signup)
// - Password reset link click
// - Magic link / invite link click

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "invite" | "recovery" | "signup" | null

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()           { return cookieStore.getAll(); },
        setAll(toSet)      { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Route based on auth type
  if (type === "invite") {
    return NextResponse.redirect(`${origin}/invite/setup`);
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // If a return URL was embedded in the callback link, go there
  const returnTo = searchParams.get("return");
  if (returnTo && returnTo.startsWith("/")) {
    return NextResponse.redirect(`${origin}${returnTo}`);
  }

  // Default — go to dashboard
  return NextResponse.redirect(`${origin}/dashboard`);
}
