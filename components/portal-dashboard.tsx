import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import AdminApplicationReviewControls from "@/components/admin-application-review-controls";
import ResidentApplicationForms from "@/components/resident-application-forms";
import type {
  ApplicationDocumentLink,
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

type PortalDashboardProps = {
  email: string;
  educationApplications?: EducationApplicationWithDocuments[];
  educationApplicationsError?: string;
  jobseekerApplications?: JobseekerApplicationWithDocuments[];
  jobseekerApplicationsError?: string;
  residentEducationApplications?: EducationalAssistanceApplication[];
  residentEducationApplicationsError?: string;
  residentJobseekerApplications?: JobseekerApplication[];
  residentJobseekerApplicationsError?: string;
  role: "admin" | "resident";
};

const officialPositions = [
  "Punong Barangay",
  "Barangay Kagawad",
  "Barangay Secretary",
  "Barangay Treasurer",
  "SK Chairperson",
];

export default function PortalDashboard({
  email,
  educationApplications = [],
  educationApplicationsError,
  jobseekerApplications = [],
  jobseekerApplicationsError,
  residentEducationApplications = [],
  residentEducationApplicationsError,
  residentJobseekerApplications = [],
  residentJobseekerApplicationsError,
  role,
}: PortalDashboardProps) {
  const isAdmin = role === "admin";
  const initials = email.slice(0, 1).toUpperCase();

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
          <a className="dashboard-nav-link active" href="#overview">
            <span aria-hidden="true">▦</span> Overview
          </a>
          {isAdmin ? (
            <>
              <a className="dashboard-nav-link" href="#services">
                <span aria-hidden="true">◇</span> Services
              </a>
              <a className="dashboard-nav-link" href="#educational-assistance">
                <span aria-hidden="true">▤</span> Education applicants
              </a>
              <a className="dashboard-nav-link" href="#jobseeker-applicants">
                <span aria-hidden="true">♙</span> Jobseeker applicants
              </a>
              <a className="dashboard-nav-link" href="#announcements">
                <span aria-hidden="true">◉</span> Announcements
              </a>
              <a className="dashboard-nav-link" href="#account">
                <span aria-hidden="true">◎</span> Account
              </a>
            </>
          ) : (
            <>
              <a className="dashboard-nav-link" href="#services">
                <span aria-hidden="true">◇</span> Browse services
              </a>
              <a className="dashboard-nav-link" href="#requests">
                <span aria-hidden="true">▤</span> Applications
              </a>
              <a className="dashboard-nav-link" href="#announcements">
                <span aria-hidden="true">◉</span> Announcements
              </a>
              <a className="dashboard-nav-link" href="#officials">
                <span aria-hidden="true">♙</span> Barangay officials
              </a>
              <a className="dashboard-nav-link" href="#account">
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
            <strong>{isAdmin ? "Admin dashboard" : "My dashboard"}</strong>
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
              <h1>{isAdmin ? "Admin dashboard" : "Welcome to your portal"}</h1>
              <p>
                {isAdmin
                  ? "Your administration workspace for the community portal."
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
            <AdminOverview
              applications={educationApplications}
              applicationsError={educationApplicationsError}
              jobseekerApplications={jobseekerApplications}
              jobseekerApplicationsError={jobseekerApplicationsError}
            />
          ) : (
            <ResidentOverview
              email={email}
              educationApplications={residentEducationApplications}
              educationApplicationsError={residentEducationApplicationsError}
              jobseekerApplications={residentJobseekerApplications}
              jobseekerApplicationsError={residentJobseekerApplicationsError}
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
    </main>
  );
}

function AdminOverview({
  applications,
  applicationsError,
  jobseekerApplications,
  jobseekerApplicationsError,
}: {
  applications: EducationApplicationWithDocuments[];
  applicationsError?: string;
  jobseekerApplications: JobseekerApplicationWithDocuments[];
  jobseekerApplicationsError?: string;
}) {
  const highSchoolApplications = applications.filter(
    (application) => application.education_level === "high_school",
  );
  const collegeApplications = applications.filter(
    (application) => application.education_level === "college",
  );

  return (
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
          <Link className="admin-public-link" href="/">
            View public portal <span aria-hidden="true">→</span>
          </Link>
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
        <article className="admin-tool-card" id="announcements">
          <span className="admin-tool-icon gold" aria-hidden="true">
            ◉
          </span>
          <span className="admin-tool-label">COMMUNITY UPDATES</span>
          <h3>Announcements</h3>
          <p>
            Visit the public updates section and see the current community
            notice.
          </p>
          <Link href="/#announcements">
            View announcements <span aria-hidden="true">→</span>
          </Link>
        </article>
      </div>
      <p className="dashboard-data-note">
        <span aria-hidden="true">i</span>
        Application records are private to authorized portal administrators.
      </p>

      <section
        className="admin-applications-section"
        id="educational-assistance"
      >
        <div className="dashboard-section-title">
          <div>
            <span className="section-kicker">EDUCATIONAL ASSISTANCE</span>
            <h2>Applicant lists</h2>
          </div>
          <span className="dashboard-section-note">
            {applications.length}{" "}
            {applications.length === 1 ? "application" : "applications"}
          </span>
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
              educationLevel="High school"
            />
            <ApplicationList
              applications={collegeApplications}
              educationLevel="College"
            />
          </div>
        )}
      </section>

      <section
        className="admin-applications-section"
        id="jobseeker-applicants"
      >
        <div className="dashboard-section-title">
          <div>
            <span className="section-kicker">EMPLOYMENT ASSISTANCE</span>
            <h2>Jobseeker applicants</h2>
          </div>
          <span className="dashboard-section-note">
            {jobseekerApplications.length}{" "}
            {jobseekerApplications.length === 1 ? "applicant" : "applicants"}
          </span>
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
                          rel="noreferrer"
                          target="_blank"
                        >
                          {document.label} ↗
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
    </>
  );
}

function ApplicationList({
  applications,
  educationLevel,
}: {
  applications: EducationApplicationWithDocuments[];
  educationLevel: string;
}) {
  return (
    <section className="admin-application-group">
      <div className="admin-application-group-heading">
        <h3>{educationLevel}</h3>
        <span>{applications.length}</span>
      </div>
      {applications.length === 0 ? (
        <p className="admin-applications-empty">
          No {educationLevel.toLowerCase()} applications yet.
        </p>
      ) : (
        <ul className="admin-application-list">
          {applications.map((application) => (
            <li className="admin-application-item" key={application.id}>
              <div className="admin-application-primary">
                <strong>{application.applicant_name}</strong>
                <span>{application.applicant_email}</span>
              </div>
              <dl className="admin-application-details">
                <div>
                  <dt>School</dt>
                  <dd>{application.school_name}</dd>
                </div>
                <div>
                  <dt>Year / grade</dt>
                  <dd>{application.year_or_grade_level}</dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>{application.contact_number || "Not provided"}</dd>
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
                        rel="noreferrer"
                        target="_blank"
                      >
                        {document.label} ↗
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
                applicationType="education"
                status={application.status}
                reviewNotes={application.review_notes}
                missingRequirements={[
                  !application.applicant_name.trim() && "Applicant name",
                  !application.school_name.trim() && "School name",
                  !application.year_or_grade_level.trim() && "Year / grade",
                  !application.school_assessment_path && "School assessment",
                  !application.school_id_front_path && "School ID front",
                  !application.school_id_back_path && "School ID back",
                ].filter((requirement): requirement is string =>
                  Boolean(requirement),
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ResidentOverview({
  email,
  educationApplications,
  educationApplicationsError,
  jobseekerApplications,
  jobseekerApplicationsError,
}: {
  email: string;
  educationApplications: EducationalAssistanceApplication[];
  educationApplicationsError?: string;
  jobseekerApplications: JobseekerApplication[];
  jobseekerApplicationsError?: string;
}) {
  const applicationUpdates = [
    ...educationApplications.map((application) => ({
      id: application.id,
      category:
        application.education_level === "high_school"
          ? "High school educational assistance"
          : "College educational assistance",
      status: application.status,
      reviewNotes: application.review_notes,
      submittedAt: application.submitted_at,
    })),
    ...jobseekerApplications.map((application) => ({
      id: application.id,
      category: "Jobseeker assistance",
      status: application.status,
      reviewNotes: application.review_notes,
      submittedAt: application.submitted_at,
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
                </span>
                <span className="resident-application-status">
                  {application.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        {applicationLoadErrors.length > 0 ? null : (
          <div className="resident-application-form-link">
            <Link href="#apply-heading">Apply for assistance ↓</Link>
          </div>
        )}
      </section>

      <ResidentApplicationForms />

      <section className="resident-community-section" id="announcements">
        <div className="dashboard-section-title">
          <div>
            <span className="section-kicker">FROM YOUR BARANGAY</span>
            <h2>Updates &amp; announcements</h2>
          </div>
          <span className="dashboard-section-note">Community bulletin</span>
        </div>
        <div className="resident-empty-state resident-bulletin-empty">
          <span className="resident-empty-icon" aria-hidden="true">◉</span>
          <div>
            <strong>No announcements have been published here yet</strong>
            <p>
              New notices and community updates will appear in this space.
              Please check the barangay&apos;s public bulletin or contact the
              barangay hall for current announcements.
            </p>
            <Link href="/#announcements">Visit the public bulletin →</Link>
          </div>
        </div>
      </section>

      <section className="resident-officials-section" id="officials">
        <div className="dashboard-section-title">
          <div>
            <span className="section-kicker">YOUR LOCAL LEADERS</span>
            <h2>Barangay officials</h2>
          </div>
          <span className="dashboard-section-note">Centro Norte</span>
        </div>
        <div className="resident-officials-card">
          <p className="resident-officials-note">
            The official names and contact details have not been published in
            this portal yet. Please contact the barangay hall to confirm the
            current roster.
          </p>
          <ul className="resident-officials-list">
            {officialPositions.map((position) => (
              <li key={position}>
                <span className="officials-role-icon" aria-hidden="true">♙</span>
                <span>
                  <strong>{position}</strong>
                  <small>Official details not yet published</small>
                </span>
              </li>
            ))}
          </ul>
          <Link className="resident-officials-contact" href="/#contact">
            Contact the barangay hall →
          </Link>
        </div>
      </section>
    </>
  );
}
