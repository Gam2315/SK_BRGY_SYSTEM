import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function isPortalAdmin(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc(
    "is_portal_admin",
    {},
    { get: true },
  );

  if (error) {
    console.error("Could not verify portal administrator membership:", error.message);
    return false;
  }

  return data;
}
