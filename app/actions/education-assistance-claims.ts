"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/supabase/activity-logs";
import { isPortalAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { BarangayZone } from "@/lib/supabase/database.types";

const claimTokenPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type EducationClaimApplicant = {
  id: string;
  applicant_name: string;
  applicant_email: string;
  contact_number: string | null;
  zone: BarangayZone | null;
  education_level: "high_school" | "college";
  school_name: string;
  year_or_grade_level: string;
};

export type EducationClaimLookupResult = {
  application?: EducationClaimApplicant;
  error?: string;
};

export type EducationClaimResult = {
  application?: EducationClaimApplicant & { claimed_at: string };
  error?: string;
  success?: string;
};

export async function lookupEducationClaim(
  token: string,
): Promise<EducationClaimLookupResult> {
  if (!claimTokenPattern.test(token)) {
    return { error: "This QR code does not contain a valid claim token." };
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("Could not verify education claim scanner session:", authError.message);
    return { error: "Could not verify your session. Sign in again and retry." };
  }

  if (!auth.user?.id || !(await isPortalAdmin(supabase))) {
    return { error: "Only portal administrators can verify claims." };
  }

  const { data: application, error } = await supabase
    .from("educational_assistance_applications")
    .select(
      "id, applicant_name, applicant_email, contact_number, zone, education_level, school_name, year_or_grade_level, status, claimed_at",
    )
    .eq("claim_token", token)
    .maybeSingle();

  if (error) {
    console.error("Could not look up education assistance claim:", error.message);
    return {
      error: `Could not look up this claim (${error.code}). Run the latest educational assistance setup SQL and confirm this administrator is listed in public.portal_admins.`,
    };
  }

  if (!application || application.status !== "Approved" || application.claimed_at) {
    return { error: "This claim token is invalid or has already been claimed." };
  }

  return {
    application: {
      id: application.id,
      applicant_name: application.applicant_name,
      applicant_email: application.applicant_email,
      contact_number: application.contact_number,
      zone: application.zone,
      education_level: application.education_level,
      school_name: application.school_name,
      year_or_grade_level: application.year_or_grade_level,
    },
  };
}

export async function confirmEducationClaim(
  token: string,
): Promise<EducationClaimResult> {
  if (!claimTokenPattern.test(token)) {
    return { error: "This QR code does not contain a valid claim token." };
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("Could not verify education claim confirmation session:", authError.message);
    return { error: "Could not verify your session. Sign in again and retry." };
  }

  if (!auth.user?.id || !(await isPortalAdmin(supabase))) {
    return { error: "Only portal administrators can confirm claims." };
  }

  const { data, error } = await supabase.rpc(
    "record_education_assistance_claim",
    { p_claim_token: token },
  );

  if (error) {
    console.error("Could not confirm education assistance claim:", error.message);
    return {
      error: `Could not confirm this claim (${error.code}). Run the latest educational assistance setup SQL and confirm this administrator is listed in public.portal_admins.`,
    };
  }

  const application = data[0];
  if (!application) {
    return {
      error: "This claim is no longer available. It may already have been claimed.",
    };
  }

  await recordActivity(supabase, auth.user, {
    action: "Educational assistance claimed",
    summary: "An approved educational assistance application was marked claimed.",
  });

  revalidatePath("/admin/claim-assistance");
  revalidatePath("/admin/education-applicants");
  revalidatePath("/dashboard");

  return {
    application,
    success: "The educational assistance claim has been confirmed.",
  };
}
