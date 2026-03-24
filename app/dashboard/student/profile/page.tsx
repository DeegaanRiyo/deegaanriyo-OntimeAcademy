import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentProfileForm from "@/components/dashboard/student/StudentProfileForm";

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name, email, avatar_url").eq("id", user.id).single();
  if (profile?.role !== "student") redirect("/dashboard");

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>My Profile</h2>
          <p>Update your account information</p>
        </div>
      </div>
      <StudentProfileForm
        userId={user.id}
        initialName={profile?.full_name ?? ""}
        initialEmail={profile?.email ?? user.email ?? ""}
        initialAvatar={profile?.avatar_url ?? ""}
      />
    </div>
  );
}
