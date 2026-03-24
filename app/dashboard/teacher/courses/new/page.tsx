import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import CreateCourseForm from "@/components/dashboard/teacher/CreateCourseForm";

export default async function NewCoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await serviceClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "teacher") redirect("/dashboard");

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>New Course</h2>
          <p>Complete the sections below — you can always edit details after creating the course.</p>
        </div>
      </div>
      <CreateCourseForm />
    </div>
  );
}
