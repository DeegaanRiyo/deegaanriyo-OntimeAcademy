"use client";

import { useState } from "react";

export type BookingRow = {
  id: string;
  visitor_name: string;
  visitor_email: string | null;
  visitor_phone: string;
  booking_date: string;
  start_time: string;
  hours: number;
  estimated_cost: number | null;
  status: string;
  created_at: string;
  spaces: { name: string } | null;
};

type Tab = "all" | "pending" | "confirmed" | "rejected";

const TABS: { label: string; value: Tab }[] = [
  { label: "All",       value: "all"       },
  { label: "Pending",   value: "pending"   },
  { label: "Confirmed", value: "confirmed" },
  { label: "Rejected",  value: "rejected"  },
];

function badgeCls(status: string): string {
  const map: Record<string, string> = { pending: "badge gd", confirmed: "badge gr", rejected: "badge rd", cancelled: "badge" };
  return map[status] ?? "badge";
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function formatDuration(hours: number) {
  return hours === 9 ? "Full Day" : `${hours} hr${hours > 1 ? "s" : ""}`;
}
function formatCost(cost: number | null) {
  return cost ? `KES ${cost.toLocaleString()}` : "—";
}

interface Props { initialBookings: BookingRow[]; }

export default function BookingsClient({ initialBookings }: Props) {
  const [activeTab,  setActiveTab]  = useState<Tab>("pending");
  const [rows,       setRows]       = useState<BookingRow[]>(initialBookings);
  const [loadingId,  setLoadingId]  = useState<string | null>(null);

  const filtered   = activeTab === "all" ? rows : rows.filter((r) => r.status === activeTab);
  const countFor   = (tab: Tab) => tab === "all" ? rows.length : rows.filter((r) => r.status === tab).length;

  async function handleAction(id: string, status: "confirmed" | "rejected") {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body?.error ?? "Action failed. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-[18px] flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`pill-tab${activeTab === tab.value ? " on" : ""}`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-70">({countFor(tab.value)})</span>
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty !py-12 !px-5">
            <i className="fas fa-calendar-times" />
            <p>No {activeTab === "all" ? "" : activeTab} bookings found.</p>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Space</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Est. Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const isLoading = loadingId === b.id;
                  return (
                    <tr key={b.id} className={isLoading ? "opacity-60" : ""}>
                      <td>
                        <div className="font-semibold text-[.82rem]">{b.visitor_name}</div>
                        {b.visitor_email && <div className="text-[.65rem] text-[var(--muted)]">{b.visitor_email}</div>}
                        <div className="text-[.65rem] text-[var(--muted)]">{b.visitor_phone}</div>
                      </td>
                      <td>{b.spaces?.name ?? "—"}</td>
                      <td>{formatDate(b.booking_date)}</td>
                      <td>{b.start_time}</td>
                      <td>{formatDuration(b.hours)}</td>
                      <td className="font-semibold">{formatCost(b.estimated_cost)}</td>
                      <td>
                        <span className={badgeCls(b.status)}>
                          <span className="badge-dot" />{b.status}
                        </span>
                      </td>
                      <td>
                        {b.status === "pending" ? (
                          <div className="td-action">
                            {isLoading ? (
                              <i className="fas fa-circle-notch fa-spin text-[var(--teal2)]" />
                            ) : (
                              <>
                                <button onClick={() => handleAction(b.id, "confirmed")} disabled={isLoading} className="act-btn confirm" title="Confirm">
                                  <i className="fas fa-check" />
                                </button>
                                <button onClick={() => handleAction(b.id, "rejected")} disabled={isLoading} className="act-btn del" title="Reject">
                                  <i className="fas fa-times" />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--muted2)] text-[.72rem]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
