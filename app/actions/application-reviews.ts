"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/supabase/config";
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

  if (!data.user?.id || !data.user.email || !isAdminEmail(data.user.email)) {
    return { error: "Only the configured portal administrator can review applications." };
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

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: `Application marked ${status.toLowerCase()}.` };
}
