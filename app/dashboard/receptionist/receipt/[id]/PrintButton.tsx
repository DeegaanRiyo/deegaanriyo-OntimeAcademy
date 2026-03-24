"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-primary"
      style={{ border: "none", cursor: "pointer" }}
    >
      <i className="fas fa-print" style={{ marginRight: "7px" }} />
      Print Receipt
    </button>
  );
}
