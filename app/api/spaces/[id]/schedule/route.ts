import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// GET /api/spaces/[id]/schedule?date=YYYY-MM-DD
// Public — returns pending/confirmed/active bookings so the public time grid can mark slots as taken.
// pending = soft-reserved (amber), confirmed/active = hard-booked (red).
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const date   = request.nextUrl.searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date param required (YYYY-MM-DD)" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, start_time, hours, status, visitor_name")
      .eq("space_id", id)
      .eq("booking_date", date)
      .in("status", ["pending", "confirmed", "active"]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ bookings: bookings ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
