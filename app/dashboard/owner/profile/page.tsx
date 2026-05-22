import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import ChangePasswordForm from "@/components/dashboard/ChangePasswordForm";
import ChangeNameForm from "@/components/dashboard/ChangeNameForm";
import SpaceSettingsForm from "@/components/dashboard/SpaceSettingsForm";
import EmptyState from "@/components/dashboard/EmptyState";
import type { Space } from "@/types";

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
}

export default async function OwnerProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: profile },
    { data: spacesRaw },
  ] = await Promise.all([
    service
      .from("profiles")
      .select("full_name, email, username, created_at")
      .eq("id", user?.id ?? "")
      .single(),
    supabase
      .from("spaces")
      .select("id, name, slug, hourly_rate, is_available")
      .order("created_at", { ascending: true }),
  ]);

  const spaces: Space[] = (spacesRaw as Space[]) ?? [];
  const name     = profile?.full_name || profile?.email || "Owner";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>My Profile</h2>
          <p>Account details and workspace configuration</p>
        </div>
      </div>

      {/* ── Profile card ────────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "14px",
        overflow: "hidden",
      }}>
        {/* Dark banner */}
        <div style={{ background: "#0f1a14", padding: "24px 28px", display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "var(--accent)", color: "#0f1a14",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.2rem", fontWeight: 800, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{name}</div>
            <div style={{ fontSize: ".75rem", color: "rgba(255,255,255,.45)", marginTop: "2px" }}>Chief Executive Officer · CEO Portal</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "32px" }}>
            {[
              { label: "Role",    value: "Owner"       },
              { label: "Member since", value: fmtDate(profile?.created_at) },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: ".62rem", fontWeight: 600, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "3px" }}>{label}</div>
                <div style={{ fontSize: ".82rem", fontWeight: 700, color: "rgba(255,255,255,.8)" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile details */}
        <div style={{ padding: "22px 28px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {[
            { label: "Full Name", value: profile?.full_name || "—", icon: "fa-user" },
            { label: "Email",     value: profile?.email     || "—", icon: "fa-envelope" },
            { label: "Username",  value: profile?.username  || "—", icon: "fa-at" },
          ].map(({ label, value, icon }) => (
            <div key={label}>
              <div style={{ fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px", display: "flex", alignItems: "center", gap: "5px" }}>
                <i className={`fas ${icon}`} style={{ fontSize: ".55rem" }} />{label}
              </div>
              <div style={{ fontSize: ".88rem", color: "var(--dark)", fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Change name ─────────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--muted)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fas fa-user-pen" style={{ fontSize: ".6rem" }} /> Display Name
        </div>
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "12px", padding: "22px 24px" }}>
          <ChangeNameForm currentName={profile?.full_name ?? ""} />
        </div>
      </div>

      {/* ── Change password ──────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--muted)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fas fa-lock" style={{ fontSize: ".6rem" }} /> Security
        </div>
        <ChangePasswordForm />
      </div>

      {/* ── Space settings ───────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--muted)", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-door-open" style={{ fontSize: ".6rem" }} /> Space Configuration
          </div>
          <span style={{ fontSize: ".65rem", color: "var(--muted2)" }}>Changes go live immediately</span>
        </div>

        {spaces.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="fas fa-door-open"
              title="No spaces configured"
              description="Run migration 001_spaces.sql first to set up your co-working spaces."
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

    </div>
  );
}
