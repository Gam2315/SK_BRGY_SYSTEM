import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import PortalDashboard from "@/components/portal-dashboard";
import { createApplicationDocumentLinks } from "@/lib/supabase/application-documents";
import { getSupabaseConfig, isAdminEmail } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="dashboard-loading">Loading your dashboard...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}

async function AdminDashboard() {
  await connection();

  if (!getSupabaseConfig()) {
    redirect("/login?error=setup");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Could not verify admin dashboard session:", error.message);
  }

  if (!data.user?.email) {
    redirect("/login");
  }

  if (!isAdminEmail(data.user.email)) {
    redirect("/dashboard");
  }

  const [
    { data: applications, error: applicationsError },
    { data: jobseekerApplications, error: jobseekerApplicationsError },
    { data: educationSettings, error: educationSettingsError },
    { data: announcements, error: announcementsError },
    { data: activityLogs, error: activityLogsError },
  ] = await Promise.all([
    supabase
      .from("educational_assistance_applications")
      .select(
        "id, user_id, applicant_name, applicant_email, contact_number, education_level, school_name, year_or_grade_level, school_assessment_path, school_id_front_path, school_id_back_path, status, review_notes, reviewed_at, reviewed_by, submitted_at",
      )
      .order("submitted_at", { ascending: false }),
    supabase
      .from("jobseeker_applications")
      .select(
        "id, user_id, applicant_name, applicant_email, contact_number, desired_position, skills_experience, valid_id_front_path, valid_id_back_path, status, review_notes, reviewed_at, reviewed_by, submitted_at",
      )
      .order("submitted_at", { ascending: false }),
    supabase
      .from("educational_assistance_settings")
      .select("is_open")
      .eq("id", true)
      .single(),
    supabase
      .from("announcements")
      .select(
        "id, title, body, published_at, created_by, email_status, email_sent_at, email_error, created_at, updated_at",
      )
      .order("published_at", { ascending: false }),
    supabase
      .from("activity_logs")
      .select("id, actor_user_id, actor_email, action, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const educationApplicationsWithDocuments = await Promise.all(
    (applications ?? []).map(async (application) => {
      const { links, errors } = await createApplicationDocumentLinks(
        supabase,
        [
          { label: "School assessment", path: application.school_assessment_path },
          { label: "School ID · front", path: application.school_id_front_path },
          { label: "School ID · back", path: application.school_id_back_path },
        ],
      );

      return {
        ...application,
        documents: links,
        documentErrors: errors,
      };
    }),
  );
  const jobseekerApplicationsWithDocuments = await Promise.all(
    (jobseekerApplications ?? []).map(async (application) => {
      const { links, errors } = await createApplicationDocumentLinks(
        supabase,
        [
          { label: "Valid ID · front", path: application.valid_id_front_path },
          { label: "Valid ID · back", path: application.valid_id_back_path },
        ],
      );

      return {
        ...application,
        documents: links,
        documentErrors: errors,
      };
    }),
  );

  return (
    <PortalDashboard
      email={data.user.email}
      role="admin"
      educationApplications={educationApplicationsWithDocuments}
      educationApplicationsError={applicationsError?.message}
      educationApplicationsOpen={educationSettings?.is_open}
      educationApplicationsSettingsError={educationSettingsError?.message}
      jobseekerApplications={jobseekerApplicationsWithDocuments}
      jobseekerApplicationsError={jobseekerApplicationsError?.message}
      announcements={announcements ?? []}
      announcementsError={announcementsError?.message}
      activityLogs={(activityLogs ?? []).map((activity) => ({
        ...activity,
        actor_role: isAdminEmail(activity.actor_email)
          ? "Administrator"
          : "Resident",
      }))}
      activityLogsError={activityLogsError?.message}
    />
  );
}
