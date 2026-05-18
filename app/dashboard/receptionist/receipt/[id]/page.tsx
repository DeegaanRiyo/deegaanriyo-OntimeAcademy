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
  online_class:   "Online Class",
  space_rental:   "Space Rental",
};

const METHOD_LABELS: Record<string, string> = {
  cash:          "Cash",
  mpesa:         "M-Pesa",
  bank_transfer: "Bank Transfer",
  both:          "Cash + M-Pesa",
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

// ── Inline-style primitives (no CSS variables — safe for print) ─────────────

const COLORS = {
  black:   "#111111",
  mid:     "#374151",
  muted:   "#6b7280",
  faint:   "#9ca3af",
  border:  "#e5e7eb",
  bg:      "#f9fafb",
  brand:   "#C1440E",
  green:   "#16a34a",
  greenBg: "rgba(22,163,74,.08)",
  greenBd: "rgba(22,163,74,.25)",
  white:   "#ffffff",
};

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0", borderBottom: `1px solid ${COLORS.border}`,
    }}>
      <span style={{ fontSize: ".83rem", color: COLORS.mid }}>{label}</span>
      <span style={{
        fontSize: bold ? ".95rem" : ".84rem",
        fontWeight: bold ? 800 : 600,
        color: accent ? COLORS.brand : COLORS.black,
        textAlign: "right",
      }}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase" as const,
      letterSpacing: ".1em", color: COLORS.muted, marginBottom: "8px",
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: `1px dashed ${COLORS.border}`, margin: "18px 0" }} />;
}

// ─────────────────────────────────────────────────────────────────────────────

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
      .from("members").select("subscription_end").eq("id", payment.profile_id).single();
    subEnd = mem?.subscription_end ?? null;
  }

  const receiptNo = `RCP-${payment.id.slice(0, 8).toUpperCase()}`;
  const recorder  = (payment.recorder as any)?.full_name || (payment.recorder as any)?.username || "Staff";

  return (
    <>
      {/* Print CSS — hides dashboard chrome, forces white, preserves colors */}
      <style>{`
        @media print {
          #sidebar, nav, .topbar, .no-print,
          [class*="sidebar"], [class*="topbar"], [class*="nav-"] {
            display: none !important;
          }
          body, html {
            background: #fff !important;
            color: #111 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-shell {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-card {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Wrapper */}
      <div style={{ maxWidth: "580px", margin: "0 auto", padding: "4px 0 48px" }}>

        {/* ── Toolbar — hidden on print ─────────────────────────── */}
        <div className="no-print" style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "20px",
        }}>
          <a href="/dashboard/receptionist/members" style={{
            color: "#C1440E", fontSize: ".82rem", textDecoration: "none",
            display: "flex", alignItems: "center", gap: "6px", fontWeight: 600,
          }}>
            <i className="fas fa-arrow-left" /> Back to Members
          </a>
          <PrintButton />
        </div>

        {/* ── Receipt card ─────────────────────────────────────── */}
        <div className="print-card" style={{
          background: COLORS.white,
          borderRadius: "16px",
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 8px 40px rgba(0,0,0,.10)",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>

          {/* ── HEADER ────────────────────────────────────────── */}
          <div style={{ padding: "28px 32px 22px", borderBottom: `2.5px solid ${COLORS.black}` }}>

            {/* Logo row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>

              {/* Brand */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.jpeg"
                  alt="Ontime Academy"
                  width={60}
                  height={60}
                  style={{ objectFit: "contain", borderRadius: "10px", display: "block" }}
                />
                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.black, lineHeight: 1.1, letterSpacing: "-.02em" }}>
                    Ontime<span style={{ color: COLORS.brand }}>Academy</span>
                  </div>
                  <div style={{ fontSize: ".7rem", color: COLORS.muted, marginTop: "4px", lineHeight: 1.6 }}>
                    Academy & Co-working Space<br />
                    Nairobi, Kenya
                  </div>
                </div>
              </div>

              {/* Receipt number + date */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: ".58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".14em", color: COLORS.faint, marginBottom: "4px" }}>
                  Official Receipt
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: COLORS.black, letterSpacing: ".04em" }}>
                  {receiptNo}
                </div>
                <div style={{ fontSize: ".72rem", color: COLORS.muted, marginTop: "5px", lineHeight: 1.5 }}>
                  {fmt(payment.created_at)}
                </div>
              </div>
            </div>

            {/* Service type badge */}
            <div style={{ marginTop: "18px" }}>
              <span style={{
                display: "inline-block",
                background: COLORS.black, color: COLORS.white,
                borderRadius: "4px", padding: "4px 14px",
                fontSize: ".62rem", fontWeight: 800,
                textTransform: "uppercase", letterSpacing: ".12em",
              }}>
                {TYPE_LABELS[payment.type] ?? payment.type}
              </span>
            </div>
          </div>

          {/* ── BODY ──────────────────────────────────────────── */}
          <div style={{ padding: "26px 32px" }}>

            {/* Received from */}
            <div style={{ marginBottom: "4px" }}>
              <SectionLabel>Received From</SectionLabel>
              <Row label="Full Name" value={payment.customer_name} />
              <Row label="Phone"     value={payment.customer_phone} />
              {payment.customer_email && (
                <Row label="Email" value={payment.customer_email} />
              )}
            </div>

            <Divider />

            {/* Payment details */}
            <div style={{ marginBottom: "4px" }}>
              <SectionLabel>Payment Details</SectionLabel>
              <Row label="Service"        value={TYPE_LABELS[payment.type] ?? payment.type} />
              <Row label="Payment Method" value={METHOD_LABELS[payment.method] ?? payment.method} />
              {payment.reference && (
                <Row label="M-Pesa Code / Ref" value={payment.reference} />
              )}
              {payment.type === "membership" && subEnd && (
                <Row label="Membership Valid Until" value={fmtDate(subEnd)} accent />
              )}
            </div>

            <Divider />

            {/* Amount — large prominent block */}
            <div style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "18px 22px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}>
              <div>
                <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: COLORS.faint, marginBottom: "4px" }}>
                  Amount Paid
                </div>
                <div style={{ fontSize: "1.9rem", fontWeight: 900, color: COLORS.black, letterSpacing: "-.02em", lineHeight: 1 }}>
                  KES {payment.amount.toLocaleString()}
                </div>
              </div>
              <div style={{
                width: 46, height: 46, borderRadius: "50%",
                background: COLORS.greenBg,
                border: `2px solid ${COLORS.greenBd}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: COLORS.green, fontSize: "1.15rem", flexShrink: 0,
              }}>
                <i className="fas fa-check" />
              </div>
            </div>

            {/* Notes */}
            {payment.notes && (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <SectionLabel>Notes</SectionLabel>
                  <div style={{
                    background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px", padding: "11px 14px",
                    fontSize: ".82rem", color: COLORS.mid, lineHeight: 1.65,
                  }}>
                    {payment.notes}
                  </div>
                </div>
                <Divider />
              </>
            )}

            {!payment.notes && <Divider />}

            {/* Thank-you banner */}
            <div style={{
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              borderRadius: "10px", padding: "14px 18px",
              textAlign: "center", marginBottom: "18px",
            }}>
              <div style={{ fontSize: ".85rem", fontWeight: 800, color: COLORS.black, marginBottom: "3px" }}>
                Thank you for choosing Ontime Academy!
              </div>
              <div style={{ fontSize: ".72rem", color: COLORS.faint }}>
                This is an official payment receipt. Please retain for your records.
              </div>
            </div>

            {/* Footer meta */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: ".68rem", color: COLORS.faint,
            }}>
              <span>Recorded by: <strong style={{ color: COLORS.muted }}>{recorder}</strong></span>
              <span style={{ letterSpacing: ".04em" }}>{receiptNo}</span>
            </div>
          </div>

          {/* ── BOTTOM STRIPE ──────────────────────────────────── */}
          <div style={{ height: "6px", background: `linear-gradient(90deg, ${COLORS.brand}, #E05520, ${COLORS.brand})` }} />
        </div>
      </div>
    </>
  );
}
