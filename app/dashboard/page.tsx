import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import PortalDashboard from "@/components/portal-dashboard";
import { getSupabaseConfig, isAdminEmail } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default function ResidentDashboardPage() {
  return (
    <Suspense fallback={<div className="dashboard-loading">Loading your portal...</div>}>
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
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Could not verify resident dashboard session:", error.message);
  }

  if (!data.user?.email) {
    redirect("/login");
  }

  if (isAdminEmail(data.user.email)) {
    redirect("/admin");
  }

  const [
    { data: educationApplications, error: educationApplicationsError },
    { data: jobseekerApplications, error: jobseekerApplicationsError },
  ] = await Promise.all([
    supabase
      .from("educational_assistance_applications")
      .select(
        "id, user_id, applicant_name, applicant_email, contact_number, education_level, school_name, year_or_grade_level, school_assessment_path, school_id_front_path, school_id_back_path, status, review_notes, reviewed_at, reviewed_by, submitted_at",
      )
      .eq("user_id", data.user.id)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("jobseeker_applications")
      .select(
        "id, user_id, applicant_name, applicant_email, contact_number, desired_position, skills_experience, valid_id_front_path, valid_id_back_path, status, review_notes, reviewed_at, reviewed_by, submitted_at",
      )
      .eq("user_id", data.user.id)
      .order("submitted_at", { ascending: false }),
  ]);

  return (
    <PortalDashboard
      email={data.user.email}
      role="resident"
      residentEducationApplications={educationApplications ?? []}
      residentEducationApplicationsError={educationApplicationsError?.message}
      residentJobseekerApplications={jobseekerApplications ?? []}
      residentJobseekerApplicationsError={jobseekerApplicationsError?.message}
    />
  );
}
