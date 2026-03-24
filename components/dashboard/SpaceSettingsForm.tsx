"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Space } from "@/types";

export default function SpaceSettingsForm({ space }: { space: Space }) {
  const router = useRouter();
  const [rate,      setRate]      = useState(String(space.hourly_rate));
  const [available, setAvailable] = useState(space.is_available);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false);
    const res = await fetch(`/api/spaces/${space.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hourly_rate: Number(rate) || 0, is_available: available }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to save. Try again.");
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  };

  const hasChanges = (Number(rate) || 0) !== space.hourly_rate || available !== space.is_available;

  return (
    <div className="card">
      <div className="card-head">
        <h3><i className="fas fa-door-open" /> {space.name}</h3>
        <button
          onClick={() => setAvailable(!available)}
          className={`badge${available ? " gr" : " rd"} cursor-pointer [border:none] [background:none]`}
        >
          <span className="badge-dot" />
          {available ? "Available" : "Unavailable"}
        </button>
      </div>

      <div className="px-[22px] py-5">
        <div className="form-group mb-4">
          <label className="form-label">Hourly Rate (KES)</label>
          <div className="flex items-center gap-2">
            <span className="text-[var(--muted)] text-[.82rem] font-semibold shrink-0">KES</span>
            <input
              type="number"
              min={0}
              step={100}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="form-input max-w-[160px]"
            />
          </div>
          {(Number(rate) || 0) === 0 && (
            <p className="text-[.68rem] text-[var(--muted)] mt-1">
              Rate on enquiry (shown to visitors when 0)
            </p>
          )}
        </div>

        {error && (
          <div className="bg-[rgba(239,68,68,.08)] border border-[rgba(239,68,68,.25)] rounded-lg px-3.5 py-2.5 text-[.72rem] text-[var(--red)] mb-3.5 flex items-center gap-2">
            <i className="fas fa-circle-exclamation" /> {error}
          </div>
        )}

        {saved && (
          <div className="bg-[rgba(34,197,94,.08)] border border-[rgba(34,197,94,.25)] rounded-lg px-3.5 py-2.5 text-[.72rem] text-[var(--green)] mb-3.5 flex items-center gap-2">
            <i className="fas fa-check-circle" /> Changes saved successfully.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="btn-sm btn-primary disabled:opacity-50"
        >
          {saving ? <><i className="fas fa-circle-notch fa-spin" /> Saving…</> : <><i className="fas fa-save" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}
