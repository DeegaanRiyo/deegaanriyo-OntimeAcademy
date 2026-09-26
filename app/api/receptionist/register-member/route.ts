import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const admin = createAdminClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["receptionist", "owner", "manager", "admin"].includes(caller?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as {
      full_name:         string;
      email?:            string;
      phone:             string;
      profession?:       string;
      membership_fee:    number;
      amount:            number;
      method:            "cash" | "mpesa";
      reference?:        string;
      notes?:            string;
      joined_date?:      string;   // YYYY-MM-DD; defaults to today if omitted
      subscription_days?: number;  // how many days the subscription lasts (default 30)
    };

    const { full_name, email, phone, profession, membership_fee, amount, method, reference, notes, joined_date, subscription_days } = body;

    if (!full_name?.trim() || !phone?.trim() || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!membership_fee || membership_fee <= 0) {
      return NextResponse.json({ error: "Membership fee must be greater than zero" }, { status: 400 });
    }

    const amountPaid = Math.round(Number(amount) || 0);
    const hasEmail   = !!email?.trim();

    let userId: string;
    let password: string | null = null;

    if (hasEmail) {
      // Create a full platform account so the member can log in
      password = tempPassword();
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email:         email!.trim(),
          password,
          email_confirm: true,
          user_metadata: { role: "member", full_name: full_name.trim() },
        });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
      if (!created.user?.id) {
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      }
      userId = created.user.id;

      // Upsert profile
      const { error: profileError } = await admin.from("profiles").upsert({
        id:        userId,
        email:     email!.trim(),
        full_name: full_name.trim(),
        phone:     phone.trim(),
        role:      "member",
      });
      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }
    } else {
      // No email — create a walk-in profile row without an auth account
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .insert({
          full_name: full_name.trim(),
          phone:     phone.trim(),
          role:      "member",
        })
        .select("id")
        .single();
      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }
      userId = profile.id;
    }

    // Create members row — subscription from joined_date (or today)
    const subDays  = subscription_days && subscription_days > 0 ? subscription_days : 30;
    const subStart = joined_date?.trim() || new Date().toISOString().slice(0, 10);
    const subEnd   = (() => {
      const d = new Date(subStart);
      d.setDate(d.getDate() + subDays);
      return d.toISOString().slice(0, 10);
    })();
    const slug     = full_name.trim().toLowerCase().replace(/\s+/g, "-")
                       + "-" + userId.slice(0, 6);

    const { error: memberError } = await admin.from("members").insert({
      id:                 userId,
      slug,
      profession:         profession?.trim() || null,
      membership_fee:     Math.round(membership_fee),
      subscription_start: subStart,
      subscription_end:   subEnd,
      subscription_days:  subDays,
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

    // Return temp password only when an auth account was created
    return NextResponse.json({
      success:       true,
      member_id:     userId,
      profile_id:    userId,
      payment_id:    paymentId,
      temp_password: password ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
