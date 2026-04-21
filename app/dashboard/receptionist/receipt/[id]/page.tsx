import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import PrintButton from "./PrintButton";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

const TYPE_LABELS: Record<string, string> = {
  membership:     "Co-working Membership",
  physical_class: "Physical Class",
  space_rental:   "Space Rental",
};

const METHOD_LABELS: Record<string, string> = {
  cash:          "Cash",
  bank_transfer: "Bank Transfer",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Africa/Nairobi",
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
    timeZone: "Africa/Nairobi",
  });
}

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = serviceClient();

  const { data: payment } = await admin
    .from("walk_in_payments")
    .select(`
      id, type, customer_name, customer_phone, customer_email,
      amount, method, reference, notes, created_at, profile_id,
      recorder:profiles!recorded_by(full_name, username)
    `)
    .eq("id", params.id)
    .single();

  if (!payment) redirect("/dashboard/receptionist/members");

  let subEnd: string | null = null;
  if (payment.profile_id) {
    const { data: mem } = await admin
      .from("members")
      .select("subscription_end")
      .eq("id", payment.profile_id)
      .single();
    subEnd = mem?.subscription_end ?? null;
  }

  const receiptNo = `RCP-${payment.id.slice(0, 8).toUpperCase()}`;
  const recorder  = (payment.recorder as any)?.full_name
                      || (payment.recorder as any)?.username
                      || "Staff";

  return (
    <>
      {/* ── Print + page styles ─────────────────────────────────── */}
      <style>{`
        @media print {
          #sidebar, .topbar, .no-print { display: none !important; }
          .dash-main { margin: 0 !important; padding: 0 !important; }
          .dash-content { padding: 0 !important; }
          body { background: #fff !important; }
          .receipt-shell { padding: 0 !important; }
          .receipt-card {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            max-width: 100% !important;
          }
        }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 9px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: .83rem;
        }
        .receipt-row:last-child { border-bottom: none; }
        .receipt-row .rl { color: #6b7280; }
        .receipt-row .rv { color: #111; font-weight: 500; text-align: right; }
        .receipt-row .rv.bold { font-weight: 800; font-size: .95rem; }
        .receipt-row .rv.accent { color: #C1440E; font-weight: 700; }

        .sec-label {
          font-size: .6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .12em;
          color: #9ca3af;
          margin-bottom: 6px;
        }

        .receipt-divider {
          border: none;
          border-top: 1px dashed #d1d5db;
          margin: 18px 0;
        }
      `}</style>

      <div className="receipt-shell" style={{ maxWidth: "560px", margin: "0 auto", padding: "8px 0 40px" }}>

        {/* ── Toolbar (no-print) ────────────────────────────────── */}
        <div className="no-print" style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "20px",
        }}>
          <a href="/dashboard/receptionist/members" style={{
            color: "var(--teal2)", fontSize: ".82rem", textDecoration: "none",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <i className="fas fa-arrow-left" /> Back to Members
          </a>
          <PrintButton />
        </div>

        {/* ── Receipt card ──────────────────────────────────────── */}
        <div className="receipt-card" style={{
          background: "#fff",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 32px rgba(0,0,0,.08)",
          overflow: "hidden",
          color: "#111",
        }}>

          {/* ── HEADER ─────────────────────────────────────────── */}
          <div style={{
            padding: "28px 32px 24px",
            borderBottom: "2px solid #111",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>

              {/* Brand block */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.jpeg"
                  alt="Ontime Academy"
                  width={56}
                  height={56}
                  style={{ objectFit: "contain", borderRadius: "10px" }}
                />
                <div>
                  <div style={{
                    fontSize: "1.15rem", fontWeight: 900, color: "#111",
                    letterSpacing: "-.02em", lineHeight: 1.1,
                  }}>
                    Ontime<span style={{ color: "#C1440E" }}>Academy</span>
                  </div>
                  <div style={{ fontSize: ".68rem", color: "#6b7280", marginTop: "3px", lineHeight: 1.5 }}>
                    Academy & Co-working Space<br />
                    Nairobi, Kenya
                  </div>
                </div>
              </div>

              {/* Receipt meta */}
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: ".12em", color: "#9ca3af", marginBottom: "4px",
                }}>
                  Official Receipt
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111", letterSpacing: ".02em" }}>
                  {receiptNo}
                </div>
                <div style={{ fontSize: ".72rem", color: "#6b7280", marginTop: "4px" }}>
                  {fmt(payment.created_at)}
                </div>
              </div>

            </div>

            {/* Type badge */}
            <div style={{ marginTop: "20px" }}>
              <span style={{
                background: "#111", color: "#fff",
                borderRadius: "4px", padding: "3px 12px",
                fontSize: ".65rem", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: ".1em",
              }}>
                {TYPE_LABELS[payment.type] ?? payment.type}
              </span>
            </div>
          </div>

          {/* ── BODY ────────────────────────────────────────────── */}
          <div style={{ padding: "24px 32px" }}>

            {/* Received from */}
            <div style={{ marginBottom: "20px" }}>
              <div className="sec-label">Received From</div>
              <div className="receipt-row">
                <span className="rl">Full Name</span>
                <span className="rv">{payment.customer_name}</span>
              </div>
              <div className="receipt-row">
                <span className="rl">Phone</span>
                <span className="rv">{payment.customer_phone}</span>
              </div>
              {payment.customer_email && (
                <div className="receipt-row">
                  <span className="rl">Email</span>
                  <span className="rv">{payment.customer_email}</span>
                </div>
              )}
            </div>

            <hr className="receipt-divider" />

            {/* Payment details */}
            <div style={{ marginBottom: "20px" }}>
              <div className="sec-label">Payment Details</div>
              <div className="receipt-row">
                <span className="rl">Service</span>
                <span className="rv">{TYPE_LABELS[payment.type] ?? payment.type}</span>
              </div>
              <div className="receipt-row">
                <span className="rl">Payment Method</span>
                <span className="rv">{METHOD_LABELS[payment.method] ?? payment.method}</span>
              </div>
              {payment.reference && (
                <div className="receipt-row">
                  <span className="rl">Reference / Receipt No.</span>
                  <span className="rv">{payment.reference}</span>
                </div>
              )}
              {payment.type === "membership" && subEnd && (
                <div className="receipt-row">
                  <span className="rl">Membership Valid Until</span>
                  <span className="rv accent">{fmtDate(subEnd)}</span>
                </div>
              )}
            </div>

            {/* Amount — prominent */}
            <div style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}>
              <div>
                <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#9ca3af", marginBottom: "2px" }}>
                  Amount Paid
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#111", letterSpacing: "-.02em" }}>
                  KES {payment.amount.toLocaleString()}
                </div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(22,163,74,.1)", border: "1.5px solid rgba(22,163,74,.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#16a34a", fontSize: "1.1rem",
              }}>
                <i className="fas fa-check" />
              </div>
            </div>

            {/* Notes */}
            {payment.notes && (
              <>
                <hr className="receipt-divider" />
                <div style={{ marginBottom: "20px" }}>
                  <div className="sec-label">Notes</div>
                  <p style={{
                    margin: 0, fontSize: ".8rem", color: "#6b7280",
                    lineHeight: 1.65, background: "#f9fafb",
                    border: "1px solid #e5e7eb", borderRadius: "8px",
                    padding: "10px 14px",
                  }}>
                    {payment.notes}
                  </p>
                </div>
              </>
            )}

            <hr className="receipt-divider" />

            {/* Thank you + footer meta */}
            <div style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "14px 18px",
              textAlign: "center",
              marginBottom: "18px",
            }}>
              <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#111", marginBottom: "3px" }}>
                Thank you for choosing Ontime Academy!
              </div>
              <div style={{ fontSize: ".72rem", color: "#9ca3af" }}>
                This is an official payment receipt. Please retain for your records.
              </div>
            </div>

            {/* Footer row */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: ".68rem", color: "#9ca3af",
            }}>
              <span>Recorded by: <strong style={{ color: "#6b7280" }}>{recorder}</strong></span>
              <span>{receiptNo}</span>
            </div>

          </div>

          {/* ── BOTTOM ACCENT STRIP ─────────────────────────────── */}
          <div style={{
            height: "5px",
            background: "linear-gradient(90deg, #C1440E, #E05520, #C1440E)",
          }} />
        </div>
      </div>
    </>
  );
}
