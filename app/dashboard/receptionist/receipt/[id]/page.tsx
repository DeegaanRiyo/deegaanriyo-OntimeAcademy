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
  new:          "New Student Registration",
  current_old:  "Current / Returning Student",
  zoom_virtual: "Zoom / Virtual Student",
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

const COLORS = {
  black:   "#111111",
  mid:     "#374151",
  muted:   "#6b7280",
  faint:   "#9ca3af",
  border:  "#e5e7eb",
  bg:      "#f9fafb",
  brand:   "#C1440E",
  green:   "#16a34a",
  amber:   "#b45309",
  greenBg: "rgba(22,163,74,.08)",
  greenBd: "rgba(22,163,74,.25)",
  amberBg: "rgba(180,83,9,.08)",
  amberBd: "rgba(180,83,9,.25)",
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

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = serviceClient();

  // Try student_registrations first (new schema)
  const { data: reg } = await admin
    .from("student_registrations")
    .select(`
      id, student_type, customer_name, customer_phone, customer_email,
      course_fee_monthly, registration_fee, total_due,
      amount, method, reference, notes, created_at,
      recorder:profiles!student_registrations_recorded_by_fkey(full_name)
    `)
    .eq("id", params.id)
    .single();

  if (!reg) redirect("/dashboard/receptionist/students");

  const receiptNo  = `RCP-${reg.id.slice(0, 8).toUpperCase()}`;
  const recorder   = (reg.recorder as any)?.full_name ?? "Staff";
  const balance    = reg.total_due != null ? reg.total_due - reg.amount : null;
  const hasBalance = balance !== null && balance > 0;

  return (
    <>
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
          .print-shell { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .print-card  { border: none !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: "580px", margin: "0 auto", padding: "4px 0 48px" }}>

        {/* Toolbar */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <a href="/dashboard/receptionist/students" style={{ color: "#C1440E", fontSize: ".82rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
            <i className="fas fa-arrow-left" /> Back to Students
          </a>
          <PrintButton />
        </div>

        {/* Receipt card */}
        <div className="print-card" style={{
          background: COLORS.white, borderRadius: "16px",
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 8px 40px rgba(0,0,0,.10)",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>

          {/* HEADER */}
          <div style={{ padding: "28px 32px 22px", borderBottom: `2.5px solid ${COLORS.black}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpeg" alt="Ontime Academy" width={60} height={60}
                  style={{ objectFit: "contain", borderRadius: "10px", display: "block" }} />
                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.black, lineHeight: 1.1, letterSpacing: "-.02em" }}>
                    Ontime<span style={{ color: COLORS.brand }}>Academy</span>
                  </div>
                  <div style={{ fontSize: ".7rem", color: COLORS.muted, marginTop: "4px", lineHeight: 1.6 }}>
                    Academy & Co-working Space<br />Nairobi, Kenya
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: ".58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".14em", color: COLORS.faint, marginBottom: "4px" }}>
                  Official Receipt
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: COLORS.black, letterSpacing: ".04em" }}>{receiptNo}</div>
                <div style={{ fontSize: ".72rem", color: COLORS.muted, marginTop: "5px", lineHeight: 1.5 }}>
                  {fmt(reg.created_at)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: "18px" }}>
              <span style={{
                display: "inline-block", background: COLORS.black, color: COLORS.white,
                borderRadius: "4px", padding: "4px 14px",
                fontSize: ".62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em",
              }}>
                {TYPE_LABELS[reg.student_type] ?? reg.student_type}
              </span>
            </div>
          </div>

          {/* BODY */}
          <div style={{ padding: "26px 32px" }}>

            {/* Received from */}
            <SectionLabel>Received From</SectionLabel>
            <Row label="Full Name" value={reg.customer_name} />
            <Row label="Phone"     value={reg.customer_phone} />
            {reg.customer_email && <Row label="Email" value={reg.customer_email} />}

            <Divider />

            {/* Fee Breakdown */}
            <SectionLabel>Fee Breakdown</SectionLabel>
            {reg.course_fee_monthly != null && (
              <Row label="Monthly Course Fee" value={`KES ${reg.course_fee_monthly.toLocaleString()}`} />
            )}
            {reg.registration_fee != null && reg.registration_fee > 0 && (
              <Row label="Registration Fee" value={`KES ${reg.registration_fee.toLocaleString()}`} />
            )}
            {reg.total_due != null && (
              <Row label="Total Due" value={`KES ${reg.total_due.toLocaleString()}`} bold />
            )}
            <Row label="Payment Method" value={METHOD_LABELS[reg.method] ?? reg.method} />
            {reg.reference && <Row label="Reference / Code" value={reg.reference} />}

            <Divider />

            {/* Amount paid block */}
            <div style={{
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              borderRadius: "12px", padding: "18px 22px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: hasBalance ? "12px" : "20px",
            }}>
              <div>
                <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: COLORS.faint, marginBottom: "4px" }}>
                  Amount Paid
                </div>
                <div style={{ fontSize: "1.9rem", fontWeight: 900, color: COLORS.black, letterSpacing: "-.02em", lineHeight: 1 }}>
                  KES {reg.amount.toLocaleString()}
                </div>
              </div>
              <div style={{
                width: 46, height: 46, borderRadius: "50%",
                background: COLORS.greenBg, border: `2px solid ${COLORS.greenBd}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: COLORS.green, fontSize: "1.15rem", flexShrink: 0,
              }}>
                <i className="fas fa-check" />
              </div>
            </div>

            {/* Outstanding balance (if partial) */}
            {hasBalance && (
              <div style={{
                background: COLORS.amberBg, border: `1px solid ${COLORS.amberBd}`,
                borderRadius: "10px", padding: "13px 18px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: ".82rem", color: COLORS.amber, fontWeight: 700 }}>
                  <i className="fas fa-clock" />
                  Balance Outstanding
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: COLORS.amber }}>
                  KES {balance!.toLocaleString()}
                </div>
              </div>
            )}

            {/* Notes */}
            {reg.notes && (
              <>
                <SectionLabel>Notes</SectionLabel>
                <div style={{
                  background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px", padding: "11px 14px",
                  fontSize: ".82rem", color: COLORS.mid, lineHeight: 1.65, marginBottom: "18px",
                }}>
                  {reg.notes}
                </div>
              </>
            )}

            <Divider />

            {/* Thank-you */}
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

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".68rem", color: COLORS.faint }}>
              <span>Recorded by: <strong style={{ color: COLORS.muted }}>{recorder}</strong></span>
              <span style={{ letterSpacing: ".04em" }}>{receiptNo}</span>
            </div>
          </div>

          {/* Bottom stripe */}
          <div style={{ height: "6px", background: `linear-gradient(90deg, ${COLORS.brand}, #E05520, ${COLORS.brand})` }} />
        </div>
      </div>
    </>
  );
}
