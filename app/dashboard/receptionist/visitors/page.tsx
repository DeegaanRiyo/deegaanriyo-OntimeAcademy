import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VisitorsClient from "./VisitorsClient";

export default async function VisitorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <VisitorsClient />;
}
