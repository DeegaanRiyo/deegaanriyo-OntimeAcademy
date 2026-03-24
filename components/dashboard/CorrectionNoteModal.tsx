"use client";

import { useState } from "react";

interface Props {
  recordType:   "booking" | "student" | "member" | "payment";
  recordId:     string;
  recordLabel:  string;
  onClose:      () => void;
  onSubmitted?: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  booking: "fa-calendar-alt",
  student: "fa-user-graduate",
  member:  "fa-id-card",
  payment: "fa-money-bill-wave",
};

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)",
  borderRadius: "8px", padding: "9px 12px", color: "var(--dark)", fontSize: ".85rem",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: ".65rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: "6px",
};

export default function CorrectionNoteModal({ recordType, recordId, recordLabel, onClose, onSubmitted }: Props) {
  const [note,             setNote]             = useState("");
  const [hasDiscrepancy,   setHasDiscrepancy]   = useState(false);
  const [recordedAmount,   setRecordedAmount]   = useState("");
  const [correctAmount,    setCorrectAmount]    = useState("");
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState<string | null>(null);
  const [done,             setDone]             = useState(false);

  const recAmt  = Number(recordedAmount) || 0;
  const corrAmt = Number(correctAmount)  || 0;
  const diff    = corrAmt - recAmt;           // positive = underpaid, negative = overpaid

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) { setError("Please describe the correction needed."); return; }
    if (hasDiscrepancy) {
      if (recAmt <= 0 || corrAmt <= 0) { setError("Enter both recorded and correct amounts."); return; }
      if (recAmt === corrAmt)          { setError("Amounts are the same — no discrepancy to flag."); return; }
    }

    setError(null); setLoading(true);
    try {
      const body: Record<string, any> = {
        record_type:  recordType,
        record_id:    recordId,
        record_label: recordLabel,
        note:         note.trim(),
      };
      if (hasDiscrepancy) {
        body.recorded_amount = recAmt;
        body.correct_amount  = corrAmt;
      }

      const res  = await fetch("/api/corrections", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit.");
      setDone(true);
      onSubmitted?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "480px", width: "100%", padding: "24px", gap: 0, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-flag" style={{ color: "#b45309", fontSize: ".88rem" }} />
            Flag for Correction
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {done ? (
          <div>
            <div style={{ background: "rgba(22,163,74,.08)", border: "1px solid rgba(22,163,74,.25)", borderRadius: "10px", padding: "18px", marginBottom: "16px", textAlign: "center" }}>
              <i className="fas fa-check-circle" style={{ color: "#16a34a", fontSize: "1.6rem", display: "block", marginBottom: "10px" }} />
              <div style={{ fontWeight: 700, color: "#16a34a", marginBottom: "4px" }}>Note submitted</div>
              <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>The owner has been notified and will review the correction.</div>
            </div>
            <button onClick={onClose} className="btn-outline" style={{ width: "100%" }}>Close</button>
          </div>
        ) : (
          <>
            {/* Record reference */}
            <div style={{ background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.1)", borderRadius: "8px", padding: "10px 14px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
              <i className={`fas ${TYPE_ICONS[recordType]}`} style={{ color: "#b45309", fontSize: ".85rem", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: "2px" }}>{recordType}</div>
                <div style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--dark)" }}>{recordLabel}</div>
              </div>
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Description */}
              <div>
                <span style={lbl}>Describe the correction needed <span style={{ color: "#dc2626" }}>*</span></span>
                <textarea
                  value={note}
                  onChange={(e) => { setNote(e.target.value); setError(null); }}
                  rows={3}
                  placeholder="e.g. Payment was recorded as KES 2,000 but client actually paid KES 2,500 in cash."
                  style={{ ...inp, resize: "vertical" }}
                />
              </div>

              {/* Payment discrepancy toggle */}
              <div style={{ background: "rgba(17,17,17,.03)", border: "1px solid rgba(17,17,17,.08)", borderRadius: "9px", padding: "12px 14px" }}>
                <button
                  type="button"
                  onClick={() => { setHasDiscrepancy((p) => !p); setError(null); }}
                  style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
                >
                  {/* toggle pill */}
                  <div style={{
                    width: "34px", height: "18px", borderRadius: "9px", flexShrink: 0, transition: "background .2s",
                    background: hasDiscrepancy ? "#b45309" : "rgba(17,17,17,.18)",
                    position: "relative",
                  }}>
                    <div style={{
                      position: "absolute", top: "2px", width: "14px", height: "14px", borderRadius: "50%",
                      background: "#fff", transition: "left .2s",
                      left: hasDiscrepancy ? "18px" : "2px",
                      boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--dark)" }}>Payment discrepancy involved</div>
                    <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: "1px" }}>Toggle to specify recorded vs. correct amounts</div>
                  </div>
                </button>

                {hasDiscrepancy && (
                  <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Amount fields */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <span style={lbl}>Recorded Amount (KES)</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: ".78rem", color: "var(--muted)", fontWeight: 600, flexShrink: 0 }}>KES</span>
                          <input
                            type="number" min={0} step={1} placeholder="0"
                            value={recordedAmount}
                            onChange={(e) => { setRecordedAmount(e.target.value); setError(null); }}
                            style={{ ...inp }}
                          />
                        </div>
                        <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "3px" }}>What's in the system</div>
                      </div>
                      <div>
                        <span style={lbl}>Correct Amount (KES)</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: ".78rem", color: "var(--muted)", fontWeight: 600, flexShrink: 0 }}>KES</span>
                          <input
                            type="number" min={0} step={1} placeholder="0"
                            value={correctAmount}
                            onChange={(e) => { setCorrectAmount(e.target.value); setError(null); }}
                            style={{ ...inp }}
                          />
                        </div>
                        <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "3px" }}>What it should be</div>
                      </div>
                    </div>

                    {/* Live discrepancy summary */}
                    {recAmt > 0 && corrAmt > 0 && recAmt !== corrAmt && (
                      <div style={{
                        borderRadius: "7px", padding: "10px 13px",
                        background: diff > 0 ? "rgba(220,38,38,.06)" : "rgba(180,131,9,.06)",
                        border: diff > 0 ? "1px solid rgba(220,38,38,.2)" : "1px solid rgba(180,131,9,.2)",
                        display: "flex", alignItems: "center", gap: "10px",
                      }}>
                        <i className={`fas ${diff > 0 ? "fa-arrow-trend-down" : "fa-arrow-trend-up"}`}
                           style={{ color: diff > 0 ? "#dc2626" : "#b45309", fontSize: ".85rem" }} />
                        <div>
                          <div style={{ fontSize: ".78rem", fontWeight: 700, color: diff > 0 ? "#dc2626" : "#b45309" }}>
                            {diff > 0
                              ? `KES ${diff.toLocaleString()} underpaid (client paid less)`
                              : `KES ${Math.abs(diff).toLocaleString()} overpaid (client paid more)`}
                          </div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "1px" }}>
                            Discrepancy: KES {recAmt.toLocaleString()} recorded → KES {corrAmt.toLocaleString()} correct
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Info note */}
              <div style={{ background: "rgba(180,131,9,.06)", border: "1px solid rgba(180,131,9,.2)", borderRadius: "7px", padding: "9px 13px", fontSize: ".75rem", color: "#92400e" }}>
                <i className="fas fa-info-circle" style={{ marginRight: "6px" }} />
                Submitted to the <strong>owner only</strong> — no data is changed automatically. The owner reviews and applies corrections.
              </div>

              {error && (
                <p style={{ color: "#dc2626", fontSize: ".72rem", margin: 0 }}>
                  <i className="fas fa-circle-exclamation" style={{ marginRight: "4px" }} />{error}
                </p>
              )}

              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={loading} style={{
                  flex: 2, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px",
                  padding: "10px 16px", borderRadius: "8px", fontWeight: 700, fontSize: ".85rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  background: "#b45309", border: "none", color: "#fff", opacity: loading ? .6 : 1,
                }}>
                  {loading ? <><i className="fas fa-spinner fa-spin" />Submitting…</> : <><i className="fas fa-paper-plane" />Submit to Owner</>}
                </button>
                <button type="button" onClick={onClose} className="btn-outline" disabled={loading} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
