"use client";

import { useState } from "react";

type Props = {
  userId:   string;
  isActive: boolean;
  name:     string;
};

export default function ProfileActions({ userId, isActive, name }: Props) {

  const [active,           setActive]           = useState(isActive);
  const [showPwForm,       setShowPwForm]       = useState(false);
  const [newPassword,      setNewPassword]      = useState("");
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);

  const [pwLoading,        setPwLoading]        = useState(false);
  const [toggleLoading,    setToggleLoading]    = useState(false);
  const [deleteLoading,    setDeleteLoading]    = useState(false);

  const [pwError,          setPwError]          = useState<string | null>(null);
  const [pwSuccess,        setPwSuccess]        = useState(false);
  const [toggleError,      setToggleError]      = useState<string | null>(null);
  const [deleteError,      setDeleteError]      = useState<string | null>(null);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    setPwLoading(true); setPwError(null);
    const res  = await fetch("/api/owner/change-password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, newPassword }) });
    const json = await res.json();
    setPwLoading(false);
    if (!res.ok) { setPwError(json.error ?? "Failed"); return; }
    setPwSuccess(true); setNewPassword(""); setShowPwForm(false);
    setTimeout(() => setPwSuccess(false), 3000);
  };

  const handleToggle = async () => {
    setToggleLoading(true); setToggleError(null);
    const res  = await fetch("/api/owner/toggle-user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, is_active: !active }) });
    const json = await res.json();
    setToggleLoading(false);
    if (!res.ok) { setToggleError(json.error ?? "Failed"); return; }
    setActive((v) => !v);
  };

  const handleDelete = async () => {
    setDeleteLoading(true); setDeleteError(null);
    const res  = await fetch("/api/owner/delete-user", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    const json = await res.json();
    setDeleteLoading(false);
    if (!res.ok) { setDeleteError(json.error ?? "Failed"); return; }
    window.location.href = "/dashboard/manager/team";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Change Password */}
      <div className="card">
        <div className="card-head"><h3><i className="fas fa-key" /> Change Password</h3></div>
        <div style={{ padding: "0 20px 20px" }}>
          {pwSuccess && <div style={{ color: "var(--green)", fontSize: ".8rem", marginBottom: "10px" }}><i className="fas fa-check-circle" /> Password updated.</div>}
          {!showPwForm ? (
            <button className="btn-outline" onClick={() => setShowPwForm(true)}><i className="fas fa-lock" /> Set New Password</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input type="text" className="form-input" placeholder="New password (min. 6 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              {pwError && <p style={{ color: "var(--red)", fontSize: ".68rem" }}>{pwError}</p>}
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-primary" onClick={handleChangePassword} disabled={pwLoading} style={{ flex: 1 }}>
                  {pwLoading ? <><span className="spinner" /> Saving…</> : <><i className="fas fa-check" /> Save</>}
                </button>
                <button className="btn-outline" onClick={() => { setShowPwForm(false); setNewPassword(""); setPwError(null); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activate / Deactivate */}
      <div className="card">
        <div className="card-head">
          <h3><i className={`fas ${active ? "fa-ban" : "fa-check-circle"}`} /> {active ? "Deactivate" : "Activate"} Account</h3>
        </div>
        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ color: "var(--muted)", fontSize: ".8rem", marginBottom: "12px" }}>
            {active ? "Immediately revokes login access. Data is preserved." : "Restores login access."}
          </p>
          {toggleError && <p style={{ color: "var(--red)", fontSize: ".68rem", marginBottom: "8px" }}>{toggleError}</p>}
          <button
            className={active ? "btn-outline" : "btn-primary"}
            onClick={handleToggle}
            disabled={toggleLoading}
            style={active ? { borderColor: "var(--red)", color: "var(--red)" } : {}}
          >
            {toggleLoading ? <><span className="spinner" /> Please wait…</> : active ? <><i className="fas fa-ban" /> Deactivate</> : <><i className="fas fa-check-circle" /> Activate</>}
          </button>
        </div>
      </div>

      {/* Delete */}
      <div className="card" style={{ borderColor: "rgba(239,68,68,.3)" }}>
        <div className="card-head"><h3 style={{ color: "var(--red)" }}><i className="fas fa-trash" /> Delete Account</h3></div>
        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ color: "var(--muted)", fontSize: ".8rem", marginBottom: "12px" }}>Permanently deletes this account. Cannot be undone.</p>
          {deleteError && <p style={{ color: "var(--red)", fontSize: ".68rem", marginBottom: "8px" }}>{deleteError}</p>}
          <button className="act-btn del" onClick={() => setShowDeleteModal(true)}><i className="fas fa-trash" /> Delete Account</button>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setShowDeleteModal(false)}>
          <div className="card" style={{ maxWidth: "400px", width: "90%", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "12px" }}>Delete Account?</h3>
            <p style={{ color: "var(--muted)", fontSize: ".85rem", marginBottom: "20px" }}>
              Permanently deletes <strong style={{ color: "var(--white)" }}>{name}</strong>&apos;s account. Cannot be undone.
            </p>
            {deleteError && <p style={{ color: "var(--red)", fontSize: ".68rem", marginBottom: "10px" }}>{deleteError}</p>}
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="act-btn del" onClick={handleDelete} disabled={deleteLoading} style={{ flex: 1 }}>
                {deleteLoading ? "Deleting…" : <><i className="fas fa-trash" /> Yes, Delete</>}
              </button>
              <button className="btn-outline" onClick={() => setShowDeleteModal(false)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
