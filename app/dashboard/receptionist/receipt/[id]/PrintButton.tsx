"use client";

export default function PrintButton() {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        onClick={() => window.print()}
        style={{
          display: "flex", alignItems: "center", gap: "7px",
          padding: "9px 16px", borderRadius: "8px", border: "none",
          background: "#111", color: "#fff",
          fontSize: ".83rem", fontWeight: 700, cursor: "pointer",
        }}
      >
        <i className="fas fa-print" />
        Print / Save PDF
      </button>
    </div>
  );
}
