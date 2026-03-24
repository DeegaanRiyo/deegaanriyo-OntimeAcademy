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

  // If membership, get subscription_end
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
      {/* Print styles — hides dashboard chrome */}
      <style>{`
        @media print {
          #sidebar, .topbar, .no-print { display: none !important; }
          .dash-main { margin: 0 !important; padding: 0 !important; }
          .dash-content { padding: 0 !important; }
          body { background: #fff !important; color: #000 !important; }
        }
      `}</style>

      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        {/* Back + Print */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "20px" }}>
          <a href="/dashboard/receptionist/members"
            style={{ color: "var(--teal2)", fontSize: ".82rem", textDecoration: "none" }}>
            <i className="fas fa-arrow-left" style={{ marginRight: "6px" }} />Back to Members
          </a>
          <PrintButton />
        </div>

        {/* Receipt card */}
        <div style={{
          background: "var(--dark2)", border: "1px solid var(--border)",
          borderRadius: "12px", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, var(--teal), var(--teal2))",
            padding: "24px 28px",
          }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", marginBottom: "2px" }}>
              Ontime<span style={{ fontWeight: 300 }}>CWS</span>
            </div>
            <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.75)" }}>
              Academy & Co-working Space · Nairobi
            </div>
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between",
              alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: ".65rem", color: "rgba(255,255,255,.6)",
                  textTransform: "uppercase", letterSpacing: ".08em" }}>Receipt</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{receiptNo}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: ".65rem", color: "rgba(255,255,255,.6)",
                  textTransform: "uppercase", letterSpacing: ".08em" }}>Date</div>
                <div style={{ fontSize: ".8rem", color: "#fff" }}>{fmt(payment.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "24px 28px" }}>
            {/* Type badge */}
            <div style={{ marginBottom: "20px" }}>
              <span style={{
                background: "rgba(15,179,187,.12)", border: "1px solid rgba(15,179,187,.3)",
                color: "var(--teal2)", borderRadius: "6px", padding: "4px 12px",
                fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em",
              }}>
                {TYPE_LABELS[payment.type] ?? payment.type}
              </span>
            </div>

            {/* Customer */}
            <Section label="Received From">
              <Row label="Name"  value={payment.customer_name} />
              <Row label="Phone" value={payment.customer_phone} />
              {payment.customer_email && <Row label="Email" value={payment.customer_email} />}
            </Section>

            <Divider />

            {/* Payment */}
            <Section label="Payment Details">
              <Row label="Amount"  value={`KES ${payment.amount.toLocaleString()}`} bold />
              <Row label="Method"  value={METHOD_LABELS[payment.method] ?? payment.method} />
              {payment.reference && <Row label="Reference" value={payment.reference} />}
              {payment.type === "membership" && subEnd && (
                <Row label="Valid Until" value={fmtDate(subEnd)} highlight />
              )}
            </Section>

            {payment.notes && (
              <>
                <Divider />
                <Section label="Notes">
                  <p style={{ margin: 0, fontSize: ".8rem", color: "var(--muted)",
                    lineHeight: 1.6 }}>{payment.notes}</p>
                </Section>
              </>
            )}

            <Divider />

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between",
              fontSize: ".7rem", color: "var(--muted)" }}>
              <span>Recorded by: {recorder}</span>
              <span>{receiptNo}</span>
            </div>

            <div style={{ marginTop: "16px", padding: "12px", borderRadius: "8px",
              background: "rgba(15,179,187,.05)", border: "1px solid rgba(15,179,187,.12)",
              fontSize: ".72rem", color: "var(--muted)", textAlign: "center" }}>
              Thank you for choosing Ontime Academy & Co-working Space.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: ".65rem", fontWeight: 700, color: "var(--muted)",
        textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "8px" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, bold, highlight }: {
  label: string; value: string; bold?: boolean; highlight?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between",
      padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: ".82rem" }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{
        fontWeight: bold ? 700 : 500,
        color: highlight ? "var(--teal2)" : "var(--white)",
      }}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid var(--border)", margin: "16px 0" }} />;
}
