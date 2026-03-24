import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = serviceClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["receptionist", "admin", "owner"].includes(caller?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as {
      booking_id:  string;
      amount:      number;
      method:      "cash" | "bank_transfer";
      reference?:  string;
      notes?:      string;
    };

    const { booking_id, amount, method, reference, notes } = body;

    if (!booking_id || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    // Fetch booking to get visitor details
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, visitor_name, visitor_phone, visitor_email, status")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Record the payment
    const { error: payError } = await admin.from("walk_in_payments").insert({
      type:            "space_rental",
      customer_name:   booking.visitor_name,
      customer_phone:  booking.visitor_phone,
      customer_email:  booking.visitor_email ?? null,
      booking_id,
      amount,
      method,
      reference:       reference ?? null,
      notes:           notes ?? null,
      recorded_by:     user.id,
    });

    if (payError) {
      return NextResponse.json({ error: payError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
