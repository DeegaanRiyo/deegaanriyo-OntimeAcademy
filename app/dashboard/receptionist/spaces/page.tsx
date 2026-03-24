"use client";

import { useState } from "react";
import SpaceLiveBoard from "@/components/dashboard/SpaceLiveBoard";
import BookSpaceForm from "@/components/dashboard/BookSpaceForm";

export default function ReceptionistSpacesPage() {
  const [showBookForm, setShowBookForm] = useState(false);
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
    setShowBookForm(true);
  }

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Spaces — Live Status</h2>
          <p>All 4 bookable spaces · auto-refreshes every 30s</p>
        </div>
        <button
          onClick={() => handleBook()}
          className="btn-primary"
          style={{ border: "none", cursor: "pointer" }}
        >
          <i className="fas fa-plus" style={{ marginRight: "7px" }} />
          Book a Space
        </button>
      </div>

      <SpaceLiveBoard
        basePath="/dashboard/receptionist"
        onBook={handleBook}
      />

      {showBookForm && spaces.length > 0 && (
        <BookSpaceForm
          spaces={spaces}
          defaultSpaceId={bookingSpaceId}
          onClose={() => setShowBookForm(false)}
        />
      )}
    </div>
  );
}
