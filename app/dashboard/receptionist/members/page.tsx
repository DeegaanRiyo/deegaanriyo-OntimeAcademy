"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Member = {
  id:                 string;
  name:               string;
  phone:              string;
  email:              string | null;
  profile_id:         string | null;
  profession:         string | null;
  amount:             number;
  total_paid:         number;
  period_paid:        number;
  outstanding:        number;
  method:             string;
  reference:          string | null;
  notes:              string | null;
  payment_date:       string;
  sub_start:          string | null;
  due_date:           string | null;
  subscription_days:  number;
  recorded_by_name:   string | null;
  payment_created_at: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function daysUntil(iso: string) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function memberSince(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days < 30)  return `${days}d`;
  const mo = Math.floor(days / 30), rem = days % 30;
  return rem > 0 ? `${mo}mo ${rem}d` : `${mo}mo`;
}
function waLink(phone: string, name: string, due: string | null) {
  const wa  = phone.replace(/\D/g, "").replace(/^0/, "254");
  const msg = due
    ? `Hi ${name}, this is a reminder from Ontime Academy & Co-working Space. Your membership payment is due on ${new Date(due).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}. Please visit us to renew. Thank you!`
    : `Hi ${name}, this is a reminder from Ontime Academy & Co-working Space. Please contact us regarding your upcoming payment. Thank you!`;
  return `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
}
const METHOD_LABELS: Record<string, string> = { cash: "Cash", mpesa: "M-Pesa" };

// ─── Due Badge ────────────────────────────────────────────────────────────────

function DueBadge({ due }: { due: string | null }) {
  if (!due) return <span style={{ color: "var(--muted)", fontSize: ".75rem" }}>—</span>;
  const d = daysUntil(due);
  const [color, label] =
    d < 0  ? ["#dc2626", "Expired"] :
    d === 0 ? ["#b45309", "Today"]  :
    d <= 5  ? ["#b45309", `${d}d`]  :
              ["#16a34a", `${d}d`];
  return (
    <div>
      <div style={{ color, fontWeight: 700, fontSize: ".78rem" }}>{label}</div>
      <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{fmtDate(due)}</div>
    </div>
  );
}

// ─── Register Member Modal ────────────────────────────────────────────────────

function RegisterModal({ onClose, onRegistered }: { onClose: () => void; onRegistered: () => void }) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", profession: "",
    method: "cash", reference: "", notes: "",
    membership_fee: "",
    amount_paid: 0,
    joined_date: new Date().toLocaleDateString("en-CA"),
    subscription_days: "30",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; email: string; temp_password: string; payment_id: string; profile_id: string } | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const fee = Number(form.membership_fee);
      const amtPaid = Number(form.amount_paid);

      const res  = await fetch("/api/receptionist/register-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, membership_fee: fee, amount: amtPaid, joined_date: form.joined_date, subscription_days: Number(form.subscription_days) || 30 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSuccess({ name: form.full_name, email: form.email, temp_password: json.temp_password, payment_id: json.payment_id, profile_id: json.profile_id ?? json.member_id });
      onRegistered();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = { width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)", borderRadius: "8px", padding: "9px 12px", color: "var(--dark)", fontSize: ".85rem", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: "5px" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>
            <i className="fas fa-id-card" style={{ color: "var(--teal2)", marginRight: "8px" }} />Register Member
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem" }}><i className="fas fa-times" /></button>
        </div>

        {success ? (
          <div>
            <div style={{ background: "rgba(22,163,74,.08)", border: "1px solid rgba(22,163,74,.25)", borderRadius: "10px", padding: "18px", marginBottom: "16px" }}>
              <div style={{ fontWeight: 700, color: "#16a34a", marginBottom: "10px" }}>
                <i className="fas fa-check-circle" style={{ marginRight: "7px" }} />{success.name} registered
              </div>
              {success.temp_password ? (
                <>
                  <div style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: "10px" }}>Hand these login credentials to the member:</div>
                  <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "10px 14px", fontSize: ".85rem", border: "1px solid rgba(17,17,17,.1)" }}>
                    <div style={{ marginBottom: "5px" }}><span style={{ color: "var(--muted)" }}>Email: </span><strong style={{ color: "var(--dark)" }}>{success.email}</strong></div>
                    <div><span style={{ color: "var(--muted)" }}>Temp Password: </span><strong style={{ color: "var(--teal2)", letterSpacing: ".05em" }}>{success.temp_password}</strong></div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>Walk-in member registered — no platform account created (no email provided).</div>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {success.payment_id && (
                <Link href={`/dashboard/receptionist/member-receipt/${success.profile_id}`} className="btn-primary" style={{ textDecoration: "none", flex: 1, textAlign: "center" }}>
                  <i className="fas fa-receipt" style={{ marginRight: "7px" }} />Print Receipt
                </Link>
              )}
              <button onClick={() => setSuccess(null)} className="btn-outline" style={{ flex: success.payment_id ? 1 : 2 }}>Register Another</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "rgba(193,68,14,.06)", border: "1px solid rgba(193,68,14,.2)", borderRadius: "8px", padding: "10px 14px", fontSize: ".8rem", color: "var(--teal2)" }}>
              <i className="fas fa-info-circle" style={{ marginRight: "7px" }} />
              Co-working membership · {form.subscription_days}-day subscription
            </div>
            {error && <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "10px 14px", color: "#dc2626", fontSize: ".8rem" }}>{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div><label style={lbl}>Full Name *</label><input value={form.full_name} onChange={set("full_name")} placeholder="Jane Mwangi" required style={inp} /></div>
              <div><label style={lbl}>Phone *</label><input value={form.phone} onChange={set("phone")} placeholder="07XX XXX XXX" required style={inp} /></div>
              <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={set("email")} placeholder="jane@email.com" style={inp} /></div>
              <div><label style={lbl}>Profession</label><input value={form.profession} onChange={set("profession")} placeholder="e.g. Freelance Designer" style={inp} /></div>
              <div>
                <label style={lbl}>Joined Date *</label>
                <input type="date" value={form.joined_date} onChange={set("joined_date")} required style={inp} />
                <div style={{ fontSize: ".62rem", color: "var(--muted)", marginTop: "3px" }}>Subscription starts this date</div>
              </div>
              <div>
                <label style={lbl}>Subscription Duration *</label>
                <select value={form.subscription_days} onChange={set("subscription_days")} style={inp}>
                  <option value="7">7 days (1 week)</option>
                  <option value="14">14 days (2 weeks)</option>
                  <option value="30">30 days (1 month)</option>
                  <option value="60">60 days (2 months)</option>
                  <option value="90">90 days (3 months)</option>
                </select>
                <div style={{ fontSize: ".62rem", color: "var(--muted)", marginTop: "3px" }}>How long this subscription lasts</div>
              </div>
              <div>
                <label style={lbl}>Membership Fee (KES) *</label>
                <input type="number" min="1" value={form.membership_fee} onChange={set("membership_fee")} placeholder="e.g. 7500" required style={inp} />
                <div style={{ fontSize: ".62rem", color: "var(--muted)", marginTop: "3px" }}>Monthly subscription amount for this member</div>
              </div>
              <div>
                <label style={lbl}>Amount Paid (KES)</label>
                <input type="number" min="0" value={form.amount_paid} onChange={set("amount_paid")} placeholder="0 if paying later" style={inp} />
                <div style={{ fontSize: ".62rem", color: "var(--muted)", marginTop: "3px" }}>Leave 0 if member will pay later</div>
              </div>
              <div>
                <label style={lbl}>Payment Method</label>
                <select value={form.method} onChange={set("method")} style={inp}>
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>
              {form.method === "mpesa" && (
                <div><label style={lbl}>M-Pesa Code</label><input value={form.reference} onChange={set("reference")} placeholder="e.g. QA12BCD3E4" style={inp} /></div>
              )}
            </div>
            <div style={{ marginTop: "-4px" }}>
              {(() => {
                const fee  = Number(form.membership_fee) || 0;
                const paid = Number(form.amount_paid) || 0;
                if (!fee) return <div style={{ color: "var(--muted)", fontSize: ".82rem" }}>Enter the membership fee above</div>;
                const bal  = fee - paid;
                if (paid === 0) return <div style={{ color: "#b45309", fontSize: ".82rem", fontWeight: 700 }}>⚠ No payment — KES {fee.toLocaleString()} due later</div>;
                if (bal > 0)   return <div style={{ color: "#dc2626", fontSize: ".82rem", fontWeight: 700 }}>Balance Due: KES {bal.toLocaleString()}</div>;
                if (bal === 0) return <div style={{ color: "#16a34a", fontSize: ".82rem", fontWeight: 700 }}>✓ Fully Paid</div>;
                return              <div style={{ color: "#b45309", fontSize: ".82rem", fontWeight: 700 }}>Overpaid by KES {Math.abs(bal).toLocaleString()}</div>;
              })()}
            </div>
            <div><label style={lbl}>Notes</label><textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Any additional notes..." style={{ ...inp, resize: "vertical" }} /></div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, border: "none", cursor: "pointer" }}>
                {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "7px" }} />Registering…</> : <><i className="fas fa-id-card" style={{ marginRight: "7px" }} />{Number(form.amount_paid) > 0 ? `Register Member · KES ${Number(form.amount_paid).toLocaleString()} paid` : "Register Member · Payment Pending"}</>}
              </button>
              <button type="button" className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────

function PaymentModal({ member, onClose, onDone }: { member: Member; onClose: () => void; onDone: () => void }) {
  const [amount,  setAmount]  = useState(String(member.outstanding > 0 ? member.outstanding : ""));
  const [method,  setMethod]  = useState("cash");
  const [ref,     setRef]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const inp: React.CSSProperties = { width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)", borderRadius: "8px", padding: "9px 12px", color: "var(--dark)", fontSize: ".85rem", outline: "none", boxSizing: "border-box" };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!member.profile_id) { setError("No member account linked."); return; }
    if (!amount || Number(amount) <= 0) { setError("Enter a valid amount."); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/receptionist/record-member-payment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: member.profile_id, amount: Number(amount), method, reference: ref || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onDone(); onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "380px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>Record Payment</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>
        <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "8px 12px", marginBottom: "4px", fontSize: ".82rem", border: "1px solid rgba(17,17,17,.1)" }}>
          <div style={{ fontWeight: 700, color: "var(--dark)" }}>{member.name}</div>
          {member.outstanding > 0 && <div style={{ color: "#b45309", fontSize: ".75rem", marginTop: "2px" }}>Outstanding: KES {member.outstanding.toLocaleString()}</div>}
        </div>
        {!member.profile_id && <div style={{ color: "#b45309", fontSize: ".75rem", marginBottom: "12px", marginTop: "8px" }}>⚠ No member account linked — payment cannot be recorded.</div>}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
          {error && <div style={{ color: "#dc2626", fontSize: ".78rem" }}>{error}</div>}
          <div><label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: "5px" }}>Amount (KES) *</label><input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 7500" required style={inp} /></div>
          <div>
            <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: "5px" }}>Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={inp}>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
            </select>
          </div>
          {method === "mpesa" && (
            <div><label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: "5px" }}>M-Pesa Code</label><input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. QA12BCD3E4" style={inp} /></div>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" className="btn-primary" disabled={loading || !member.profile_id} style={{ flex: 1, border: "none", cursor: "pointer" }}>
              {loading ? "Saving…" : "Save Payment"}
            </button>
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Renew Subscription Modal ─────────────────────────────────────────────────

function RenewModal({ member, onClose, onDone }: { member: Member; onClose: () => void; onDone: () => void }) {
  const [days,    setDays]    = useState(String(member.subscription_days || 30));
  const [amount,  setAmount]  = useState(String(member.amount || ""));
  const [method,  setMethod]  = useState("cash");
  const [ref,     setRef]     = useState("");
  const [payNow,  setPayNow]  = useState(true);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const inp: React.CSSProperties = { width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)", borderRadius: "8px", padding: "9px 12px", color: "var(--dark)", fontSize: ".85rem", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: "5px" };

  const newEnd = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (Number(days) || 30));
    return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
  })();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!member.profile_id) { setError("No member account linked."); return; }
    setLoading(true);
    try {
      const payload: any = {
        profile_id: member.profile_id,
        subscription_days: Number(days) || 30,
      };
      if (payNow && Number(amount) > 0) {
        payload.amount = Number(amount);
        payload.method = method;
        if (ref) payload.reference = ref;
      }
      const res  = await fetch("/api/receptionist/renew-member", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onDone(); onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "420px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>
            <i className="fas fa-sync-alt" style={{ color: "#16a34a", marginRight: "8px" }} />Renew Subscription
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>

        {/* Member info */}
        <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: ".82rem", border: "1px solid rgba(17,17,17,.1)" }}>
          <div style={{ fontWeight: 700, color: "var(--dark)" }}>{member.name}</div>
          <div style={{ display: "flex", gap: "16px", marginTop: "4px", fontSize: ".72rem", color: "var(--muted)" }}>
            <span>Fee: KES {member.amount.toLocaleString()}</span>
            {member.due_date && <span>Expired: {fmtDate(member.due_date)}</span>}
          </div>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {error && <div style={{ color: "#dc2626", fontSize: ".78rem", background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "8px 12px" }}>{error}</div>}

          <div>
            <label style={lbl}>Subscription Duration</label>
            <select value={days} onChange={(e) => setDays(e.target.value)} style={inp}>
              <option value="7">7 days (1 week)</option>
              <option value="14">14 days (2 weeks)</option>
              <option value="30">30 days (1 month)</option>
              <option value="60">60 days (2 months)</option>
              <option value="90">90 days (3 months)</option>
            </select>
            <div style={{ fontSize: ".68rem", color: "#16a34a", marginTop: "4px", fontWeight: 600 }}>
              New expiry: {newEnd}
            </div>
          </div>

          {/* Pay now toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: ".82rem", color: "var(--dark)", cursor: "pointer" }}>
            <input type="checkbox" checked={payNow} onChange={(e) => setPayNow(e.target.checked)} style={{ width: "16px", height: "16px" }} />
            Record payment now
          </label>

          {payNow && (
            <>
              <div>
                <label style={lbl}>Amount (KES)</label>
                <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 7500" style={inp} />
              </div>
              <div>
                <label style={lbl}>Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} style={inp}>
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>
              {method === "mpesa" && (
                <div>
                  <label style={lbl}>M-Pesa Code</label>
                  <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. QA12BCD3E4" style={inp} />
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" disabled={loading || !member.profile_id}
              style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", opacity: loading ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
              {loading ? <><i className="fas fa-spinner fa-spin" />Renewing...</> : <><i className="fas fa-sync-alt" />Renew for {days} days</>}
            </button>
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Member Flag Modal ────────────────────────────────────────────────────────

function MemberFlagModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [sent,    setSent]    = useState(false);

  const lbl: React.CSSProperties = {
    display: "block", fontSize: ".62rem", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(17,17,17,.4)", marginBottom: "4px",
  };
  const inp: React.CSSProperties = {
    width: "100%", background: "rgba(17,17,17,.03)", border: "1px solid rgba(17,17,17,.12)",
    borderRadius: "6px", padding: "8px 10px", color: "var(--dark)",
    fontSize: ".8rem", outline: "none", boxSizing: "border-box",
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!message.trim()) { setError("Please describe the correction needed."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/corrections", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_type:  "member",
          record_id:    member.id,
          record_label: member.name,
          note:         message.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit flag");
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "420px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "#dc2626", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-flag" />Flag for Correction
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>
        {sent ? (
          <div style={{ background: "rgba(220,38,38,.07)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "10px", padding: "18px", textAlign: "center" }}>
            <i className="fas fa-check-circle" style={{ color: "#dc2626", fontSize: "1.4rem", marginBottom: "10px", display: "block" }} />
            <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: "4px" }}>Flag sent to Owner</div>
            <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>The owner will review and make corrections.</div>
            <button onClick={onClose} className="btn-outline" style={{ marginTop: "14px", width: "100%" }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px", fontSize: ".82rem", border: "1px solid rgba(17,17,17,.1)" }}>
              <div style={{ fontWeight: 700, color: "var(--dark)" }}>{member.name}</div>
              <div style={{ color: "var(--muted)", fontSize: ".75rem" }}>{member.phone}</div>
            </div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {error && <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "9px 12px", color: "#dc2626", fontSize: ".8rem" }}>{error}</div>}
              <div>
                <label style={lbl}>Correction needed *</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
                  placeholder="Describe what needs to be corrected — e.g. wrong amount, duplicate entry, etc."
                  required style={{ ...inp, resize: "vertical" } as React.CSSProperties} autoFocus />
                <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: "4px" }}>This message will be sent to the owner for review.</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", opacity: loading ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                  {loading ? <><i className="fas fa-spinner fa-spin" />Sending…</> : <><i className="fas fa-flag" />Send Flag</>}
                </button>
                <button type="button" className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Edit Member Modal ───────────────────────────────────────────────────────

function EditModal({ member, onClose, onDone }: { member: Member; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    full_name:      member.name,
    phone:          member.phone,
    email:          member.email ?? "",
    profession:     member.profession ?? "",
    membership_fee: String(member.amount || ""),
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const inp: React.CSSProperties = { width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)", borderRadius: "8px", padding: "9px 12px", color: "var(--dark)", fontSize: ".85rem", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: "5px" };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.full_name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/edit-member", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id:     member.profile_id ?? member.id,
          full_name:      form.full_name,
          phone:          form.phone,
          email:          form.email,
          profession:     form.profession,
          membership_fee: Number(form.membership_fee) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onDone(); onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "420px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>
            <i className="fas fa-pen" style={{ color: "var(--teal2)", marginRight: "8px" }} />Edit Member
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {error && <div style={{ color: "#dc2626", fontSize: ".78rem", background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "8px 12px" }}>{error}</div>}
          <div><label style={lbl}>Full Name *</label><input value={form.full_name} onChange={set("full_name")} required style={inp} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><label style={lbl}>Phone</label><input value={form.phone} onChange={set("phone")} style={inp} /></div>
            <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={set("email")} style={inp} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><label style={lbl}>Profession</label><input value={form.profession} onChange={set("profession")} style={inp} /></div>
            <div><label style={lbl}>Membership Fee (KES)</label><input type="number" min="0" value={form.membership_fee} onChange={set("membership_fee")} style={inp} /></div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, border: "none", cursor: "pointer" }}>
              {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "7px" }} />Saving...</> : <><i className="fas fa-check" style={{ marginRight: "7px" }} />Save Changes</>}
            </button>
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Member Modal ─────────────────────────────────────────────────────

function DeleteModal({ member, onClose, onDone }: { member: Member; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function confirm() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/delete-member", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: member.profile_id ?? member.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onDone(); onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "380px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "#dc2626" }}>
            <i className="fas fa-trash-alt" style={{ marginRight: "8px" }} />Remove Member
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>
        <div style={{ background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "8px", padding: "14px", marginBottom: "16px", fontSize: ".82rem" }}>
          <div style={{ fontWeight: 700, color: "var(--dark)", marginBottom: "4px" }}>{member.name}</div>
          <div style={{ color: "#dc2626" }}>
            This will remove the member from the dashboard. Payment history is kept for records.
          </div>
        </div>
        {error && <div style={{ color: "#dc2626", fontSize: ".78rem", marginBottom: "12px" }}>{error}</div>}
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={confirm} disabled={loading}
            style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", opacity: loading ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
            {loading ? <><i className="fas fa-spinner fa-spin" />Removing...</> : <><i className="fas fa-trash-alt" />Yes, Remove</>}
          </button>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Table cell styles ─────────────────────────────────────────────────────────
const TH: React.CSSProperties = {
  padding: "6px 12px", textAlign: "left", fontSize: ".55rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".1em", color: "#6B7280",
  whiteSpace: "nowrap", background: "rgba(17,17,17,.015)",
};
const TD: React.CSSProperties = { padding: "0 12px", height: "40px", verticalAlign: "middle", fontSize: ".75rem", color: "#111827" };
const TD_M: React.CSSProperties = { padding: "0 12px", height: "40px", verticalAlign: "middle", fontSize: ".72rem", color: "#4B5563" };

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const [members,  setMembers]  = useState<Member[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [openId,   setOpenId]   = useState<string | null>(null);
  const [showReg,  setShowReg]  = useState(false);
  const [payTarget,    setPayTarget]    = useState<Member | null>(null);
  const [renewTarget,  setRenewTarget]  = useState<Member | null>(null);
  const [editTarget,   setEditTarget]   = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [flagTarget,   setFlagTarget]   = useState<Member | null>(null);

  function toggleExpand(id: string) { setOpenId(prev => prev === id ? null : id); }

  function load() {
    setLoading(true);
    fetch("/api/receptionist/members")
      .then((r) => r.json())
      .then((j) => setMembers(j.members ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const q = search.trim().toLowerCase();
  const filtered = members.filter((m) =>
    !q || m.name.toLowerCase().includes(q) || m.phone.includes(q) ||
    (m.email ?? "").toLowerCase().includes(q) ||
    (m.profession ?? "").toLowerCase().includes(q)
  );

  const expired        = members.filter((m) => m.due_date && daysUntil(m.due_date) < 0).length;
  const expiringSoon   = members.filter((m) => m.due_date && daysUntil(m.due_date) >= 0 && daysUntil(m.due_date) <= 5).length;
  const hasOutstanding = members.filter((m) => m.outstanding > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Members</h2>
          <p>Co-working desk membership subscriptions</p>
        </div>
        <button onClick={() => setShowReg(true)} className="btn-primary" style={{ border: "none", cursor: "pointer" }}>
          <i className="fas fa-user-plus" style={{ marginRight: "7px" }} />Register Member
        </button>
      </div>

      {/* Alerts */}
      {expired > 0 && (
        <div style={{ background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", fontSize: ".8rem", color: "#dc2626" }}>
          <i className="fas fa-clock" />
          <strong>{expired}</strong> membership{expired > 1 ? "s" : ""} expired — click the <i className="fas fa-sync-alt" style={{ margin: "0 3px", fontSize: ".7rem" }} /> button to renew.
        </div>
      )}
      {expiringSoon > 0 && (
        <div style={{ background: "rgba(180,131,9,.07)", border: "1px solid rgba(180,131,9,.25)", borderRadius: "8px", padding: "10px 14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", fontSize: ".8rem", color: "#b45309" }}>
          <i className="fas fa-exclamation-triangle" />
          <strong>{expiringSoon}</strong> membership{expiringSoon > 1 ? "s" : ""} expiring within 5 days.
        </div>
      )}
      {hasOutstanding > 0 && (
        <div style={{ background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", fontSize: ".8rem", color: "#dc2626" }}>
          <i className="fas fa-circle-exclamation" />
          <strong>{hasOutstanding}</strong> member{hasOutstanding > 1 ? "s" : ""} with outstanding balance.
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px", maxWidth: "380px" }}>
        <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: ".8rem", pointerEvents: "none" }} />
        <input type="text" placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ paddingLeft: "34px" }} />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: ".8rem" }}>
            <i className="fas fa-times" />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "40px 0", color: "var(--muted)", fontSize: ".85rem" }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            {search ? `No results for "${search}"` : "No members registered yet."}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "8px 14px 6px", fontSize: ".72rem", color: "var(--muted)", borderBottom: "1px solid var(--border)", background: "#fafafa" }}>
            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
            {search && <> matching "<strong style={{ color: "var(--dark)" }}>{search}</strong>"</>}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(17,17,17,.08)" }}>
                  <th style={TH}>Member</th>
                  <th style={TH}>Email</th>
                  <th style={TH}>Profession</th>
                  <th style={TH}>Paid (Period)</th>
                  <th style={TH}>Method</th>
                  <th style={TH}>Sub Start</th>
                  <th style={TH}>Sub End</th>
                  <th style={TH}>Days</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Recorded By</th>
                  <th style={TH}>Registered</th>
                  <th style={TH}>Actions</th>
                  <th style={{ ...TH, width: 28 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const days = m.due_date ? daysUntil(m.due_date) : null;
                  const isOpen = openId === m.id;
                  return (
                    <React.Fragment key={m.id}>
                      <tr
                        style={{ borderBottom: isOpen ? "none" : "1px solid rgba(17,17,17,.045)", cursor: "pointer", transition: "background .08s", background: m.outstanding > 0 ? "rgba(220,38,38,.018)" : "transparent" }}
                        onClick={() => toggleExpand(m.id)}
                        onMouseEnter={(e) => { if (m.outstanding <= 0) (e.currentTarget as HTMLElement).style.background = "rgba(17,17,17,.018)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = m.outstanding > 0 ? "rgba(220,38,38,.018)" : "transparent"; }}
                      >
                        {/* Member */}
                        <td style={TD} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", alignItems: "center", gap: "9px", whiteSpace: "nowrap" }}>
                            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(193,68,14,.08)", border: "1px solid rgba(193,68,14,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".6rem", fontWeight: 700, color: "var(--teal2)", flexShrink: 0 }}>
                              {initials(m.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".8rem" }}>{m.name}</div>
                              <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{m.phone}</div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ ...TD_M, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.email || <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                        </td>

                        {/* Profession */}
                        <td style={{ ...TD_M, whiteSpace: "nowrap" }}>
                          {m.profession || <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                        </td>

                        {/* Paid */}
                        <td style={{ ...TD, fontWeight: 700, whiteSpace: "nowrap" }}>
                          {m.period_paid > 0
                            ? <span style={{ color: "#16a34a" }}>KES {m.period_paid.toLocaleString()}</span>
                            : <span style={{ color: "rgba(17,17,17,.25)", fontWeight: 400 }}>—</span>}
                        </td>

                        {/* Method */}
                        <td style={TD_M}>
                          {m.method
                            ? <span style={{ display: "inline-flex", fontSize: ".68rem", fontWeight: 600, background: "rgba(17,17,17,.05)", color: "#374151", padding: "2px 7px", borderRadius: "100px", whiteSpace: "nowrap" }}>
                                {METHOD_LABELS[m.method] ?? m.method}
                              </span>
                            : <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                        </td>

                        {/* Sub Start */}
                        <td style={{ ...TD_M, whiteSpace: "nowrap" }}>
                          {m.sub_start ? fmtDate(m.sub_start) : <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                        </td>

                        {/* Sub End */}
                        <td style={{ ...TD_M, whiteSpace: "nowrap" }}>
                          {m.due_date ? fmtDate(m.due_date) : <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                        </td>

                        {/* Days */}
                        <td style={{ ...TD, whiteSpace: "nowrap" }}>
                          <DueBadge due={m.due_date} />
                        </td>

                        {/* Status */}
                        <td style={TD}>
                          {(() => {
                            if (!m.due_date) return <span className="badge" style={{ background: "rgba(17,17,17,.05)", color: "rgba(17,17,17,.4)" }}><span className="badge-dot" style={{ background: "rgba(17,17,17,.2)" }} />No Sub</span>;
                            const d = daysUntil(m.due_date);
                            if (d < 0)    return <span className="badge rd"><span className="badge-dot" />Expired</span>;
                            if (d <= 5)   return <span className="badge gd"><span className="badge-dot" />Expiring</span>;
                            return              <span className="badge gr"><span className="badge-dot" />Active</span>;
                          })()}
                        </td>

                        {/* Recorded By */}
                        <td style={{ ...TD_M, whiteSpace: "nowrap" }}>
                          {m.recorded_by_name || <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                        </td>

                        {/* Date Registered */}
                        <td style={{ ...TD_M, whiteSpace: "nowrap" }}>
                          {m.payment_created_at ? fmtDate(m.payment_created_at) : <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                        </td>

                        {/* Actions */}
                        <td style={{ ...TD, whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
                            {((!m.due_date) || (m.due_date && daysUntil(m.due_date) <= 5)) && m.profile_id && (
                              <button onClick={() => setRenewTarget(m)} title="Renew Subscription" style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(22,163,74,.09)", border: "none", borderRadius: "6px", cursor: "pointer", color: "#16a34a", fontSize: ".65rem" }}>
                                <i className="fas fa-sync-alt" />
                              </button>
                            )}
                            {m.outstanding > 0 && m.profile_id && (
                              <button onClick={() => setPayTarget(m)} title="Record Payment" style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(180,83,9,.09)", border: "none", borderRadius: "6px", cursor: "pointer", color: "#b45309", fontSize: ".65rem" }}>
                                <i className="fas fa-plus-circle" />
                              </button>
                            )}
                            <a href={waLink(m.phone, m.name, m.due_date)} target="_blank" rel="noopener noreferrer" title="WhatsApp Reminder" style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(37,211,102,.08)", border: "none", borderRadius: "6px", cursor: "pointer", color: "#15803d", fontSize: ".65rem", textDecoration: "none" }}>
                              <i className="fab fa-whatsapp" />
                            </a>
                            <Link href={`/dashboard/receptionist/member-receipt/${m.profile_id ?? m.id}`} title="Print Receipt" style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6", border: "none", borderRadius: "6px", cursor: "pointer", color: "#6B7280", fontSize: ".65rem", textDecoration: "none" }}>
                              <i className="fas fa-receipt" />
                            </Link>
                            <button onClick={() => setEditTarget(m)} title="Edit Member" style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(59,130,246,.08)", border: "none", borderRadius: "6px", cursor: "pointer", color: "#3b82f6", fontSize: ".65rem" }}>
                              <i className="fas fa-pen" />
                            </button>
                            <button onClick={() => setDeleteTarget(m)} title="Remove Member" style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(220,38,38,.06)", border: "none", borderRadius: "6px", cursor: "pointer", color: "#dc2626", fontSize: ".65rem" }}>
                              <i className="fas fa-trash-alt" />
                            </button>
                            <button onClick={() => setFlagTarget(m)} title="Flag for Correction" style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6", border: "none", borderRadius: "6px", cursor: "pointer", color: "#EF4444", fontSize: ".65rem" }}>
                              <i className="fas fa-flag" />
                            </button>
                          </div>
                        </td>

                        {/* Expand */}
                        <td style={{ padding: "0 10px", height: "40px", verticalAlign: "middle", width: 28 }}>
                          <i className="fas fa-chevron-down" style={{ fontSize: ".58rem", color: "rgba(17,17,17,.25)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }} />
                        </td>
                      </tr>

                      {isOpen && (
                        <tr style={{ borderBottom: "1px solid rgba(17,17,17,.045)", background: "rgba(17,17,17,.012)" }}>
                          <td colSpan={13} style={{ padding: "12px 18px 14px" }}>
                            <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
                              {m.reference && (
                                <div>
                                  <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "2px" }}>Reference</div>
                                  <div style={{ fontSize: ".78rem", color: "var(--dark)", fontFamily: "monospace" }}>{m.reference}</div>
                                </div>
                              )}
                              {m.outstanding > 0 && (
                                <div>
                                  <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "2px" }}>Outstanding</div>
                                  <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#dc2626" }}>KES {m.outstanding.toLocaleString()}</div>
                                </div>
                              )}
                              {m.outstanding === 0 && m.period_paid > 0 && (
                                <div>
                                  <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "2px" }}>Balance</div>
                                  <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#16a34a" }}>Cleared</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showReg      && <RegisterModal onClose={() => setShowReg(false)} onRegistered={load} />}
      {payTarget    && <PaymentModal member={payTarget} onClose={() => setPayTarget(null)} onDone={load} />}
      {renewTarget  && <RenewModal member={renewTarget} onClose={() => setRenewTarget(null)} onDone={load} />}
      {editTarget   && <EditModal member={editTarget} onClose={() => setEditTarget(null)} onDone={load} />}
      {deleteTarget && <DeleteModal member={deleteTarget} onClose={() => setDeleteTarget(null)} onDone={load} />}
      {flagTarget   && <MemberFlagModal member={flagTarget} onClose={() => setFlagTarget(null)} />}
    </div>
  );
}
