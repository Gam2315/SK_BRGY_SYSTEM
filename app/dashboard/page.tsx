import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import PortalDashboard from "@/components/portal-dashboard";
import DashboardLoading from "@/components/dashboard-loading";
import { isPortalAdmin } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default function ResidentDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <ResidentDashboard />
    </Suspense>
  );
}

async function ResidentDashboard() {
  await connection();

  if (!getSupabaseConfig()) {
    redirect("/login?error=setup");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error && error.name !== "AuthSessionMissingError") {
    console.error("Could not verify resident dashboard session:", error.message);
  }

  const userId = data?.claims.sub;
  const email = data?.claims.email;

  if (typeof userId !== "string" || typeof email !== "string") {
    redirect("/login");
  }

  if (await isPortalAdmin(supabase)) {
    redirect("/admin");
  }

  const [
    { data: educationApplications, error: educationApplicationsError },
    { data: educationSettings, error: educationSettingsError },
    { data: jobseekerApplications, error: jobseekerApplicationsError },
    { data: announcementSubscription, error: announcementSubscriptionError },
    { data: announcements, error: announcementsError },
  ] = await Promise.all([
    supabase
      .from("educational_assistance_applications")
      .select(
        "id, user_id, applicant_name, applicant_email, contact_number, zone, education_level, school_name, year_or_grade_level, school_assessment_path, school_id_front_path, school_id_back_path, status, review_notes, reviewed_at, reviewed_by, claim_token, claimed_at, claimed_by, submitted_at",
      )
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("educational_assistance_settings")
      .select("is_open")
      .eq("id", true)
      .single(),
    supabase
      .from("jobseeker_applications")
      .select(
        "id, user_id, applicant_name, applicant_email, contact_number, desired_position, skills_experience, valid_id_front_path, valid_id_back_path, status, review_notes, reviewed_at, reviewed_by, submitted_at",
      )
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("announcement_subscribers")
      .select("subscribed")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("announcements")
      .select(
        "id, title, body, published_at, created_by, email_status, email_sent_at, email_error, created_at, updated_at",
      )
      .not("published_at", "is", null)
      .order("published_at", { ascending: false }),
  ]);

  return (
    <PortalDashboard
      email={email}
      role="resident"
      residentEducationApplications={educationApplications ?? []}
      residentEducationApplicationsError={educationApplicationsError?.message}
      educationApplicationsOpen={educationSettings?.is_open ?? false}
      educationApplicationsSettingsError={educationSettingsError?.message}
      residentJobseekerApplications={jobseekerApplications ?? []}
      residentJobseekerApplicationsError={jobseekerApplicationsError?.message}
      announcementSubscribed={announcementSubscription?.subscribed ?? false}
      announcementSubscriptionError={announcementSubscriptionError?.message}
      announcements={announcements ?? []}
      announcementsError={announcementsError?.message}
    />
  );
}
