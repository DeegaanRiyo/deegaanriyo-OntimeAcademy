"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────

interface StudentReceipt {
  id:                  string;
  student_type:        string;
  customer_name:       string;
  customer_phone:      string;
  customer_email:      string | null;
  course_name:         string | null;
  course_fee_monthly:  number | null;
  registration_fee:    number | null;
  total_due:           number | null;
  amount:              number;
  method:              string;
  reference:           string | null;
  notes:               string | null;
  created_at:          string;
  recorder:            { full_name: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", mpesa: "M-Pesa", bank_transfer: "Bank Transfer", both: "Cash + M-Pesa",
};

const TYPE_LABELS: Record<string, string> = {
  new: "New Student", current_old: "Current / Old Student", zoom_virtual: "Zoom / Virtual Student",
};

function fmt(n: number) { return (n || 0).toLocaleString("en-KE"); }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Nairobi",
  });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi",
  });
}
function toWA(phone: string) {
  const c = phone.replace(/\D/g, "");
  if (c.startsWith("254")) return c;
  if (c.startsWith("0") && c.length >= 10) return "254" + c.slice(1);
  return c;
}
function buildWAText(r: StudentReceipt): string {
  const receiptNo = `REG-${r.id.slice(0, 8).toUpperCase()}`;
  const balance   = (r.total_due || 0) - r.amount;
  const lines = [
    "*ONTIME ACADEMY*",
    `Receipt: *${receiptNo}*`,
    `Date: ${fmtDate(r.created_at)}`,
    "",
    `*Student:* ${r.customer_name}`,
    `*Phone:* ${r.customer_phone}`,
    `*Type:* ${TYPE_LABELS[r.student_type] || r.student_type}`,
    r.course_name ? `*Course:* ${r.course_name}` : "",
    "",
    r.total_due ? `*Total Due:* KES ${fmt(r.total_due)}` : "",
    `*Paid Now:* KES ${fmt(r.amount)} (${METHOD_LABELS[r.method] || r.method})`,
    r.reference ? `*Ref:* ${r.reference}` : "",
    balance > 0 ? `*Balance Outstanding:* KES ${fmt(balance)}` : "",
    "",
    "_Thank you for joining Ontime Academy!_",
    "_Nairobi, Kenya_",
  ];
  return lines.filter(Boolean).join("\n");
}

// ── Receipt Preview ───────────────────────────────────────────

function ReceiptPreview({ r, logoSrc }: { r: StudentReceipt; logoSrc: string }) {
  const receiptNo  = `REG-${r.id.slice(0, 8).toUpperCase()}`;
  const recorder   = r.recorder?.full_name ?? "Staff";
  const balance    = (r.total_due || 0) - r.amount;
  const hasBalance = balance > 0;
  const hr = <hr style={{ border: "none", borderTop: "1px dashed #d1d5db", margin: "10px 0" }} />;

  return (
    <div style={{ fontFamily: "'Calibri','Trebuchet MS',Arial,sans-serif", fontSize: 12, color: "#111" }}>

      {/* Brand bar */}
      <div style={{ height: 4, background: "linear-gradient(90deg,#C1440E,#E05520,#C1440E)", borderRadius: 2, marginBottom: 14 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 12, marginBottom: 12, borderBottom: "1.5px solid #fde8e0" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="Ontime Academy" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "contain", flexShrink: 0, border: "2px solid #fde8e0" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3, color: "#C1440E" }}>ONTIME ACADEMY</div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Academy & Co-working Space · Nairobi, Kenya</div>
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ background: "#25d366", color: "#fff", fontWeight: 800, fontSize: 8, padding: "2px 5px", borderRadius: 3 }}>WhatsApp</span>
            <span style={{ fontSize: 10, color: "#555" }}>+254 746 628 668</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ background: "#C1440E", color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: 2, padding: "5px 13px", borderRadius: 6, display: "inline-block" }}>RECEIPT</div>
          <div style={{ fontWeight: 700, fontSize: 11, marginTop: 5, color: "#C1440E" }}>{receiptNo}</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{fmtDate(r.created_at)}</div>
        </div>
      </div>

      {/* Badge */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ background: "#111", color: "#fff", borderRadius: 4, padding: "3px 12px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.2 }}>
          Student Enrollment · {TYPE_LABELS[r.student_type] || r.student_type}
        </span>
      </div>

      {/* Client info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px 16px", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, color: "#888", marginBottom: 1 }}>Student</div>
          <div style={{ fontWeight: 700, fontSize: 11 }}>{r.customer_name}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, color: "#888", marginBottom: 1 }}>Phone</div>
          <div style={{ fontSize: 11 }}>{r.customer_phone}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, color: "#888", marginBottom: 1 }}>Date</div>
          <div style={{ fontSize: 11 }}>{fmtDate(r.created_at)}</div>
        </div>
      </div>

      {r.customer_email && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, color: "#888", marginBottom: 1 }}>Email</div>
          <div style={{ fontSize: 11 }}>{r.customer_email}</div>
        </div>
      )}

      {hr}

      {/* Fee table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 2 }}>
        <thead>
          <tr style={{ background: "#fff5f3", borderTop: "1px solid #fde8e0", borderBottom: "1px solid #fde8e0" }}>
            <th style={{ textAlign: "left",  padding: "5px 8px", fontWeight: 700, fontSize: 9, color: "#C1440E", textTransform: "uppercase", letterSpacing: 0.8 }}>Description</th>
            <th style={{ textAlign: "right", padding: "5px 8px", fontWeight: 700, fontSize: 9, color: "#C1440E", textTransform: "uppercase", letterSpacing: 0.8 }}>Amount (KES)</th>
          </tr>
        </thead>
        <tbody>
          {r.course_name && (
            <tr style={{ borderBottom: "1px dashed #e5e7eb" }}>
              <td style={{ padding: "5px 8px" }}>Course — {r.course_name}</td>
              <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 600 }}>{fmt(r.course_fee_monthly || 0)}</td>
            </tr>
          )}
          {r.registration_fee != null && r.registration_fee > 0 && (
            <tr style={{ borderBottom: "1px dashed #e5e7eb" }}>
              <td style={{ padding: "5px 8px" }}>Registration Fee</td>
              <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 600 }}>{fmt(r.registration_fee)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {hr}

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <div style={{ minWidth: 240, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px" }}>
          {r.total_due != null && (
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #C1440E", paddingBottom: 6, marginBottom: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#C1440E" }}>TOTAL DUE</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#111" }}>KES {fmt(r.total_due)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginBottom: hasBalance ? 4 : 0 }}>
            <span style={{ color: "#555" }}>
              Paid via&nbsp;
              {r.method === "cash"
                ? <span style={{ background: "#f0fdf4", color: "#15803d", fontWeight: 700, fontSize: 8, padding: "1px 6px", borderRadius: 3, border: "1px solid #bbf7d0" }}>CASH</span>
                : r.method === "mpesa"
                ? <span style={{ background: "#15803d", color: "#fff", fontWeight: 800, fontSize: 7, padding: "2px 5px", borderRadius: 3 }}>M·PESA</span>
                : <span style={{ background: "#1d4ed8", color: "#fff", fontWeight: 800, fontSize: 7, padding: "2px 5px", borderRadius: 3 }}>BANK</span>
              }
            </span>
            <span style={{ fontWeight: 700, color: "#15803d" }}>KES {fmt(r.amount)}</span>
          </div>
          {hasBalance && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4, paddingTop: 4, borderTop: "1px dashed #fca5a5" }}>
              <span style={{ color: "#dc2626", fontWeight: 600 }}>Balance Due</span>
              <span style={{ fontWeight: 700, color: "#dc2626" }}>KES {fmt(balance)}</span>
            </div>
          )}
          {r.reference && (
            <div style={{ fontSize: 9, color: "#888", marginTop: 5 }}>Ref: {r.reference}</div>
          )}
        </div>
      </div>

      {/* Notes */}
      {r.notes && (
        <>
          {hr}
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 7, padding: "9px 12px", fontSize: 11, color: "#374151", lineHeight: 1.6, marginBottom: 10 }}>
            <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, color: "#888", display: "block", marginBottom: 3 }}>Notes</span>
            {r.notes}
          </div>
        </>
      )}

      {hr}

      {/* Footer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 4 }}>
        <div>
          <div style={{ fontSize: 9, color: "#555" }}>Recorded by</div>
          <div style={{ fontWeight: 700, fontSize: 10, marginTop: 1 }}>{recorder}</div>
          <div style={{ fontSize: 9, color: "#aaa", marginTop: 1 }}>{fmtDateTime(r.created_at)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#555", marginBottom: 14 }}>Student signature</div>
          <div style={{ borderBottom: "1px solid #888", width: "80%" }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "#555" }}>Thank you for joining</div>
          <div style={{ fontWeight: 700, fontSize: 10 }}>Ontime Academy!</div>
          <div style={{ fontSize: 9, color: "#aaa", marginTop: 2 }}>{receiptNo}</div>
        </div>
      </div>
    </div>
  );
}

// ── Print HTML builder ────────────────────────────────────────

function buildPrintHTML(r: StudentReceipt, logoSrc: string): string {
  const receiptNo  = `REG-${r.id.slice(0, 8).toUpperCase()}`;
  const recorder   = r.recorder?.full_name ?? "Staff";
  const balance    = (r.total_due || 0) - r.amount;
  const hasBalance = balance > 0;

  function esc(s: string | null | undefined) {
    return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const methodBadge = r.method === "cash"
    ? `<span style="background:#f0fdf4;color:#15803d;font-weight:700;font-size:7pt;padding:1px 5px;border-radius:3px;border:1px solid #bbf7d0">CASH</span>`
    : r.method === "mpesa"
    ? `<span style="background:#15803d;color:#fff;font-weight:800;font-size:6pt;padding:2px 4px;border-radius:3px">M·PESA</span>`
    : `<span style="background:#1d4ed8;color:#fff;font-weight:800;font-size:6pt;padding:2px 4px;border-radius:3px">BANK</span>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A5 portrait; margin: 10mm; }
  @media print { html,body { margin:0; } }
  * { box-sizing:border-box; margin:0; padding:0; }
  html,body { font-family:'Calibri','Trebuchet MS',Arial,sans-serif; font-size:11pt; color:#111; background:#fff; }
  table { width:100%; border-collapse:collapse; }
  th,td { padding:5px 8px; font-size:10pt; }
  th { font-weight:700; text-align:left; font-size:8pt; text-transform:uppercase; letter-spacing:0.8px; }
  td.r { text-align:right; } td.bold { font-weight:700; }
  .thead-row { background:#fff5f3; border-top:1px solid #fde8e0; border-bottom:1px solid #fde8e0; }
  .thead-row th { color:#C1440E; }
  tbody tr { border-bottom:1px dashed #e5e7eb; }
  hr { border:none; border-top:1px dashed #d1d5db; margin:10px 0; }
</style>
</head>
<body>
<div style="height:4px;background:linear-gradient(90deg,#C1440E,#E05520,#C1440E);border-radius:2px;margin-bottom:14px"></div>
<div style="display:flex;align-items:center;gap:14px;padding-bottom:12px;margin-bottom:12px;border-bottom:1.5px solid #fde8e0">
  <img src="${logoSrc}" alt="" style="width:64px;height:64px;border-radius:10px;object-fit:contain;flex-shrink:0;border:2px solid #fde8e0"/>
  <div style="flex:1">
    <div style="font-weight:800;font-size:15pt;color:#C1440E">ONTIME ACADEMY</div>
    <div style="font-size:9pt;color:#555;margin-top:2px">Academy &amp; Co-working Space · Nairobi, Kenya</div>
    <div style="margin-top:4px">
      <span style="background:#25d366;color:#fff;font-weight:800;font-size:7pt;padding:2px 5px;border-radius:3px">WhatsApp</span>
      <span style="font-size:9pt;color:#555;margin-left:5px">+254 746 628 668</span>
    </div>
  </div>
  <div style="text-align:right;flex-shrink:0">
    <div style="background:#C1440E;color:#fff;font-weight:800;font-size:13pt;letter-spacing:2px;padding:5px 13px;border-radius:6px;display:inline-block">RECEIPT</div>
    <div style="font-weight:700;font-size:10pt;margin-top:5px;color:#C1440E">${esc(receiptNo)}</div>
    <div style="font-size:9pt;color:#888;margin-top:2px">${esc(fmtDate(r.created_at))}</div>
  </div>
</div>
<div style="margin-bottom:12px">
  <span style="background:#111;color:#fff;border-radius:4px;padding:3px 12px;font-size:8pt;font-weight:800;text-transform:uppercase;letter-spacing:1.2px">
    Student Enrollment · ${esc(TYPE_LABELS[r.student_type] || r.student_type)}
  </span>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px 16px;margin-bottom:12px">
  <div>
    <div style="font-size:8pt;text-transform:uppercase;color:#888;margin-bottom:1px">Student</div>
    <div style="font-weight:700;font-size:10pt">${esc(r.customer_name)}</div>
  </div>
  <div>
    <div style="font-size:8pt;text-transform:uppercase;color:#888;margin-bottom:1px">Phone</div>
    <div style="font-size:10pt">${esc(r.customer_phone)}</div>
  </div>
  <div>
    <div style="font-size:8pt;text-transform:uppercase;color:#888;margin-bottom:1px">Date</div>
    <div style="font-size:10pt">${esc(fmtDate(r.created_at))}</div>
  </div>
</div>
${r.customer_email ? `<div style="margin-bottom:12px">
  <div style="font-size:8pt;text-transform:uppercase;color:#888;margin-bottom:1px">Email</div>
  <div style="font-size:10pt">${esc(r.customer_email)}</div>
</div>` : ""}
<hr/>
<table>
  <thead><tr class="thead-row"><th>Description</th><th style="text-align:right">Amount (KES)</th></tr></thead>
  <tbody>
    ${r.course_name ? `<tr><td>Course — ${esc(r.course_name)}</td><td class="r bold">${fmt(r.course_fee_monthly || 0)}</td></tr>` : ""}
    ${r.registration_fee && r.registration_fee > 0 ? `<tr><td>Registration Fee</td><td class="r bold">${fmt(r.registration_fee)}</td></tr>` : ""}
  </tbody>
</table>
<hr/>
<div style="display:flex;justify-content:flex-end;margin-bottom:14px">
  <div style="min-width:240px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px">
    ${r.total_due != null ? `<div style="display:flex;justify-content:space-between;border-bottom:2px solid #C1440E;padding-bottom:6px;margin-bottom:6px">
      <span style="font-weight:800;font-size:12pt;color:#C1440E">TOTAL DUE</span>
      <span style="font-weight:800;font-size:12pt">KES ${fmt(r.total_due)}</span>
    </div>` : ""}
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:10pt;margin-bottom:${hasBalance ? "4px" : "0"}">
      <span style="color:#555">Paid via ${methodBadge}</span>
      <span style="font-weight:700;color:#15803d">KES ${fmt(r.amount)}</span>
    </div>
    ${hasBalance ? `<div style="display:flex;justify-content:space-between;font-size:10pt;margin-top:4px;padding-top:4px;border-top:1px dashed #fca5a5">
      <span style="color:#dc2626;font-weight:600">Balance Due</span>
      <span style="font-weight:700;color:#dc2626">KES ${fmt(balance)}</span>
    </div>` : ""}
    ${r.reference ? `<div style="font-size:8pt;color:#888;margin-top:5px">Ref: ${esc(r.reference)}</div>` : ""}
  </div>
</div>
${r.notes ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:7px;padding:9px 12px;font-size:10pt;color:#374151;line-height:1.6;margin-bottom:10px">
  <span style="font-size:8pt;text-transform:uppercase;color:#888;display:block;margin-bottom:3px">Notes</span>${esc(r.notes)}</div>` : ""}
<hr/>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:4px">
  <div>
    <div style="font-size:9pt;color:#555">Recorded by</div>
    <div style="font-weight:700;font-size:10pt;margin-top:1px">${esc(recorder)}</div>
  </div>
  <div>
    <div style="font-size:9pt;color:#555;margin-bottom:14px">Student signature</div>
    <div style="border-bottom:1px solid #888;width:80%"></div>
  </div>
  <div style="text-align:right">
    <div style="font-size:9pt;color:#555">Thank you for joining</div>
    <div style="font-weight:700;font-size:10pt">Ontime Academy!</div>
    <div style="font-size:9pt;color:#aaa;margin-top:2px">${esc(receiptNo)}</div>
  </div>
</div>
<script>window.onload=function(){window.print();window.close()}<\/script>
</body>
</html>`;
}

// ── Main page ─────────────────────────────────────────────────

export default function StudentReceiptPage() {
  const params   = useParams<{ id: string }>();
  const router   = useRouter();

  const [data,    setData]    = useState<StudentReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/logo.jpeg");
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/receptionist/receipt/${params.id}`);
      if (!res.ok) { setError("Receipt not found"); setLoading(false); return; }
      const json = await res.json();
      if (!json.registration) { setError("Receipt not found"); setLoading(false); return; }

      setData(json.registration);

      try {
        const logoRes = await fetch("/logo.jpeg");
        const blob    = await logoRes.blob();
        const b64  = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        setLogoSrc(b64);
      } catch { /* keep URL fallback */ }

      setLoading(false);
    }
    load();
  }, [params.id]); // eslint-disable-line

  function handlePrint() {
    if (!data) return;
    const win = window.open("", "_blank", "width=700,height=900");
    if (!win) return;
    win.document.write(buildPrintHTML(data, logoSrc));
    win.document.close();
  }

  async function handleWhatsApp() {
    if (!data || !previewRef.current) return;
    setSending(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
      const { jsPDF } = await import("jspdf");
      const pdf  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
      const pdfW = pdf.internal.pageSize.getWidth();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfW, (canvas.height * pdfW) / canvas.width);
      const fileName = `Receipt-REG-${data.id.slice(0, 8).toUpperCase()}.pdf`;
      if (typeof navigator.canShare === "function") {
        const blob = pdf.output("blob");
        const file = new File([blob], fileName, { type: "application/pdf" });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ title: fileName, files: [file] }); return; }
      }
      pdf.save(fileName);
      const phone = data.customer_phone ? toWA(data.customer_phone) : "";
      const note  = encodeURIComponent(buildWAText(data));
      window.open(phone ? `https://wa.me/${phone}?text=${note}` : `https://wa.me/?text=${note}`, "_blank");
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  }

  if (loading) return (
    <div style={{ padding: 40, fontFamily: "sans-serif", color: "#6b7280" }}>
      <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Loading receipt…
    </div>
  );
  if (error || !data) return (
    <div style={{ padding: 40, fontFamily: "sans-serif", color: "#dc2626" }}>{error ?? "Not found"}</div>
  );

  return (
    <>
      {/* Top bar — sticky below dashboard topbar; sidebar remains fully clickable */}
      <div style={{ position: "sticky", top: 48, zIndex: 10, background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", gap: 12, marginLeft: "-20px", marginRight: "-20px", marginBottom: "20px" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          ← Back
        </button>
        <span style={{ fontFamily: "sans-serif", fontSize: 12, color: "#94a3b8" }}>
          REG-{data.id.slice(0, 8).toUpperCase()} — Student Receipt
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleWhatsApp} disabled={sending}
            style={{ background: sending ? "#94a3b8" : "#25d366", color: "#fff", border: "none", padding: "7px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {sending ? "Generating…" : (
              <>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Send PDF
              </>
            )}
          </button>
          <button onClick={handlePrint}
            style={{ background: "#C1440E", color: "#fff", border: "none", padding: "7px 20px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="fas fa-print" /> Print
          </button>
        </div>
      </div>

      {/* Preview */}
      <div style={{ paddingBottom: 40, background: "#f1f5f9", minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ marginBottom: 12, fontFamily: "sans-serif", fontSize: 12, color: "#64748b" }}>A5 Preview</div>
        <div ref={previewRef} style={{ width: 560, background: "#fff", padding: "38px 40px", boxShadow: "0 4px 24px rgba(0,0,0,.12)", borderRadius: 4, minHeight: 794 }}>
          <ReceiptPreview r={data} logoSrc={logoSrc} />
        </div>
        <div style={{ marginTop: 16, fontFamily: "sans-serif", fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
          Click <strong>Print</strong> to open the print dialog · Click <strong>Send PDF</strong> to share via WhatsApp
        </div>
      </div>
    </>
  );
}
