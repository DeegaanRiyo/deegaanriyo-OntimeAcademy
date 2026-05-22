export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "receptionist";

  if (role === "owner")        redirect("/dashboard/owner");
  if (role === "manager")      redirect("/dashboard/manager");
  if (role === "receptionist") redirect("/dashboard/receptionist");

  // Any unrecognised role — sign out and send to login
  await supabase.auth.signOut();
  redirect("/login");
}
