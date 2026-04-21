import { createClient } from "@/lib/supabase/server";
import SpaceSettingsForm from "@/components/dashboard/SpaceSettingsForm";
import ChangePasswordForm from "@/components/dashboard/ChangePasswordForm";
import type { Space } from "@/types";
import EmptyState from "@/components/dashboard/EmptyState";

export default async function OwnerSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("spaces").select("id, name, slug, hourly_rate, is_available").order("created_at", { ascending: true });
  const spaces: Space[] = (data as Space[]) ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

      {/* ── Space Settings ─────────────────────────────────── */}
      <div>
        <div className="sec-head">
          <div className="sec-head-left">
            <h2>Space Settings</h2>
            <p>Update space pricing and availability. Changes go live immediately.</p>
          </div>
        </div>

        {spaces.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="fas fa-door-open"
              title="No spaces configured"
              description="Run migration 001_spaces.sql first to set up your spaces."
            />
          </div>
        ) : (
          <div className="grid-2">
            {spaces.map((space) => (
              <SpaceSettingsForm key={space.id} space={space} />
            ))}
          </div>
        )}
      </div>

      {/* ── Account Settings ───────────────────────────────── */}
      <div>
        <div className="sec-head">
          <div className="sec-head-left">
            <h2>Account</h2>
            <p>Manage your owner account credentials.</p>
          </div>
        </div>
        <ChangePasswordForm />
      </div>

    </div>
  );
}
