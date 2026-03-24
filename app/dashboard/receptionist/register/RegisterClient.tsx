"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "member" | "student";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "member",  label: "Register Member",          icon: "fa-id-card"       },
  { id: "student", label: "Register Physical Student", icon: "fa-user-graduate" },
];

// ── shared helpers ──────────────────────────────────────────

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: ".75rem", fontWeight: 600,
        color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em",
        marginBottom: "6px" }}>
        {label}{required && <span style={{ color: "var(--red)", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)",
        borderRadius: "8px", padding: "10px 12px", color: "var(--dark)",
        fontSize: ".85rem", outline: "none", boxSizing: "border-box" }}
    />
  );
}

function Select({ value, onChange, children }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)",
        borderRadius: "8px", padding: "10px 12px", color: "var(--dark)",
        fontSize: ".85rem", outline: "none" }}
    >
      {children}
    </select>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      style={{ width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)",
        borderRadius: "8px", padding: "10px 12px", color: "var(--dark)",
        fontSize: ".85rem", outline: "none", resize: "vertical", boxSizing: "border-box" }}
    />
  );
}

function Alert({ type, msg }: { type: "success" | "error"; msg: string }) {
  const isOk = type === "success";
  return (
    <div style={{
      padding: "12px 16px", borderRadius: "8px", marginBottom: "20px",
      background: isOk ? "rgba(34,197,94,.12)" : "rgba(248,113,113,.12)",
      border: `1px solid ${isOk ? "rgba(34,197,94,.3)" : "rgba(248,113,113,.3)"}`,
      color: isOk ? "#4ade80" : "#f87171", fontSize: ".82rem",
    }}>
      <i className={`fas ${isOk ? "fa-check-circle" : "fa-exclamation-circle"}`}
        style={{ marginRight: "8px" }} />
      {msg}
    </div>
  );
}

// ── Register Member tab ─────────────────────────────────────

type MemberSuccess = { payment_id: string; temp_password: string; name: string; email: string };

function RegisterMemberForm() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", profession: "",
    membership_fee: "7500", amount_paid: "", method: "cash", reference: "", notes: "",
  });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<MemberSuccess | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const fee         = Number(form.membership_fee) || 0;
  const amtPaid     = Number(form.amount_paid)    || 0;
  const outstanding = fee > 0 ? Math.max(0, fee - amtPaid) : 0;
  const isPartial   = fee > 0 && amtPaid > 0 && amtPaid < fee;
  const isOverpaid  = fee > 0 && amtPaid > fee;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (fee <= 0)    { setError("Enter a valid membership fee."); return; }
    if (amtPaid <= 0) { setError("Enter the amount actually paid."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/register-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, membership_fee: fee, amount: amtPaid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Registration failed");
      setSuccess({ payment_id: json.payment_id, temp_password: json.temp_password,
        name: form.full_name, email: form.email });
      setForm({ full_name: "", email: "", phone: "", profession: "", membership_fee: "7500", amount_paid: "", method: "cash", reference: "", notes: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Success state — show credentials + receipt link ────────
  if (success) {
    return (
      <div>
        <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)",
          borderRadius: "10px", padding: "20px", marginBottom: "20px" }}>
          <div style={{ fontWeight: 700, color: "var(--green)", marginBottom: "12px", fontSize: ".9rem" }}>
            <i className="fas fa-check-circle" style={{ marginRight: "8px" }} />
            {success.name} registered successfully
          </div>
          <div style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: "16px" }}>
            Hand these login credentials to the member:
          </div>
          <div style={{ background: "var(--dark3)", borderRadius: "8px", padding: "12px 16px",
            fontSize: ".85rem", marginBottom: "16px" }}>
            <div style={{ marginBottom: "6px" }}>
              <span style={{ color: "var(--muted)" }}>Email: </span>
              <strong style={{ color: "var(--white)" }}>{success.email}</strong>
            </div>
            <div>
              <span style={{ color: "var(--muted)" }}>Temp Password: </span>
              <strong style={{ color: "var(--teal2)", letterSpacing: ".05em" }}>{success.temp_password}</strong>
            </div>
          </div>
          <div style={{ fontSize: ".72rem", color: "var(--muted)", marginBottom: "16px" }}>
            The member can reset their password anytime via the login page.
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href={`/dashboard/receptionist/receipt/${success.payment_id}`}
              className="btn-primary" style={{ textDecoration: "none" }}>
              <i className="fas fa-receipt" style={{ marginRight: "7px" }} />Print Receipt
            </Link>
            <button onClick={() => setSuccess(null)} className="btn-outline"
              style={{ border: "1px solid var(--border)", cursor: "pointer", background: "none",
                color: "var(--muted)", borderRadius: "8px", padding: "9px 18px", fontSize: ".82rem" }}>
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {error && <Alert type="error" msg={error} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Full Name" required>
          <Input value={form.full_name} onChange={set("full_name")} placeholder="Jane Mwangi" required />
        </Field>
        <Field label="Phone" required>
          <Input value={form.phone} onChange={set("phone")} placeholder="07XX XXX XXX" required />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={form.email} onChange={set("email")} placeholder="jane@email.com" required />
        </Field>
        <Field label="Profession">
          <Input value={form.profession} onChange={set("profession")} placeholder="e.g. Freelance Designer" />
        </Field>
        <Field label="Membership Fee (KES)" required>
          <Input
            type="number" min="1" step="1"
            value={form.membership_fee}
            onChange={set("membership_fee")}
            placeholder="7500"
            required
          />
        </Field>
        <Field label="Amount Paid (KES)" required>
          <Input
            type="number" min="1" step="1"
            value={form.amount_paid}
            onChange={set("amount_paid")}
            placeholder="e.g. 5000"
            required
          />
        </Field>
      </div>

      {/* Live balance preview */}
      {fee > 0 && amtPaid > 0 && (
        <div style={{
          borderRadius: "8px", padding: "11px 15px", marginBottom: "16px",
          background: isOverpaid ? "rgba(59,130,246,.07)" : isPartial ? "rgba(245,158,11,.07)" : "rgba(34,197,94,.07)",
          border: isOverpaid ? "1px solid rgba(59,130,246,.25)" : isPartial ? "1px solid rgba(245,158,11,.25)" : "1px solid rgba(34,197,94,.25)",
          fontSize: ".8rem", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <i className={`fas ${isOverpaid ? "fa-arrow-up" : isPartial ? "fa-clock" : "fa-check-circle"}`}
            style={{ color: isOverpaid ? "var(--blue)" : isPartial ? "#d97706" : "var(--green)", fontSize: ".85rem" }} />
          <div>
            {isPartial && (
              <><strong style={{ color: "#d97706" }}>Partial payment</strong>
                <span style={{ color: "var(--muted)" }}> · KES {outstanding.toLocaleString()} outstanding</span></>
            )}
            {!isPartial && !isOverpaid && (
              <strong style={{ color: "var(--green)" }}>Full payment · KES {fee.toLocaleString()} settled</strong>
            )}
            {isOverpaid && (
              <><strong style={{ color: "var(--blue)" }}>Overpayment</strong>
                <span style={{ color: "var(--muted)" }}> · KES {(amtPaid - fee).toLocaleString()} over the agreed fee</span></>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Payment Method" required>
          <Select value={form.method} onChange={(v) => setForm((p) => ({ ...p, method: v }))}>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
          </Select>
        </Field>
        {form.method === "bank_transfer" && (
          <Field label="Bank Reference">
            <Input value={form.reference} onChange={set("reference")} placeholder="Transaction ref" />
          </Field>
        )}
      </div>

      <Field label="Notes">
        <Textarea value={form.notes} onChange={set("notes")} placeholder="Any additional notes..." />
      </Field>

      <button type="submit" className="btn-primary" disabled={loading}
        style={{ border: "none", cursor: "pointer", opacity: loading ? .6 : 1 }}>
        {loading
          ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Registering…</>
          : <><i className="fas fa-user-plus" style={{ marginRight: "8px" }} />Register Member · KES {amtPaid > 0 ? amtPaid.toLocaleString() : "—"} paid</>
        }
      </button>
    </form>
  );
}

// ── Register Physical Student tab ──────────────────────────

type StudentSuccess = { payment_id: string; name: string; class_name: string };

function RegisterStudentForm() {
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", class_name: "",
    amount: "", method: "cash", reference: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<StudentSuccess | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/register-physical-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSuccess({ payment_id: json.payment_id, name: form.full_name, class_name: form.class_name });
      setForm({ full_name: "", phone: "", email: "", class_name: "", amount: "", method: "cash", reference: "", notes: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)",
        borderRadius: "10px", padding: "20px" }}>
        <div style={{ fontWeight: 700, color: "var(--green)", marginBottom: "8px", fontSize: ".9rem" }}>
          <i className="fas fa-check-circle" style={{ marginRight: "8px" }} />
          {success.name} recorded for {success.class_name}
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
          <Link href={`/dashboard/receptionist/receipt/${success.payment_id}`}
            className="btn-primary" style={{ textDecoration: "none" }}>
            <i className="fas fa-receipt" style={{ marginRight: "7px" }} />Print Receipt
          </Link>
          <button onClick={() => setSuccess(null)} className="btn-outline"
            style={{ border: "1px solid var(--border)", cursor: "pointer", background: "none",
              color: "var(--muted)", borderRadius: "8px", padding: "9px 18px", fontSize: ".82rem" }}>
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {error && <Alert type="error" msg={error} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Full Name" required>
          <Input value={form.full_name} onChange={set("full_name")} placeholder="Ahmed Hassan" required />
        </Field>
        <Field label="Phone" required>
          <Input value={form.phone} onChange={set("phone")} placeholder="07XX XXX XXX" required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={set("email")} placeholder="ahmed@email.com" />
        </Field>
        <Field label="Class / Course" required>
          <Input value={form.class_name} onChange={set("class_name")} placeholder="e.g. Python Bootcamp — Batch 3" required />
        </Field>
        <Field label="Amount (KES)" required>
          <Input type="number" min="1" value={form.amount} onChange={set("amount")} placeholder="e.g. 5000" required />
        </Field>
        <Field label="Payment Method" required>
          <Select value={form.method} onChange={(v) => setForm((p) => ({ ...p, method: v }))}>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
          </Select>
        </Field>
        {form.method === "bank_transfer" && (
          <Field label="Bank Reference">
            <Input value={form.reference} onChange={set("reference")} placeholder="Transaction ref" />
          </Field>
        )}
      </div>

      <Field label="Notes">
        <Textarea value={form.notes} onChange={set("notes")} placeholder="Any additional notes..." />
      </Field>

      <button type="submit" className="btn-primary" disabled={loading}
        style={{ border: "none", cursor: "pointer", opacity: loading ? .6 : 1 }}>
        {loading
          ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Recording…</>
          : <><i className="fas fa-user-graduate" style={{ marginRight: "8px" }} />Record Student & Payment</>
        }
      </button>
    </form>
  );
}

// ── Main component ──────────────────────────────────────────

export default function RegisterClient() {
  const [tab, setTab] = useState<Tab>("member");

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Walk-in Registration</h2>
          <p>Register new members or physical students</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "9px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontSize: ".8rem", fontWeight: 600, transition: "all .15s",
              background: tab === t.id ? "var(--teal)"    : "var(--surface2)",
              color:      tab === t.id ? "var(--dark)"    : "var(--muted)",
            }}
          >
            <i className={`fas ${t.icon}`} style={{ marginRight: "8px" }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Form card */}
      <div className="card" style={{ maxWidth: "680px" }}>
        <div className="card-head">
          <h3>
            <i className={`fas ${TABS.find((t) => t.id === tab)!.icon}`} style={{ marginRight: "8px" }} />
            {TABS.find((t) => t.id === tab)!.label}
          </h3>
        </div>
        <div style={{ padding: "24px" }}>
          {tab === "member"  && <RegisterMemberForm />}
          {tab === "student" && <RegisterStudentForm />}
        </div>
      </div>
    </div>
  );
}
