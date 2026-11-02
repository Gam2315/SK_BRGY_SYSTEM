import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";

type PortalDashboardProps = {
  email: string;
  role: "admin" | "resident";
};

export default function PortalDashboard({
  email,
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
                <span aria-hidden="true">▤</span> My requests
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
            <AdminOverview />
          ) : (
            <ResidentOverview email={email} />
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

function AdminOverview() {
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
        Request records and editable announcements are not connected to a
        database yet.
      </p>
    </>
  );
}

function ResidentOverview({ email }: { email: string }) {
  return (
    <>
      <section className="resident-welcome-card">
        <div>
          <span className="resident-welcome-badge">
            <span aria-hidden="true">✦</span> YOUR BARANGAY, CONNECTED
          </span>
          <h2>Serbisyong malapit sa iyo.</h2>
          <p>
            You&apos;re signed in as <strong>{email}</strong>. Browse local
            services or get in touch with your barangay.
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
            <span className="section-kicker">SERVICE ACTIVITY</span>
            <h2>My requests</h2>
          </div>
          <span className="requests-empty-badge">No requests yet</span>
        </div>
        <p>
          Online request tracking is not connected yet. Contact the barangay
          office for assistance with a service request.
        </p>
        <Link href="/#contact">Contact your barangay →</Link>
      </section>
    </>
  );
}
