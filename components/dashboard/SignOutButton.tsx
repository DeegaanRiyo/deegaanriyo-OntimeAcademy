"use client";

import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Full navigation clears React router state cleanly after sign-out.
    // router.push + router.refresh together caused "Maximum update depth exceeded".
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleSignOut}
      className="sb-item w-full justify-start"
      style={{ color: "rgba(255,255,255,.55)" }}
    >
      <i className="fas fa-sign-out-alt" />
      Sign Out
    </button>
  );
}
