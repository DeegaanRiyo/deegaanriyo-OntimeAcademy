// Middleware — refreshes Supabase session, protects /dashboard/* routes,
// and blocks deactivated accounts from accessing any dashboard.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must happen before any redirects
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Protect /dashboard/* ─────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Block deactivated accounts — is_active is synced to user_metadata
    // by the toggle-user API route whenever Owner/Manager deactivates someone.
    // Reading from JWT means no extra DB query on every request.
    const isActive = user.user_metadata?.is_active;
    if (isActive === false) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("deactivated", "1");
      return NextResponse.redirect(url);
    }
  }

  // ── Redirect logged-in users away from /login and /signup ─
  if ((pathname === "/login" || pathname === "/signup") && user) {
    // Only redirect if account is active — deactivated users should
    // stay on /login so they see the deactivated message
    if (user.user_metadata?.is_active !== false) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
