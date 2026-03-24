import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function createServiceClient() {
  const url            = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createServerClient(url, serviceRoleKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}

export async function POST(request: NextRequest) {
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

    // Basic validation
    if (!space_id || !visitor_name || !visitor_phone || !booking_date || !start_time || !hours) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        space_id,
        visitor_name,
        visitor_email:  visitor_email ?? null,
        visitor_phone,
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
