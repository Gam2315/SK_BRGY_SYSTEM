"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/supabase/activity-logs";
import { isPortalAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ApplicationReviewState = {
  error?: string;
  success?: string;
};

type ApplicationType = "education" | "jobseeker";

export async function updateApplicationReview(
  applicationType: ApplicationType,
  applicationId: string,
  _previousState: ApplicationReviewState,
  formData: FormData,
): Promise<ApplicationReviewState> {
  const status = formData.get("status");
  const reviewNotesValue = formData.get("review_notes");
  const reviewNotes =
    typeof reviewNotesValue === "string" ? reviewNotesValue.trim() : "";

  if (status !== "Approved" && status !== "Rejected") {
    return { error: "Choose approve or reject to update this application." };
  }

  if (applicationType !== "education" && applicationType !== "jobseeker") {
    return { error: "This application type is not supported." };
  }

  if (reviewNotes.length > 1000) {
    return { error: "The review note must be 1,000 characters or fewer." };
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(applicationId)) {
    return { error: "This application ID is invalid. Refresh the dashboard and try again." };
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("Could not verify admin review session:", authError.message);
    return { error: "Could not verify your session. Sign in again and retry." };
  }

  if (!data.user?.id || !(await isPortalAdmin(supabase))) {
    return { error: "Only portal administrators can review applications." };
  }

  if (applicationType === "education") {
    const { data: currentApplication, error: currentApplicationError } =
      await supabase
        .from("educational_assistance_applications")
        .select("status, archive_batch_id")
        .eq("id", applicationId)
        .maybeSingle();

    if (currentApplicationError) {
      console.error(
        "Could not verify educational assistance application status:",
        currentApplicationError.message,
      );
      return {
        error: `Could not verify the application (${currentApplicationError.code}).`,
      };
    }

    if (currentApplication?.status === "Claimed") {
      return {
        error: "A claimed educational assistance application cannot be reviewed again.",
      };
    }

    if (currentApplication?.archive_batch_id) {
      return {
        error: "Archived educational assistance applications are read-only.",
      };
    }
  }

  const review = {
    status,
    review_notes: reviewNotes || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: data.user.id,
  };
  const result =
    applicationType === "education"
      ? await supabase
          .from("educational_assistance_applications")
          .update(review)
          .eq("id", applicationId)
          .select("id")
          .maybeSingle()
      : await supabase
          .from("jobseeker_applications")
          .update(review)
          .eq("id", applicationId)
          .select("id")
          .maybeSingle();

  if (result.error) {
    console.error("Could not update application review:", result.error.message);
    return {
      error: `Could not save the review (${result.error.code}). Confirm the latest application setup SQL has been run and that this admin is authorized.`,
    };
  }

  if (!result.data) {
    return {
      error: "Application not found or this account is not authorized to review it.",
    };
  }

  await recordActivity(supabase, data.user, {
    action: "Application reviewed",
    summary: `${applicationType === "education" ? "Educational assistance" : "Jobseeker"} application marked ${status.toLowerCase()}.`,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: `Application marked ${status.toLowerCase()}.` };
}
