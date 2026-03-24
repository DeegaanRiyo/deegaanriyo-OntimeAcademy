import { createClient } from "@/lib/supabase/server";
import SpaceSettingsForm from "@/components/dashboard/SpaceSettingsForm";
import type { Space } from "@/types";
import EmptyState from "@/components/dashboard/EmptyState";

export default async function AdminSpacesPage() {
  const supabase = await createClient();
  const { data: spaces } = await supabase.from("spaces").select("*").order("name", { ascending: true });

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Spaces</h2>
          <p>Toggle availability and update pricing. Changes go live immediately.</p>
        </div>
      </div>

      {!spaces || spaces.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="fas fa-door-open"
            title="No spaces found"
            description="Add spaces from the Owner dashboard to manage them here."
          />
        </div>
      ) : (
        <div className="grid-2">
          {(spaces as Space[]).map((space) => (
            <SpaceSettingsForm key={space.id} space={space} />
          ))}
        </div>
      )}
    </div>
  );
}
