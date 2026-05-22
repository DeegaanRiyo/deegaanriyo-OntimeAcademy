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

function tempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "Ontime@";
  for (let i = 0; i < 6; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = serviceClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["receptionist", "owner", "manager", "admin"].includes(caller?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as {
      full_name:      string;
      email:          string;
      phone:          string;
      profession?:    string;
      membership_fee: number;
      amount:         number;
      method:         "cash" | "mpesa" | "bank_transfer";
      reference?:     string;
      notes?:         string;
      joined_date?:   string;   // YYYY-MM-DD; defaults to today if omitted
    };

    const { full_name, email, phone, profession, membership_fee, amount, method, reference, notes, joined_date } = body;

    if (!full_name?.trim() || !email?.trim() || !phone?.trim() || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!membership_fee || membership_fee <= 0) {
      return NextResponse.json({ error: "Membership fee must be greater than zero" }, { status: 400 });
    }

    const amountPaid = Math.round(Number(amount) || 0);

    const password = tempPassword();

    // Create auth user directly — no invite email, works in dev and production
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email:            email.trim(),
        password,
        email_confirm:    true,            // mark email as confirmed — no verification needed
        user_metadata:    { role: "member", full_name: full_name.trim() },
      });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const userId = created.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    // Upsert profile
    const { error: profileError } = await admin.from("profiles").upsert({
      id:        userId,
      email:     email.trim(),
      full_name: full_name.trim(),
      phone:     phone.trim(),
      role:      "member",
    });
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Create members row — 30-day subscription from joined_date (or today)
    const subStart = joined_date?.trim() || new Date().toISOString().slice(0, 10);
    const subEnd   = (() => {
      const d = new Date(subStart);
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    })();
    const slug     = full_name.trim().toLowerCase().replace(/\s+/g, "-")
                       + "-" + userId.slice(0, 6);

    const { error: memberError } = await admin.from("members").insert({
      id:                 userId,
      slug,
      profession:         profession?.trim() || null,
      subscription_start: subStart,
      subscription_end:   subEnd,
      is_active:          true,
      is_public:          false,
    });
    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // Record payment only if amount > 0 (member may pay later)
    let paymentId: string | null = null;
    if (amountPaid > 0) {
      const { data: payment, error: payError } = await admin
        .from("membership_payments")
        .insert({
          profile_id:  userId,
          amount:      amountPaid,
          method,
          reference:   reference?.trim() || null,
          recorded_by: user.id,
        })
        .select("id")
        .single();

      if (payError) {
        return NextResponse.json({ error: payError.message }, { status: 500 });
      }
      paymentId = payment.id;
    }

    // Return temp password so receptionist can hand it to the member
    return NextResponse.json({
      success:       true,
      member_id:     userId,
      profile_id:    userId,
      payment_id:    paymentId,
      temp_password: password,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
