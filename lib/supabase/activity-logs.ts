import type { Database } from "@/lib/supabase/database.types";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

export async function recordActivity(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
  activity: Pick<ActivityLogInsert, "action" | "summary">,
) {
  if (!user.email) {
    console.error(
      `Could not record activity "${activity.action}": authenticated user has no email address.`,
    );
    return;
  }

  const { error } = await supabase.from("activity_logs").insert({
    actor_user_id: user.id,
    actor_email: user.email,
    action: activity.action,
    summary: activity.summary,
  });

  if (error) {
    console.error(`Could not record activity "${activity.action}":`, error.message);
  }
}
