"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/supabase/activity-logs";
import { isPortalAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type EducationAssistanceArchiveState = {
  error?: string;
  success?: string;
};

export async function archiveEducationAssistanceApplications(
  _previousState: EducationAssistanceArchiveState,
  formData: FormData,
): Promise<EducationAssistanceArchiveState> {
  const nameValue = formData.get("archive_name");
  const name = typeof nameValue === "string" ? nameValue.trim() : "";

  if (!name || name.length > 120) {
    return {
      error: "Enter an archive name between 1 and 120 characters.",
    };
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error(
      "Could not verify education archive session:",
      authError.message,
    );
    return { error: "Could not verify your session. Sign in again and retry." };
  }

  if (!auth.user?.id || !(await isPortalAdmin(supabase))) {
    return {
      error: "Only portal administrators can archive educational assistance applications.",
    };
  }

  const { data, error } = await supabase.rpc(
    "archive_education_assistance_applications",
    { p_name: name },
  );

  if (error) {
    console.error("Could not archive education assistance applications:", error.message);
    return {
      error:
        error.code === "P0001"
          ? "There are no active applications to archive."
          : error.code === "23505"
            ? "An archive with that name already exists. Enter a different program label."
            : `Could not archive applications (${error.code}). Run the latest educational assistance setup SQL and try again.`,
    };
  }

  const archive = data[0];
  if (!archive) {
    return {
      error: "The archive operation did not return a result. Refresh and try again.",
    };
  }

  await recordActivity(supabase, auth.user, {
    action: "Educational assistance applications archived",
    summary: `Archived ${archive.application_count} application(s) as "${archive.archive_name}".`,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/education-applicants");
  revalidatePath("/dashboard");

  return {
    success: `Archived ${archive.application_count} application(s) as "${archive.archive_name}". Applications are now closed; reopen them when the new program is ready.`,
  };
}
