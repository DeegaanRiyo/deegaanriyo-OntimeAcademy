import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function createServiceClient() {
  const url            = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createServerClient(url, serviceRoleKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

export async function POST(request: NextRequest) {
  // Require authentication
  const cookieStore = await cookies();
  const authClient  = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to make a booking." }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      space_id:       string;
      visitor_name:   string;
      visitor_email:  string | null;
      visitor_phone:  string;
      booking_date:   string;
      start_time:     string;
      hours:          number;
      estimated_cost: number;
    };

    const {
      space_id,
      visitor_name,
      visitor_email,
      visitor_phone,
      booking_date,
      start_time,
      hours,
      estimated_cost,
    } = body;

    // Basic validation (phone is optional — user may not have it on their profile yet)
    if (!space_id || !visitor_name || !booking_date || !start_time || !hours) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Compute end time from start + hours
    const [sh, sm] = start_time.split(":").map(Number);
    const totalMin = sh * 60 + sm + hours * 60;
    const endTime  = `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;

    // Check for conflicts — pending slots are soft-reserved; confirmed/active are hard-blocked
    const { data: conflicts } = await supabase
      .from("bookings")
      .select("id, start_time, end_time, hours, status")
      .eq("space_id", space_id)
      .eq("booking_date", booking_date)
      .in("status", ["pending", "confirmed", "active"]);

    for (const b of conflicts ?? []) {
      const bEnd = b.end_time ?? (() => {
        const [bh, bm] = (b.start_time as string).split(":").map(Number);
        const t = bh * 60 + bm + (b.hours ?? 1) * 60;
        return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
      })();
      if (start_time < bEnd && endTime > b.start_time) {
        const isPending = (b as { status: string }).status === "pending";
        return NextResponse.json(
          {
            error: isPending
              ? "That time slot has already been reserved by another client. Please choose a different time."
              : "That time slot is already booked. Please choose a different time.",
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        space_id,
        visitor_name,
        visitor_email:  visitor_email ?? null,
        visitor_phone:  visitor_phone || "",
        booking_date,
        start_time,
        hours,
        estimated_cost: estimated_cost ?? null,
        status:         "pending",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
