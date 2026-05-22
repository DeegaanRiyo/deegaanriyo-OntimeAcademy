import { createClient as createServiceClient } from "@supabase/supabase-js";
import BookingsManageClient from "./BookingsManageClient";

export const revalidate = 0;

export default async function ReceptionistBookingsPage() {
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: spaces } = await service
    .from("spaces")
    .select("id, name, slug")
    .order("name");

  return <BookingsManageClient spaces={spaces ?? []} />;
}
