"use client";

import { useState } from "react";
import Link from "next/link";
import SpaceLiveBoard from "@/components/dashboard/SpaceLiveBoard";
import BookSpaceForm from "@/components/dashboard/BookSpaceForm";

export default function ManagerSpacesPage() {
  const [showForm,      setShowForm]      = useState(false);
  const [bookingSpaceId, setBookingSpaceId] = useState<string | undefined>();
  const [spaces, setSpaces] = useState<{ id: string; name: string; slug: string }[]>([]);

  async function loadSpaces() {
    const res = await fetch("/api/spaces/live");
    if (res.ok) {
      const json = await res.json();
      setSpaces((json.spaces ?? []).map((s: any) => ({ id: s.id, name: s.name, slug: s.slug })));
    }
  }

  function handleBook(spaceId?: string) {
    setBookingSpaceId(spaceId);
    if (spaces.length === 0) loadSpaces();
    setShowForm(true);
  }

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Spaces — Live Status</h2>
          <p>Monitor and manage all bookable spaces · auto-refreshes every 30s</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => handleBook()}
            className="btn-primary"
            style={{ border: "none", cursor: "pointer" }}
          >
            <i className="fas fa-plus" style={{ marginRight: "7px" }} />
            Book a Space
          </button>
          <Link href="/dashboard/receptionist/live" className="btn-outline" style={{ textDecoration: "none" }}>
            <i className="fas fa-tv" style={{ marginRight: "7px" }} />
            Display Board
          </Link>
        </div>
      </div>

      <SpaceLiveBoard
        basePath="/dashboard/manager"
        onBook={handleBook}
      />

      {showForm && spaces.length > 0 && (
        <BookSpaceForm
          spaces={spaces}
          defaultSpaceId={bookingSpaceId}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
