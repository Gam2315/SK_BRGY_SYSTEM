"use client";

import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/actions/auth";
import AdminAnnouncementManager from "@/components/admin-announcement-manager";
import AdminBarangayOfficialsManager from "@/components/admin-barangay-officials-manager";
import AdminCommunityPostsManager from "@/components/admin-community-posts-manager";
import AdminApplicationReviewControls from "@/components/admin-application-review-controls";
import AdminEducationClaimScanner from "@/components/admin-education-claim-scanner";
import AdminEducationArchiveManager from "@/components/admin-education-archive-manager";
import AdminEducationApplicationSettings from "@/components/admin-education-application-settings";
import ResidentApplicationForms from "@/components/resident-application-forms";
import ResidentAnnouncementSubscription from "@/components/resident-announcement-subscription";
import type {
  Announcement,
  ActivityLog,
  BarangayOfficial,
  CommunityPostWithImages,
  ApplicationDocumentLink,
  ConcernReport,
  EducationAssistanceArchiveBatch,
  EducationalAssistanceApplication,
  JobseekerApplication,
} from "@/lib/supabase/database.types";

type EducationApplicationWithDocuments = EducationalAssistanceApplication & {
  documents: ApplicationDocumentLink[];
  documentErrors: string[];
};
type JobseekerApplicationWithDocuments = JobseekerApplication & {
  documents: ApplicationDocumentLink[];
  documentErrors: string[];
};
type BarangayOfficialWithPhoto = BarangayOfficial & {
  photo_url: string | null;
};

export type AdminDashboardSection =
  | "overview"
  | "education-applicants"
  | "claim-assistance"
  | "jobseeker-applicants"
  | "activity-logs"
  | "officials"
  | "concern-reports";

type PortalDashboardProps = {
  email: string;
  adminPage?: AdminDashboardSection;
  educationApplications?: EducationApplicationWithDocuments[];
  educationApplicationsError?: string;
  educationApplicationsOpen?: boolean;
  educationApplicationsSettingsError?: string;
  educationArchiveBatches?: EducationAssistanceArchiveBatch[];
  educationArchiveBatchesError?: string;
  jobseekerApplications?: JobseekerApplicationWithDocuments[];
  jobseekerApplicationsError?: string;
  residentEducationApplications?: EducationalAssistanceApplication[];
  residentEducationApplicationsError?: string;
  residentJobseekerApplications?: JobseekerApplication[];
  residentJobseekerApplicationsError?: string;
  announcements?: Announcement[];
  announcementsError?: string;
  communityPosts?: CommunityPostWithImages[];
  communityPostsError?: string;
  barangayOfficials?: BarangayOfficialWithPhoto[];
  barangayOfficialsError?: string;
  activityLogs?: ActivityLog[];
  activityLogsError?: string;
  concernReports?: (ConcernReport & { image_url: string | null })[];
  concernReportsError?: string;
  announcementSubscribed?: boolean;
  announcementSubscriptionError?: string;
  role: "admin" | "resident";
};

const adminNavigationSections = [
  "services",
  "announcements",
  "community-posts",
  "officials",
  "account",
];
const residentNavigationSections = [
  "services",
  "announcements",
  "requests",
  "account",
];

export default function PortalDashboard({
  email,
  adminPage = "overview",
  educationApplications = [],
  educationApplicationsError,
  educationApplicationsOpen = false,
  educationApplicationsSettingsError,
  educationArchiveBatches = [],
  educationArchiveBatchesError,
  jobseekerApplications = [],
  jobseekerApplicationsError,
  residentEducationApplications = [],
  residentEducationApplicationsError,
  residentJobseekerApplications = [],
  residentJobseekerApplicationsError,
  announcements = [],
  announcementsError,
  communityPosts = [],
  communityPostsError,
  barangayOfficials = [],
  barangayOfficialsError,
  activityLogs = [],
  activityLogsError,
  concernReports = [],
  concernReportsError,
  announcementSubscribed = false,
  announcementSubscriptionError,
  role,
}: PortalDashboardProps) {
  const isAdmin = role === "admin";
  const initials = email.slice(0, 1).toUpperCase();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedDocument, setSelectedDocument] =
    useState<ApplicationDocumentLink | null>(null);
  const [selectedEducationArchiveId, setSelectedEducationArchiveId] = useState<
    string | null
  >(null);
  const documentPreviewRef = useRef<HTMLDialogElement>(null);
  const selectedSection =
    isAdmin && adminPage !== "overview" ? adminPage : activeSection;
  const navigationSections = isAdmin
    ? adminNavigationSections
    : residentNavigationSections;

  useEffect(() => {
    if (isAdmin && adminPage !== "overview") {
      return;
    }

    let frame = 0;

    function updateActiveSection() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const fixedHeader = document.querySelector(".dashboard-topbar");
        const marker =
          (fixedHeader?.getBoundingClientRect().bottom ?? 0) + 24;
        let currentSection = "overview";

        for (const id of navigationSections) {
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top <= marker) {
            currentSection = id;
          }
        }

        setActiveSection(currentSection);
      });
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, [adminPage, isAdmin, navigationSections]);

  useEffect(() => {
    const dialog = documentPreviewRef.current;
    if (selectedDocument && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [selectedDocument]);

  const adminPageTitle =
    adminPage === "education-applicants"
      ? "Education applicants"
      : adminPage === "claim-assistance"
        ? "Claim assistance"
        : adminPage === "jobseeker-applicants"
          ? "Jobseeker applicants"
          : adminPage === "activity-logs"
            ? "Activity logs"
            : adminPage === "officials"
              ? "Manage Barangay Officials"
              : adminPage === "concern-reports"
                ? "Concern reports"
            : "Admin dashboard";

  return (
    <main className="portal-dashboard">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/">
          <Image
            alt="Barangay Centro Norte seal"
            height={43}
            src="/centro-norte-logo.png"
            width={43}
          />
          <span>
            <strong>Barangay Portal</strong>
            <small>{isAdmin ? "Administration" : "Resident services"}</small>
          </span>
        </Link>

        <span className="dashboard-nav-label">MENU</span>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {isAdmin ? (
            <Link
              className={`dashboard-nav-link${selectedSection === "overview" ? " active" : ""}`}
              href="/admin"
            >
              <span aria-hidden="true">▦</span> Overview
            </Link>
          ) : (
            <a
              className={`dashboard-nav-link${selectedSection === "overview" ? " active" : ""}`}
              href="#overview"
              onClick={() => setActiveSection("overview")}
            >
              <span aria-hidden="true">▦</span> Overview
            </a>
          )}
          {isAdmin ? (
            <>
              <Link
                className={`dashboard-nav-link${selectedSection === "services" ? " active" : ""}`}
                href="/admin#services"
                onClick={() => setActiveSection("services")}
              >
                <span aria-hidden="true">◇</span> Services
              </Link>
              <Link
                className={`dashboard-nav-link${selectedSection === "announcements" ? " active" : ""}`}
                href="/admin#announcements"
                onClick={() => setActiveSection("announcements")}
              >
                <span aria-hidden="true">◉</span> Announcements
              </Link>
              <Link
                className={`dashboard-nav-link${selectedSection === "community-posts" ? " active" : ""}`}
                href="/admin#community-posts"
                onClick={() => setActiveSection("community-posts")}
              >
                <span aria-hidden="true">◇</span> Activities &amp; projects
              </Link>
              <Link
                className={`dashboard-nav-link${selectedSection === "officials" ? " active" : ""}`}
                href="/admin/officials"
              >
                <span aria-hidden="true">♙</span> Manage Barangay Officials
              </Link>
              <Link
                className={`dashboard-nav-link${selectedSection === "concern-reports" ? " active" : ""}`}
                href="/admin/concern-reports"
              >
                <span aria-hidden="true">!</span> Concern reports
              </Link>
              <Link
                className={`dashboard-nav-link${selectedSection === "education-applicants" ? " active" : ""}`}
                href="/admin/education-applicants"
              >
                <span aria-hidden="true">▤</span> Education applicants
              </Link>
              <Link
                className={`dashboard-nav-link${selectedSection === "claim-assistance" ? " active" : ""}`}
                href="/admin/claim-assistance"
              >
                <span aria-hidden="true">▣</span> Claim assistance
              </Link>
              <Link
                className={`dashboard-nav-link${selectedSection === "jobseeker-applicants" ? " active" : ""}`}
                href="/admin/jobseeker-applicants"
              >
                <span aria-hidden="true">♙</span> Jobseeker applicants
              </Link>
              <Link
                className={`dashboard-nav-link${selectedSection === "activity-logs" ? " active" : ""}`}
                href="/admin/activity-logs"
              >
                <span aria-hidden="true">◷</span> Activity logs
              </Link>
              <Link
                className={`dashboard-nav-link${selectedSection === "account" ? " active" : ""}`}
                href={isAdmin ? "/admin#account" : "#account"}
                onClick={() => setActiveSection("account")}
              >
                <span aria-hidden="true">◎</span> Account
              </Link>
            </>
          ) : (
            <>
              <a
                className={`dashboard-nav-link${activeSection === "services" ? " active" : ""}`}
                href="#services"
                onClick={() => setActiveSection("services")}
              >
                <span aria-hidden="true">◇</span> Browse services
              </a>
              <a
                className={`dashboard-nav-link${activeSection === "announcements" ? " active" : ""}`}
                href="#announcements"
                onClick={() => setActiveSection("announcements")}
              >
                <span aria-hidden="true">◉</span> Announcements
              </a>
              <a
                className={`dashboard-nav-link${activeSection === "requests" ? " active" : ""}`}
                href="#requests"
                onClick={() => setActiveSection("requests")}
              >
                <span aria-hidden="true">▤</span> Applications
              </a>
              <a
                className={`dashboard-nav-link${activeSection === "account" ? " active" : ""}`}
                href="#account"
                onClick={() => setActiveSection("account")}
              >
                <span aria-hidden="true">◎</span> Account
              </a>
            </>
          )}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="sidebar-help">
            <span className="sidebar-help-icon" aria-hidden="true">
              ?
            </span>
            <strong>Need a hand?</strong>
            <span>Our barangay team is here to help.</span>
            <Link href="/#contact">Contact us →</Link>
          </div>
          <Link className="dashboard-home-link" href="/">
            ← Back to public portal
          </Link>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            <span>Barangay Portal</span>
            <span aria-hidden="true">/</span>
            <strong>{isAdmin ? adminPageTitle : "My dashboard"}</strong>
          </div>
          <div className="dashboard-user">
            <span className="dashboard-avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="dashboard-user-copy">
              <strong>{isAdmin ? "Administrator" : "Resident"}</strong>
              <small>{email}</small>
            </span>
            <form action={signOut}>
              <button className="dashboard-signout" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="dashboard-content" id="overview">
          <div className="dashboard-welcome">
            <div>
              <span className="section-kicker">
                {isAdmin ? "BARANGAY CENTRO NORTE" : "RESIDENT PORTAL"}
              </span>
              <h1>{isAdmin ? adminPageTitle : "Welcome to your portal"}</h1>
              <p>
                {isAdmin
                  ? adminPage === "overview"
                    ? "Your administration workspace for the community portal."
                    : `Review and manage ${adminPageTitle.toLowerCase()}.`
                  : "Find services and stay connected with your barangay."}
              </p>
            </div>
            <span className="dashboard-date">
              {new Intl.DateTimeFormat("en-PH", {
                weekday: "long",
                month: "long",
                day: "numeric",
              }).format(new Date())}
            </span>
          </div>

          {isAdmin ? (
            adminPage === "claim-assistance" ? (
              <AdminEducationClaimScanner />
            ) : (
              <AdminOverview
                applications={educationApplications}
                applicationsError={educationApplicationsError}
                educationApplicationsOpen={educationApplicationsOpen}
                educationApplicationsSettingsError={
                  educationApplicationsSettingsError
                }
                educationArchiveBatches={educationArchiveBatches}
                educationArchiveBatchesError={educationArchiveBatchesError}
                selectedEducationArchiveId={selectedEducationArchiveId}
                onSelectEducationArchive={setSelectedEducationArchiveId}
                jobseekerApplications={jobseekerApplications}
                jobseekerApplicationsError={jobseekerApplicationsError}
                announcements={announcements}
                announcementsError={announcementsError}
                communityPosts={communityPosts}
                communityPostsError={communityPostsError}
                barangayOfficials={barangayOfficials}
                barangayOfficialsError={barangayOfficialsError}
                activityLogs={activityLogs}
                activityLogsError={activityLogsError}
                concernReports={concernReports}
                concernReportsError={concernReportsError}
                page={adminPage}
                onPreviewDocument={setSelectedDocument}
              />
            )
          ) : (
            <ResidentOverview
              email={email}
              educationApplications={residentEducationApplications}
              educationApplicationsError={residentEducationApplicationsError}
              educationApplicationsOpen={educationApplicationsOpen === true}
              educationApplicationsSettingsError={
                educationApplicationsSettingsError
              }
              jobseekerApplications={residentJobseekerApplications}
              jobseekerApplicationsError={residentJobseekerApplicationsError}
              announcementSubscribed={announcementSubscribed}
              announcementSubscriptionError={announcementSubscriptionError}
              announcements={announcements}
              announcementsError={announcementsError}
            />
          )}

          <section className="dashboard-account-panel" id="account">
            <div className="dashboard-panel-heading">
              <div>
                <span className="section-kicker">YOUR ACCOUNT</span>
                <h2>Account details</h2>
              </div>
              <span className="account-status">
                <i /> Active account
              </span>
            </div>
            <div className="account-details">
              <div>
                <span>Signed in as</span>
                <strong>{email}</strong>
              </div>
              <div>
                <span>Account type</span>
                <strong>{isAdmin ? "Portal administrator" : "Resident"}</strong>
              </div>
            </div>
          </section>

          <footer className="dashboard-footer">
            © Barangay Portal <span>·</span> Serbisyong malapit sa iyo
          </footer>
        </div>
      </section>
      {selectedDocument && (
        <dialog
          aria-labelledby="document-preview-title"
          className="application-document-preview"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              documentPreviewRef.current?.close();
            }
          }}
          onClose={() => setSelectedDocument(null)}
          ref={documentPreviewRef}
        >
          <div className="application-document-preview-header">
            <h2 id="document-preview-title">{selectedDocument.label}</h2>
            <button
              aria-label="Close document preview"
              className="application-document-preview-close"
              onClick={() => documentPreviewRef.current?.close()}
              type="button"
            >
              Close
            </button>
          </div>
          {selectedDocument.isImage ? (
            <div className="application-document-preview-image">
              <Image
                alt={selectedDocument.label}
                fill
                priority
                sizes="calc(100vw - 24px)"
                src={selectedDocument.url}
                unoptimized
              />
            </div>
          ) : (
            <iframe
              className="application-document-preview-frame"
              src={selectedDocument.url}
              title={`Preview of ${selectedDocument.label}`}
            />
          )}
        </dialog>
      )}
    </main>
  );
}

function AdminOverview({
  page,
  applications,
  applicationsError,
  educationApplicationsOpen,
  educationApplicationsSettingsError,
  educationArchiveBatches,
  educationArchiveBatchesError,
  selectedEducationArchiveId,
  onSelectEducationArchive,
  jobseekerApplications,
  jobseekerApplicationsError,
  announcements,
  announcementsError,
  communityPosts,
  communityPostsError,
  barangayOfficials,
  barangayOfficialsError,
  activityLogs,
  activityLogsError,
  concernReports,
  concernReportsError,
  onPreviewDocument,
}: {
  page: AdminDashboardSection;
  applications: EducationApplicationWithDocuments[];
  applicationsError?: string;
  educationApplicationsOpen: boolean;
  educationApplicationsSettingsError?: string;
  educationArchiveBatches: EducationAssistanceArchiveBatch[];
  educationArchiveBatchesError?: string;
  selectedEducationArchiveId: string | null;
  onSelectEducationArchive: (archiveId: string | null) => void;
  jobseekerApplications: JobseekerApplicationWithDocuments[];
  jobseekerApplicationsError?: string;
  announcements: Announcement[];
  announcementsError?: string;
  communityPosts: CommunityPostWithImages[];
  communityPostsError?: string;
  barangayOfficials: BarangayOfficialWithPhoto[];
  barangayOfficialsError?: string;
  activityLogs: ActivityLog[];
  activityLogsError?: string;
  concernReports: (ConcernReport & { image_url: string | null })[];
  concernReportsError?: string;
  onPreviewDocument: (document: ApplicationDocumentLink) => void;
}) {
  const [selectedZone, setSelectedZone] = useState("all");
  const archivedEducationApplications = applications.filter((application) =>
    selectedEducationArchiveId
      ? application.archive_batch_id === selectedEducationArchiveId
      : application.archive_batch_id === null,
  );
  const listedEducationApplications = archivedEducationApplications.filter(
    (application) => selectedZone === "all" || application.zone === selectedZone,
  );
  const highSchoolApplications = listedEducationApplications.filter(
    (application) => application.education_level === "high_school",
  );
  const collegeApplications = listedEducationApplications.filter(
    (application) => application.education_level === "college",
  );
  const graduateApplications = listedEducationApplications.filter(
    (application) => application.education_level === null,
  );
  const selectedEducationArchive = educationArchiveBatches.find(
    (archive) => archive.id === selectedEducationArchiveId,
  );

  return (
    <>
      {page === "overview" && (
        <>
      <section className="admin-welcome-card">
        <div className="admin-welcome-copy">
          <span className="admin-online">
            <i /> SECURE ADMIN SESSION
          </span>
          <h2>Good day, Administrator.</h2>
          <p>
            Manage the public portal and keep the community informed. Data
            management tools can be connected here as the barangay workflow is
            finalized.
          </p>
          <div className="admin-welcome-actions">
            <Link className="admin-public-link" href="/">
              View public portal <span aria-hidden="true">→</span>
            </Link>
            <a className="admin-compose-link" href="#announcement-composer">
              Compose announcement <span aria-hidden="true">＋</span>
            </a>
          </div>
        </div>
        <div className="admin-welcome-seal" aria-hidden="true">
          <Image
            alt=""
            height={112}
            src="/centro-norte-logo.png"
            width={112}
          />
        </div>
      </section>

      <div className="dashboard-section-title">
        <div>
          <span className="section-kicker">PORTAL MANAGEMENT</span>
          <h2>Administration</h2>
        </div>
        <span className="dashboard-section-note">Workspace overview</span>
      </div>

      <div className="admin-tools-grid">
        <article className="admin-tool-card" id="services">
          <span className="admin-tool-icon green" aria-hidden="true">
            ◇
          </span>
          <span className="admin-tool-label">PUBLIC PORTAL</span>
          <h3>Service directory</h3>
          <p>
            Review the services currently shown to residents on the public
            portal.
          </p>
          <Link href="/#services">
            View service listings <span aria-hidden="true">→</span>
          </Link>
        </article>
        <article className="admin-tool-card">
          <span className="admin-tool-icon gold" aria-hidden="true">
            ◉
          </span>
          <span className="admin-tool-label">COMMUNITY UPDATES</span>
          <h3>Announcements</h3>
          <p>
            Publish updates to the public landing page and notify residents who
            opted in to announcement emails.
          </p>
          <a href="#announcements">
            Manage announcements <span aria-hidden="true">→</span>
          </a>
        </article>
        <article className="admin-tool-card">
          <span className="admin-tool-icon green" aria-hidden="true">
            ◇
          </span>
          <span className="admin-tool-label">COMMUNITY HIGHLIGHTS</span>
          <h3>Activities &amp; projects</h3>
          <p>
            Publish activities and completed barangay projects on the public
            landing page.
          </p>
          <a href="#community-posts">
            Manage posts <span aria-hidden="true">→</span>
          </a>
        </article>
        <article className="admin-tool-card">
          <span className="admin-tool-icon gold" aria-hidden="true">
            ♙
          </span>
          <span className="admin-tool-label">PUBLIC PORTAL</span>
          <h3>Manage Barangay Officials</h3>
          <p>
            Update official names and contacts, and choose which details are
            displayed publicly.
          </p>
          <Link href="/admin/officials">
            Manage officials <span aria-hidden="true">→</span>
          </Link>
        </article>
      </div>
      <p className="dashboard-data-note">
        <span aria-hidden="true">i</span>
        Application records are private to authorized portal administrators.
      </p>

      <AdminAnnouncementManager
        announcements={announcements}
        error={announcementsError}
      />
      <AdminCommunityPostsManager
        posts={communityPosts}
        error={communityPostsError}
      />
        </>
      )}

      {page === "officials" && (
        <AdminBarangayOfficialsManager
          officials={barangayOfficials}
          error={barangayOfficialsError}
        />
      )}

      {page === "concern-reports" && (
        <section
          aria-labelledby="concern-reports-title"
          className="admin-activity-logs"
          id="concern-reports"
        >
          <div className="dashboard-section-title">
            <div>
              <span className="section-kicker">COMMUNITY FEEDBACK</span>
              <h2 id="concern-reports-title">Concern reports</h2>
            </div>
            <span className="dashboard-section-note">
              {concernReports.length}{" "}
              {concernReports.length === 1 ? "report" : "reports"}
            </span>
          </div>
          {concernReportsError ? (
            <div className="admin-activity-error" role="alert">
              <strong>Concern reports could not be loaded</strong>
              <p>{concernReportsError}</p>
              <span>
                Run <code>supabase/concern-reports.sql</code> in the Supabase
                SQL Editor and confirm this administrator is listed in{" "}
                <code>public.portal_admins</code>.
              </span>
            </div>
          ) : concernReports.length === 0 ? (
            <p className="admin-activity-empty">
              No concerns have been submitted yet.
            </p>
          ) : (
            <div className="admin-activity-table-scroll">
              <table className="admin-activity-table">
                <thead>
                  <tr>
                    <th scope="col">Reported by</th>
                    <th scope="col">Concern</th>
                    <th scope="col">Date submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {concernReports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <strong>{report.reporter_name || "Anonymous"}</strong>
                      </td>
                      <td className="concern-report-table-message">
                        {report.concern}
                        {report.image_url && (
                          <a
                            className="concern-report-image-link"
                            href={report.image_url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View attached picture
                          </a>
                        )}
                      </td>
                      <td>
                        <time dateTime={report.submitted_at}>
                          {new Intl.DateTimeFormat("en-PH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Asia/Manila",
                          }).format(new Date(report.submitted_at))}
                        </time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {page === "education-applicants" && (
      <section
        className="admin-applications-section"
        id="educational-assistance"
      >
        <AdminEducationArchiveManager
          activeApplicationCount={applications.filter(
            (application) => application.archive_batch_id === null,
          ).length}
          archiveBatches={educationArchiveBatches}
          archiveBatchesError={educationArchiveBatchesError}
          onSelectArchive={onSelectEducationArchive}
          selectedArchiveId={selectedEducationArchiveId}
        />
        {!selectedEducationArchiveId && (
          <AdminEducationApplicationSettings
            isOpen={educationApplicationsOpen}
            error={educationApplicationsSettingsError}
          />
        )}
        <div className="dashboard-section-title">
          <div>
            <span className="section-kicker">EDUCATIONAL ASSISTANCE</span>
            <h2>Applicant lists</h2>
          </div>
          <div className="admin-applications-title-actions">
            <label className="admin-application-zone-filter">
              Filter by zone
              <select
                onChange={(event) => setSelectedZone(event.target.value)}
                value={selectedZone}
              >
                <option value="all">All zones</option>
                {Array.from({ length: 7 }, (_, index) => `Zone ${index + 1}`).map(
                  (zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ),
                )}
              </select>
            </label>
            <span className="dashboard-section-note">
              {listedEducationApplications.length}{" "}
              {listedEducationApplications.length === 1
                ? "application"
                : "applications"}
            </span>
          </div>
        </div>

        {applicationsError ? (
          <p className="admin-applications-error" role="alert">
            Could not load applications: {applicationsError}. Check that the
            educational assistance database setup has been run in Supabase.
          </p>
        ) : (
          <div className="admin-applications-grid">
            <ApplicationList
              applications={highSchoolApplications}
              archiveName={selectedEducationArchive?.name ?? "Current program"}
              educationLevel="High school"
              isArchived={Boolean(selectedEducationArchiveId)}
              onPreviewDocument={onPreviewDocument}
            />
            <ApplicationList
              applications={collegeApplications}
              archiveName={selectedEducationArchive?.name ?? "Current program"}
              educationLevel="College"
              isArchived={Boolean(selectedEducationArchiveId)}
              onPreviewDocument={onPreviewDocument}
            />
            <ApplicationList
              applications={graduateApplications}
              archiveName={selectedEducationArchive?.name ?? "Current program"}
              educationLevel="Graduate"
              isArchived={Boolean(selectedEducationArchiveId)}
              onPreviewDocument={onPreviewDocument}
            />
          </div>
        )}
      </section>
      )}

      {page === "jobseeker-applicants" && (
      <section
        className="admin-applications-section"
        id="jobseeker-applicants"
      >
        <div className="dashboard-section-title">
          <div>
            <span className="section-kicker">EMPLOYMENT ASSISTANCE</span>
            <h2>Jobseeker applicants</h2>
          </div>
          <div className="admin-applications-title-actions">
            <span className="dashboard-section-note">
              {jobseekerApplications.length}{" "}
              {jobseekerApplications.length === 1 ? "applicant" : "applicants"}
            </span>
            <button
              className="admin-applications-export"
              disabled={
                Boolean(jobseekerApplicationsError) ||
                jobseekerApplications.length === 0
              }
              onClick={() =>
                void downloadExcel(
                  "jobseeker-applicants.xlsx",
                  [
                    "Applicant",
                    "Email",
                    "Contact",
                    "Preferred position",
                    "Skills / experience",
                    "Status",
                    "Review notes",
                    "Submitted at (Manila)",
                    "Reviewed at (Manila)",
                  ],
                  jobseekerApplications.map((application) => [
                    application.applicant_name,
                    application.applicant_email,
                    application.contact_number,
                    application.desired_position,
                    application.skills_experience,
                    application.status,
                    application.review_notes,
                    application.submitted_at,
                    application.reviewed_at,
                  ]),
                  [7, 8],
                )
              }
              type="button"
            >
              Export Excel
            </button>
          </div>
        </div>

        {jobseekerApplicationsError ? (
          <p className="admin-applications-error" role="alert">
            Could not load jobseeker applicants: {jobseekerApplicationsError}.
            Check that the jobseeker applications table and admin read policy
            have been set up in Supabase.
          </p>
        ) : jobseekerApplications.length === 0 ? (
          <div className="admin-application-group">
            <p className="admin-applications-empty">
              No jobseeker applications yet.
            </p>
          </div>
        ) : (
          <ul className="admin-jobseeker-list">
            {jobseekerApplications.map((application) => (
              <li className="admin-application-item" key={application.id}>
                <div className="admin-application-primary">
                  <strong>{application.applicant_name}</strong>
                  <span>{application.applicant_email}</span>
                </div>
                <dl className="admin-application-details">
                  <div>
                    <dt>Preferred position</dt>
                    <dd>{application.desired_position}</dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>{application.contact_number || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>Skills / experience</dt>
                    <dd>{application.skills_experience || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>Applied</dt>
                    <dd>
                      {new Intl.DateTimeFormat("en-PH", {
                        dateStyle: "medium",
                        timeZone: "Asia/Manila",
                      }).format(new Date(application.submitted_at))}
                    </dd>
                  </div>
                </dl>
                {(application.documents.length > 0 ||
                  application.documentErrors.length > 0) && (
                  <div className="admin-application-documents">
                    <strong>Attached documents</strong>
                    <div>
                      {application.documents.map((document) => (
                        <a
                          href={document.url}
                          key={document.label}
                          onClick={(event) => {
                            event.preventDefault();
                            onPreviewDocument(document);
                          }}
                        >
                          {document.label}
                        </a>
                      ))}
                    </div>
                    {application.documentErrors.map((documentError) => (
                      <p
                        className="admin-application-document-error"
                        key={documentError}
                        role="alert"
                      >
                        Could not open document link: {documentError}. If the
                        file exists in Storage, confirm this admin is listed in{" "}
                        <code>public.portal_admins</code> and can read objects
                        in the application-documents bucket.
                      </p>
                    ))}
                  </div>
                )}
                <span className="admin-application-status">
                  {application.status}
                </span>
                <AdminApplicationReviewControls
                  applicationId={application.id}
                  applicationType="jobseeker"
                  status={application.status}
                  reviewNotes={application.review_notes}
                  missingRequirements={[
                    !application.applicant_name.trim() && "Applicant name",
                    !application.desired_position.trim() && "Preferred position",
                    !application.valid_id_front_path && "Valid ID front",
                    !application.valid_id_back_path && "Valid ID back",
                  ].filter((requirement): requirement is string =>
                    Boolean(requirement),
                  )}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      )}

      {page === "activity-logs" && (
      <section
        className="admin-activity-logs"
        id="activity-logs"
        aria-labelledby="activity-logs-title"
      >
        <div className="dashboard-section-title">
          <div>
            <span className="section-kicker">AUDIT TRAIL</span>
            <h2 id="activity-logs-title">Recent activity</h2>
          </div>
          <span className="dashboard-section-note">
            Latest {activityLogs.length} events
          </span>
        </div>
        {activityLogsError ? (
          <div className="admin-activity-error" role="alert">
            <strong>Activity logs could not be loaded</strong>
            <p>{activityLogsError}</p>
            <span>
              Run the activity log setup script in Supabase and confirm this
              administrator is listed in <code>public.portal_admins</code>.
            </span>
          </div>
        ) : activityLogs.length === 0 ? (
          <p className="admin-activity-empty">
            No activity has been recorded yet.
          </p>
        ) : (
          <div className="admin-activity-table-scroll">
            <table className="admin-activity-table">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Activity</th>
                  <th scope="col">Details</th>
                  <th scope="col">Date and time</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <span>{activity.actor_email}</span>
                    </td>
                    <td>{activity.action}</td>
                    <td>{activity.summary}</td>
                    <td>
                      <time dateTime={activity.created_at}>
                        {new Intl.DateTimeFormat("en-PH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Asia/Manila",
                        }).format(new Date(activity.created_at))}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}
    </>
  );
}

function ApplicationList({
  applications,
  archiveName,
  educationLevel,
  isArchived,
  onPreviewDocument,
}: {
  applications: EducationApplicationWithDocuments[];
  archiveName: string;
  educationLevel: string;
  isArchived: boolean;
  onPreviewDocument: (document: ApplicationDocumentLink) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(applications.length / pageSize));
  const displayedPage = Math.min(currentPage, pageCount);
  const firstApplicationIndex = (displayedPage - 1) * pageSize;
  const visibleApplications = applications.slice(
    firstApplicationIndex,
    firstApplicationIndex + pageSize,
  );

  return (
    <section className="admin-application-group">
      <div className="admin-application-group-heading">
        <h3>{educationLevel}</h3>
        <div className="admin-application-group-actions">
          <span>{applications.length}</span>
          <button
            className="admin-applications-export"
            disabled={applications.length === 0}
            onClick={() =>
              void downloadExcel(
                `educational-assistance-${archiveName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${educationLevel.toLowerCase().replaceAll(" ", "-")}-applicants.xlsx`,
                [
                  "Program cycle",
                  "Applicant",
                  "Email",
                  "Contact",
                  "Zone",
                  "Religion",
                  "Civil status",
                  "Youth age group",
                  "Youth classification",
                  "Work status",
                  "Educational attainment",
                  "Registered voter",
                  "Education level",
                  "School",
                  "Year / grade level",
                  "Status",
                  "Review notes",
                  "Submitted at (Manila)",
                  "Reviewed at (Manila)",
                  "Claimed at (Manila)",
                ],
                applications.map((application) => [
                  archiveName,
                  application.applicant_name,
                  application.applicant_email,
                  application.contact_number,
                  application.zone,
                  application.religion === "Other" && application.religion_other
                    ? `Other: ${application.religion_other}`
                    : application.religion,
                  application.civil_status,
                  application.youth_age_group,
                  application.youth_classification,
                  application.work_status,
                  application.educational_attainment,
                  application.registered_voter,
                  application.education_level === null
                    ? "Not applicable"
                    : educationLevel,
                  application.school_name,
                  application.year_or_grade_level ?? "Not applicable",
                  application.status,
                  application.review_notes,
                  application.submitted_at,
                  application.reviewed_at,
                  application.claimed_at,
                ]),
                [17, 18, 19],
              )
            }
            type="button"
          >
            Export Excel
          </button>
        </div>
      </div>
      {applications.length === 0 ? (
        <p className="admin-applications-empty">
          No {educationLevel.toLowerCase()} applications yet.
        </p>
      ) : (
        <>
          <ul className="admin-application-list">
            {visibleApplications.map((application) => (
              <li className="admin-application-item" key={application.id}>
              <div className="admin-application-primary">
                <strong>{application.applicant_name}</strong>
                <span>{application.applicant_email}</span>
              </div>
              <dl className="admin-application-details">
                <div>
                  <dt>Religion</dt>
                  <dd>
                    {application.religion === "Other" &&
                    application.religion_other
                      ? `Other: ${application.religion_other}`
                      : application.religion || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt>Civil status</dt>
                  <dd>{application.civil_status || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Youth age group</dt>
                  <dd>{application.youth_age_group || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Youth classification</dt>
                  <dd>{application.youth_classification || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Work status</dt>
                  <dd>{application.work_status || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Educational attainment</dt>
                  <dd>{application.educational_attainment || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Registered voter</dt>
                  <dd>{application.registered_voter || "Not provided"}</dd>
                </div>
                <div>
                  <dt>School</dt>
                  <dd>{application.school_name}</dd>
                </div>
                <div>
                  <dt>Year / grade</dt>
                  <dd>{application.year_or_grade_level || "Not applicable"}</dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>{application.contact_number || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Zone</dt>
                  <dd>{application.zone || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Applied</dt>
                  <dd>
                    {new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "medium",
                      timeZone: "Asia/Manila",
                    }).format(new Date(application.submitted_at))}
                  </dd>
                </div>
              </dl>
              {(application.documents.length > 0 ||
                application.documentErrors.length > 0) && (
                <div className="admin-application-documents">
                  <strong>Attached documents</strong>
                  <div>
                    {application.documents.map((document) => (
                      <a
                        href={document.url}
                        key={document.label}
                        onClick={(event) => {
                          event.preventDefault();
                          onPreviewDocument(document);
                        }}
                      >
                        {document.label}
                      </a>
                    ))}
                  </div>
                  {application.documentErrors.map((documentError) => (
                    <p
                      className="admin-application-document-error"
                      key={documentError}
                      role="alert"
                    >
                      Could not open document link: {documentError}. If the
                      file exists in Storage, confirm this admin is listed in{" "}
                      <code>public.portal_admins</code> and can read objects
                      in the application-documents bucket.
                    </p>
                  ))}
                </div>
              )}
              <span className="admin-application-status">
                {application.status}
              </span>
              {application.status === "Claimed" ? (
                <p className="admin-application-claimed">
                  Assistance claimed
                  {application.claimed_at &&
                    ` on ${new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "medium",
                      timeZone: "Asia/Manila",
                    }).format(new Date(application.claimed_at))}`}
                </p>
              ) : isArchived ? (
                <p className="admin-application-claimed">
                  Archived application · review is disabled
                </p>
              ) : (
                <AdminApplicationReviewControls
                  applicationId={application.id}
                  applicationType="education"
                  status={application.status}
                  reviewNotes={application.review_notes}
                  missingRequirements={[
                    !application.applicant_name.trim() && "Applicant name",
                    !application.school_name.trim() && "School name",
                    application.education_level !== null &&
                      !application.year_or_grade_level?.trim() &&
                      "Year / grade",
                    !application.school_assessment_path && "School assessment",
                    !application.school_id_front_path && "School ID front",
                    !application.school_id_back_path && "School ID back",
                  ].filter((requirement): requirement is string =>
                    Boolean(requirement),
                  )}
                />
              )}
              </li>
            ))}
          </ul>
          {pageCount > 1 && (
            <nav
              aria-label={`${educationLevel} applicant pages`}
              className="admin-application-pagination"
            >
              <span aria-live="polite">
                Showing {firstApplicationIndex + 1}–
                {Math.min(firstApplicationIndex + pageSize, applications.length)}{" "}
                of {applications.length}
              </span>
              <div>
                <button
                  disabled={displayedPage === 1}
                  onClick={() => setCurrentPage(displayedPage - 1)}
                  type="button"
                >
                  Previous
                </button>
                <span>
                  Page {displayedPage} of {pageCount}
                </span>
                <button
                  disabled={displayedPage === pageCount}
                  onClick={() => setCurrentPage(displayedPage + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

async function downloadExcel(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  dateColumns: number[],
) {
  try {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Centro Norte Barangay System";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Applicants", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    const dateColumnIndexes = new Set(dateColumns);
    worksheet.columns = headers.map((header, index) => ({
      header,
      key: `column${index}`,
      width: Math.min(
        42,
        Math.max(
          14,
          header.length + 2,
          ...rows.map((row) => String(row[index] ?? "").length + 2),
        ),
      ),
    }));
    worksheet.addRows(
      rows.map((row) =>
        row.map((value, index) =>
          dateColumnIndexes.has(index) && typeof value === "string"
            ? toManilaExcelDate(value)
            : (value ?? ""),
        ),
      ),
    );
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };
    worksheet.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
    };

    worksheet.getRow(1).height = 24;
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF384D66" },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
        const columnIndex = columnNumber - 1;
        cell.alignment = {
          vertical: "top",
          wrapText:
            headers[columnIndex] === "Review notes" ||
            headers[columnIndex] === "Skills / experience",
        };
        cell.border = {
          bottom: { style: "hair", color: { argb: "FFDCE3EA" } },
        };
        if (rowNumber % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF4F7FA" },
          };
        }
        if (dateColumnIndexes.has(columnIndex) && cell.value instanceof Date) {
          cell.numFmt = "yyyy-mm-dd hh:mm";
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Could not export applicant spreadsheet:", error);
    window.alert("The applicant spreadsheet could not be created. Please try again.");
  }
}

function toManilaExcelDate(value: string): Date | string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
}

function ResidentOverview({
  email,
  educationApplications,
  educationApplicationsError,
  educationApplicationsOpen,
  educationApplicationsSettingsError,
  jobseekerApplications,
  jobseekerApplicationsError,
  announcementSubscribed,
  announcementSubscriptionError,
  announcements,
  announcementsError,
}: {
  email: string;
  educationApplications: EducationalAssistanceApplication[];
  educationApplicationsError?: string;
  educationApplicationsOpen: boolean;
  educationApplicationsSettingsError?: string;
  jobseekerApplications: JobseekerApplication[];
  jobseekerApplicationsError?: string;
  announcementSubscribed: boolean;
  announcementSubscriptionError?: string;
  announcements: Announcement[];
  announcementsError?: string;
}) {
  const applicationUpdates = [
    ...educationApplications.map((application) => ({
      id: application.id,
      category:
        application.education_level === "high_school"
          ? "High school educational assistance"
          : application.education_level === "college"
            ? "College educational assistance"
            : "Graduate educational assistance",
      status: application.status,
      reviewNotes: application.review_notes,
      submittedAt: application.submitted_at,
      claimToken: application.claim_token,
      claimedAt: application.claimed_at ?? null,
    })),
    ...jobseekerApplications.map((application) => ({
      id: application.id,
      category: "Jobseeker assistance",
      status: application.status,
      reviewNotes: application.review_notes,
      submittedAt: application.submitted_at,
      claimToken: null,
      claimedAt: null,
    })),
  ].sort(
    (first, second) =>
      new Date(second.submittedAt).getTime() -
      new Date(first.submittedAt).getTime(),
  );
  const applicationLoadErrors = [
    educationApplicationsError && `Educational assistance: ${educationApplicationsError}`,
    jobseekerApplicationsError && `Jobseeker assistance: ${jobseekerApplicationsError}`,
  ].filter((error): error is string => Boolean(error));

  return (
    <>
      <section className="resident-welcome-card">
        <div>
          <span className="resident-welcome-badge">
            <span aria-hidden="true">✦</span> YOUR BARANGAY, CONNECTED
          </span>
          <h2>Your services and community updates, all in one place.</h2>
          <p>
            Welcome back, <strong>{email}</strong>. Check your applications,
            read barangay announcements, and find your local officials.
          </p>
          <Link className="resident-browse-button" href="/#services">
            Browse local services <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="resident-welcome-mark" aria-hidden="true">
          <Image
            alt=""
            height={106}
            src="/centro-norte-logo.png"
            width={106}
          />
        </div>
      </section>

      <div className="dashboard-section-title">
        <div>
          <span className="section-kicker">QUICK ACCESS</span>
          <h2>Community services</h2>
        </div>
        <Link href="/#services">See all services →</Link>
      </div>

      <div className="resident-services-grid" id="services">
        <Link className="resident-service-card" href="/#services">
          <span className="resident-service-icon green" aria-hidden="true">
            ✓
          </span>
          <span>
            <strong>Barangay clearance</strong>
            <small>Requirements and local assistance</small>
          </span>
          <span className="resident-service-arrow" aria-hidden="true">
            →
          </span>
        </Link>
        <Link className="resident-service-card" href="/#services">
          <span className="resident-service-icon gold" aria-hidden="true">
            ◈
          </span>
          <span>
            <strong>Certificates</strong>
            <small>Residency and indigency information</small>
          </span>
          <span className="resident-service-arrow" aria-hidden="true">
            →
          </span>
        </Link>
        <Link className="resident-service-card" href="/#contact">
          <span className="resident-service-icon blue" aria-hidden="true">
            ?
          </span>
          <span>
            <strong>Contact the barangay</strong>
            <small>Get help from your local office</small>
          </span>
          <span className="resident-service-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>

      <section className="resident-community-section" id="announcements">
        <div className="dashboard-section-title">
          <div>
            <span className="section-kicker">FROM YOUR BARANGAY</span>
            <h2>Updates &amp; announcements</h2>
          </div>
          <span className="dashboard-section-note">Community bulletin</span>
        </div>
        {announcementsError ? (
          <p className="resident-application-load-error" role="alert">
            Could not load announcements: {announcementsError}. Run the latest
            application and announcement setup SQL in Supabase.
          </p>
        ) : announcements.length === 0 ? (
          <div className="resident-empty-state resident-bulletin-empty">
            <span className="resident-empty-icon" aria-hidden="true">◉</span>
            <div>
              <strong>No announcements have been published here yet</strong>
              <p>
                New notices and community updates will appear in this space.
                Please check the public bulletin or contact the barangay hall.
              </p>
              <Link href="/#announcements">Visit the public bulletin →</Link>
            </div>
          </div>
        ) : (
          <ul className="resident-announcement-list">
            {announcements.map((announcement) => (
              <li key={announcement.id}>
                <div>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.body}</p>
                </div>
                <time dateTime={announcement.published_at}>
                  {new Intl.DateTimeFormat("en-PH", {
                    dateStyle: "medium",
                    timeZone: "Asia/Manila",
                  }).format(new Date(announcement.published_at))}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ResidentAnnouncementSubscription
        subscribed={announcementSubscribed}
        error={announcementSubscriptionError}
      />

      <section className="resident-requests-card" id="requests">
        <div className="dashboard-panel-heading">
          <div>
            <span className="section-kicker">APPLICATION TRACKER</span>
            <h2>Application updates</h2>
          </div>
          <span className="requests-empty-badge">
            {applicationUpdates.length}{" "}
            {applicationUpdates.length === 1 ? "application" : "applications"}
          </span>
        </div>
        {applicationLoadErrors.length > 0 ? (
          <p className="resident-application-load-error" role="alert">
            Application tracking could not load:{" "}
            {applicationLoadErrors.join(" ")}. Ask the administrator to run the
            latest application setup SQL in Supabase.
          </p>
        ) : applicationUpdates.length === 0 ? (
          <div className="resident-empty-state">
            <span className="resident-empty-icon" aria-hidden="true">
              ▤
            </span>
            <div>
              <strong>Your application updates will appear here</strong>
              <p>
                You have not submitted any applications yet. Use the forms
                below to apply.
              </p>
            </div>
          </div>
        ) : (
          <ul className="resident-application-updates">
            {applicationUpdates.map((application) => (
              <li key={application.id}>
                <span>
                  <strong>{application.category}</strong>
                  <small>
                    Submitted{" "}
                    {new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "medium",
                      timeZone: "Asia/Manila",
                    }).format(new Date(application.submittedAt))}
                  </small>
                  {application.reviewNotes && (
                    <small>Admin note: {application.reviewNotes}</small>
                  )}
                  {application.status === "Claimed" && application.claimedAt && (
                    <small>
                      Claimed{" "}
                      {new Intl.DateTimeFormat("en-PH", {
                        dateStyle: "medium",
                        timeZone: "Asia/Manila",
                      }).format(new Date(application.claimedAt))}
                    </small>
                  )}
                  {application.status === "Approved" && application.claimToken && (
                    <span className="resident-claim-qr">
                      <QRCodeSVG
                        bgColor="#ffffff"
                        level="M"
                        marginSize={4}
                        size={160}
                        title={`Educational assistance claim QR for ${application.category}`}
                        value={application.claimToken}
                      />
                      <small>
                        Bring this QR code and your valid ID to the barangay
                        office to claim your assistance.
                      </small>
                    </span>
                  )}
                </span>
                <span className="resident-application-status">
                  {application.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        {applicationLoadErrors.length === 0 && (
          <div className="resident-application-form-link">
            <Link href="#apply-heading">Apply for assistance ↓</Link>
          </div>
        )}
      </section>

      <ResidentApplicationForms
        educationApplicationsOpen={educationApplicationsOpen}
        educationApplicationsSettingsError={
          educationApplicationsSettingsError
        }
      />

    </>
  );
}
