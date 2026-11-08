import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import PortalDashboard from "@/components/portal-dashboard";
import DashboardLoading from "@/components/dashboard-loading";
import type { AdminDashboardSection } from "@/components/portal-dashboard";
import { createApplicationDocumentLinks } from "@/lib/supabase/application-documents";
import { isPortalAdmin } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export function AdminDashboardPage({
  page = "overview",
}: {
  page?: AdminDashboardSection;
}) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AdminDashboard page={page} />
    </Suspense>
  );
}

async function AdminDashboard({ page }: { page: AdminDashboardSection }) {
  await connection();

  if (!getSupabaseConfig()) {
    redirect("/login?error=setup");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error && error.name !== "AuthSessionMissingError") {
    console.error("Could not verify admin dashboard session:", error.message);
  }

  const userId = data?.claims.sub;
  const email = data?.claims.email;

  if (typeof userId !== "string" || typeof email !== "string") {
    redirect("/login");
  }

  if (!(await isPortalAdmin(supabase))) {
    redirect("/dashboard");
  }

  if (page === "claim-assistance") {
    return (
      <PortalDashboard
        email={email}
        role="admin"
        adminPage={page}
      />
    );
  }

  if (page === "officials") {
    const { data: officials, error: officialsError } = await supabase
      .from("barangay_officials")
      .select(
        "id, position, full_name, phone, email, photo_path, is_published, sort_order, updated_at",
      )
      .order("sort_order", { ascending: true });

    return (
      <PortalDashboard
        email={email}
        role="admin"
        adminPage={page}
        barangayOfficials={(officials ?? []).map((official) => ({
          ...official,
          photo_url: official.photo_path
            ? supabase.storage
                .from("barangay-official-photos")
                .getPublicUrl(official.photo_path).data.publicUrl
            : null,
        }))}
        barangayOfficialsError={officialsError?.message}
      />
    );
  }

  if (page === "concern-reports") {
    const { data: concernReports, error: concernReportsError } = await supabase
      .from("concern_reports")
      .select("id, reporter_name, concern, image_path, submitted_at")
      .order("submitted_at", { ascending: false });

    const signedConcernReports = await Promise.all(
      (concernReports ?? []).map(async (report) => {
        if (!report.image_path) {
          return { ...report, image_url: null };
        }

        const { data, error } = await supabase.storage
          .from("concern-report-images")
          .createSignedUrl(report.image_path, 60 * 60);
        if (error) {
          console.error(
            "Could not create concern report picture link:",
            error.message,
          );
          return { ...report, image_url: null };
        }

        return { ...report, image_url: data.signedUrl };
      }),
    );
    const pictureLinkError = signedConcernReports.some(
      (report) => report.image_path && !report.image_url,
    )
      ? "Some attached pictures could not be opened. Please refresh or check the private image bucket setup."
      : undefined;

    return (
      <PortalDashboard
        email={email}
        role="admin"
        adminPage={page}
        concernReports={signedConcernReports}
        concernReportsError={
          [concernReportsError?.message, pictureLinkError]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
    );
  }

  const [
    { data: applications, error: applicationsError },
    { data: jobseekerApplications, error: jobseekerApplicationsError },
    { data: educationSettings, error: educationSettingsError },
    { data: educationArchiveBatches, error: educationArchiveBatchesError },
    { data: announcements, error: announcementsError },
    { data: communityPosts, error: communityPostsError },
    { data: activityLogs, error: activityLogsError },
  ] = await Promise.all([
    supabase
      .from("educational_assistance_applications")
      .select(
        "id, user_id, applicant_name, applicant_email, contact_number, zone, education_level, school_name, year_or_grade_level, school_assessment_path, school_id_front_path, school_id_back_path, status, review_notes, reviewed_at, reviewed_by, archive_batch_id, claimed_at, submitted_at",
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
      .from("education_assistance_archive_batches")
      .select("id, name, archived_at, archived_by")
      .order("archived_at", { ascending: false }),
    supabase
      .from("announcements")
      .select(
        "id, title, body, published_at, created_by, email_status, email_sent_at, email_error, created_at, updated_at",
      )
      .order("published_at", { ascending: false }),
    supabase
      .from("community_posts")
      .select(
        "id, kind, title, body, activity_date, image_paths, created_by, published_at, created_at, updated_at",
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
      email={email}
      role="admin"
      adminPage={page}
      educationApplications={educationApplicationsWithDocuments}
      educationApplicationsError={applicationsError?.message}
      educationApplicationsOpen={educationSettings?.is_open}
      educationApplicationsSettingsError={educationSettingsError?.message}
      educationArchiveBatches={educationArchiveBatches ?? []}
      educationArchiveBatchesError={educationArchiveBatchesError?.message}
      jobseekerApplications={jobseekerApplicationsWithDocuments}
      jobseekerApplicationsError={jobseekerApplicationsError?.message}
      announcements={announcements ?? []}
      announcementsError={announcementsError?.message}
      communityPosts={(communityPosts ?? []).map((post) => ({
        ...post,
        image_urls: post.image_paths.map(
          (path) =>
            supabase.storage
              .from("community-post-images")
              .getPublicUrl(path).data.publicUrl,
        ),
      }))}
      communityPostsError={communityPostsError?.message}
      activityLogs={(activityLogs ?? []).map((activity) => ({
        ...activity,
      }))}
      activityLogsError={activityLogsError?.message}
    />
  );
}
