"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/supabase/activity-logs";
import { isAdminEmail } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type EducationApplicationSettingsState = {
  error?: string;
  success?: string;
};

export async function updateEducationApplicationAvailability(
  _previousState: EducationApplicationSettingsState,
  formData: FormData,
): Promise<EducationApplicationSettingsState> {
  const isOpenValue = formData.get("is_open");

  if (isOpenValue !== "true" && isOpenValue !== "false") {
    return { error: "Choose whether to open or close applications." };
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error(
      "Could not verify education application settings session:",
      authError.message,
    );
    return { error: "Could not verify your session. Sign in again and retry." };
  }

  if (!data.user?.id || !data.user.email || !isAdminEmail(data.user.email)) {
    return {
      error: "Only the configured portal administrator can change application availability.",
    };
  }

  const isOpen = isOpenValue === "true";
  const { data: setting, error } = await supabase
    .from("educational_assistance_settings")
    .update({
      is_open: isOpen,
      updated_at: new Date().toISOString(),
      updated_by: data.user.id,
    })
    .eq("id", true)
    .select("is_open")
    .maybeSingle();

  if (error) {
    console.error(
      "Could not update education application availability:",
      error.message,
    );
    return {
      error: `Could not save the setting (${error.code}). Run the latest educational assistance setup SQL and confirm this administrator is listed in public.portal_admins.`,
    };
  }

  if (!setting) {
    return {
      error:
        "Application settings are missing. Run the latest educational assistance setup SQL in Supabase.",
    };
  }

  const status = setting.is_open ? "opened" : "closed";
  await recordActivity(supabase, data.user, {
    action: "Application availability changed",
    summary: `Educational assistance applications ${status}.`,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return {
    success: `Educational assistance applications are now ${status}.`,
  };
}
