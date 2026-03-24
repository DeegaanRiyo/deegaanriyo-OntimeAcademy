"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Member = {
  id:           string;
  name:         string;
  phone:        string;
  email:        string | null;
  profile_id:   string | null;
  amount:       number;
  total_paid:   number;
  period_paid:  number;
  outstanding:  number;
  method:       string;
  reference:    string | null;
  notes:        string | null;
  payment_date: string;
  sub_start:    string | null;
  due_date:     string | null;
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
const METHOD_LABELS: Record<string, string> = { cash: "Cash", bank_transfer: "Bank Transfer" };

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
    membership_fee: 7500,
    amount_paid: 7500,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; email: string; temp_password: string; payment_id: string } | null>(null);

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
        body: JSON.stringify({ ...form, membership_fee: fee, amount: amtPaid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSuccess({ name: form.full_name, email: form.email, temp_password: json.temp_password, payment_id: json.payment_id });
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
              <div style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: "10px" }}>Hand these login credentials to the member:</div>
              <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "10px 14px", fontSize: ".85rem", border: "1px solid rgba(17,17,17,.1)" }}>
                <div style={{ marginBottom: "5px" }}><span style={{ color: "var(--muted)" }}>Email: </span><strong style={{ color: "var(--dark)" }}>{success.email}</strong></div>
                <div><span style={{ color: "var(--muted)" }}>Temp Password: </span><strong style={{ color: "var(--teal2)", letterSpacing: ".05em" }}>{success.temp_password}</strong></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Link href={`/dashboard/receptionist/receipt/${success.payment_id}`} className="btn-primary" style={{ textDecoration: "none", flex: 1, textAlign: "center" }}>
                <i className="fas fa-receipt" style={{ marginRight: "7px" }} />Print Receipt
              </Link>
              <button onClick={() => setSuccess(null)} className="btn-outline" style={{ flex: 1 }}>Register Another</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "rgba(193,68,14,.06)", border: "1px solid rgba(193,68,14,.2)", borderRadius: "8px", padding: "10px 14px", fontSize: ".8rem", color: "var(--teal2)" }}>
              <i className="fas fa-info-circle" style={{ marginRight: "7px" }} />
              Co-working membership · <strong>KES 7,500/month</strong> · 30-day subscription
            </div>
            {error && <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "10px 14px", color: "#dc2626", fontSize: ".8rem" }}>{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div><label style={lbl}>Full Name *</label><input value={form.full_name} onChange={set("full_name")} placeholder="Jane Mwangi" required style={inp} /></div>
              <div><label style={lbl}>Phone *</label><input value={form.phone} onChange={set("phone")} placeholder="07XX XXX XXX" required style={inp} /></div>
              <div><label style={lbl}>Email *</label><input type="email" value={form.email} onChange={set("email")} placeholder="jane@email.com" required style={inp} /></div>
              <div><label style={lbl}>Profession</label><input value={form.profession} onChange={set("profession")} placeholder="e.g. Freelance Designer" style={inp} /></div>
              <div><label style={lbl}>Membership Fee (KES)</label><input value={form.membership_fee.toLocaleString()} readOnly style={{ ...inp, background: "rgba(17,17,17,.02)", color: "var(--muted)", cursor: "not-allowed" }} /></div>
              <div><label style={lbl}>Amount Paid (KES) *</label><input type="number" value={form.amount_paid} onChange={set("amount_paid")} required style={inp} /></div>
              <div>
                <label style={lbl}>Payment Method *</label>
                <select value={form.method} onChange={set("method")} style={inp}>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              {form.method === "bank_transfer" && (
                <div><label style={lbl}>Bank Reference</label><input value={form.reference} onChange={set("reference")} placeholder="Transaction ref" style={inp} /></div>
              )}
            </div>
            <div style={{ marginTop: "-4px" }}>
              {(() => {
                const bal = Number(form.membership_fee) - Number(form.amount_paid);
                if (bal > 0) return <div style={{ color: "#dc2626", fontSize: ".82rem", fontWeight: 700 }}>Balance Due: KES {bal.toLocaleString()}</div>;
                if (bal === 0) return <div style={{ color: "#16a34a", fontSize: ".82rem", fontWeight: 700 }}>✓ Fully Paid</div>;
                return <div style={{ color: "#b45309", fontSize: ".82rem", fontWeight: 700 }}>Overpaid by KES {Math.abs(bal).toLocaleString()}</div>;
              })()}
            </div>
            <div><label style={lbl}>Notes</label><textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Any additional notes..." style={{ ...inp, resize: "vertical" }} /></div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, border: "none", cursor: "pointer" }}>
                {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "7px" }} />Registering…</> : <><i className="fas fa-id-card" style={{ marginRight: "7px" }} />Register Member · KES {Number(form.amount_paid).toLocaleString()}</>}
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
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          {method === "bank_transfer" && (
            <div><label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: "5px" }}>Reference</label><input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="TXN ref" style={inp} /></div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const [members,  setMembers]  = useState<Member[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [showReg,  setShowReg]  = useState(false);
  const [payTarget, setPayTarget] = useState<Member | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/receptionist/walk-in-members")
      .then((r) => r.json())
      .then((j) => setMembers((j.members ?? []).filter((m: any) => m.type === "membership")))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = members.filter((m) => {
    const q = search.trim().toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.phone.includes(q);
  });

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
        <div className="card">
          <div style={{ padding: "10px 14px 6px", fontSize: ".72rem", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
            {search && <> matching "<strong style={{ color: "var(--dark)" }}>{search}</strong>"</>}
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Paid This Period</th>
                  <th>Outstanding</th>
                  <th>Duration</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} style={{ background: m.outstanding > 0 ? "rgba(220,38,38,.02)" : undefined }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(193,68,14,.08)", border: "1px solid rgba(193,68,14,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", fontWeight: 700, color: "var(--teal2)", flexShrink: 0 }}>
                          {initials(m.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--dark)" }}>{m.name}</div>
                          <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{m.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--dark)" }}>
                      KES {m.period_paid.toLocaleString()}
                      <div style={{ fontSize: ".65rem", color: "var(--muted)", fontWeight: 400 }}>{METHOD_LABELS[m.method] ?? m.method}</div>
                    </td>
                    <td>
                      {m.outstanding > 0
                        ? <span style={{ color: "#dc2626", fontWeight: 700, fontSize: ".82rem" }}>KES {m.outstanding.toLocaleString()}</span>
                        : <span style={{ color: "#16a34a", fontSize: ".78rem" }}>Cleared</span>
                      }
                    </td>
                    <td style={{ fontSize: ".78rem", color: "var(--muted)" }}>{memberSince(m.payment_date)}</td>
                    <td><DueBadge due={m.due_date} /></td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {m.outstanding > 0 && m.profile_id && (
                          <button onClick={() => setPayTarget(m)} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: ".72rem", fontWeight: 600, cursor: "pointer", background: "rgba(180,131,9,.08)", border: "1px solid rgba(180,131,9,.25)", color: "#b45309" }}>
                            <i className="fas fa-plus-circle" /> Payment
                          </button>
                        )}
                        <a href={waLink(m.phone, m.name, m.due_date)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: ".72rem", fontWeight: 600, textDecoration: "none", background: "rgba(37,211,102,.08)", border: "1px solid rgba(37,211,102,.25)", color: "#15803d" }}>
                          <i className="fab fa-whatsapp" /> Remind
                        </a>
                        <Link href={`/dashboard/receptionist/receipt/${m.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: ".72rem", fontWeight: 600, textDecoration: "none", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.12)", color: "var(--muted)" }}>
                          <i className="fas fa-receipt" /> Receipt
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showReg  && <RegisterModal onClose={() => setShowReg(false)} onRegistered={load} />}
      {payTarget && <PaymentModal member={payTarget} onClose={() => setPayTarget(null)} onDone={load} />}
    </div>
  );
}
