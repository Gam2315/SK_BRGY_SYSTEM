"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, ViewTransition } from "react";

type IconName =
  | "arrow"
  | "calendar"
  | "chevron"
  | "clock"
  | "document"
  | "heart"
  | "home"
  | "location"
  | "megaphone"
  | "search"
  | "shield"
  | "users";

type Service = {
  category: string;
  description: string;
  icon: IconName;
  name: string;
};

type PublicAnnouncement = {
  id: string;
  title: string;
  body: string;
  published_at: string;
};

type LandingSection = "home" | "services" | "announcements" | "officials" | "about";

const services: Service[] = [
  {
    name: "Barangay clearance",
    description: "For employment, business, and other official transactions.",
    category: "Certificates",
    icon: "shield",
  },
  {
    name: "Certificate of residency",
    description: "Proof of residence for school, work, or other requirements.",
    category: "Certificates",
    icon: "home",
  },
  {
    name: "Certificate of indigency",
    description: "Request assistance with your certificate and requirements.",
    category: "Certificates",
    icon: "document",
  },
  {
    name: "Community assistance",
    description: "Find out about available programs and support services.",
    category: "Community",
    icon: "heart",
  },
  {
    name: "Report a concern",
    description: "Let the barangay know about a local issue or concern.",
    category: "Community",
    icon: "megaphone",
  },
  {
    name: "Community programs",
    description: "Discover activities, events, and programs near you.",
    category: "Community",
    icon: "users",
  },
];

const categories = ["All services", "Certificates", "Community"];

const officialPositions = [
  "Punong Barangay",
  "Barangay Kagawad",
  "Barangay Secretary",
  "Barangay Treasurer",
  "SK Chairperson",
];

function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const shared = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth,
  };

  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    document: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9M9 21v-7h6v7" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    megaphone: (
      <>
        <path d="m3 11 18-5v12L3 13v-2Z" />
        <path d="m7 14 2 6h4l-2-5M21 10v4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...shared}
    >
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All services");
  const [activeSection, setActiveSection] = useState<LandingSection>("home");
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [announcementLoadError, setAnnouncementLoadError] = useState("");

  useEffect(() => {
    const sectionIds: LandingSection[] = [
      "home",
      "services",
      "announcements",
      "officials",
      "about",
    ];
    let frame = 0;

    function updateActiveSection() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const header = document.querySelector(".site-header-shell");
        const marker = window.scrollY + (header?.getBoundingClientRect().height ?? 0) + 24;
        let currentSection: LandingSection = "home";

        for (const id of sectionIds) {
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top + window.scrollY <= marker) {
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
  }, []);

  const visibleServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return services.filter((service) => {
      const matchesCategory =
        activeCategory === "All services" ||
        service.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${service.name} ${service.description} ${service.category}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnnouncements() {
      try {
        const response = await fetch("/api/announcements", {
          signal: controller.signal,
        });
        if (!response.ok) {
          setAnnouncementLoadError(
            "Published announcements are temporarily unavailable.",
          );
          return;
        }
        const result = (await response.json()) as {
          announcements?: PublicAnnouncement[];
        };
        setAnnouncements(result.announcements ?? []);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setAnnouncementLoadError(
            "Published announcements are temporarily unavailable.",
          );
        }
      }
    }

    void loadAnnouncements();
    return () => controller.abort();
  }, []);

  return (
    <>
      <div className="site-header-shell">
        <div className="gov-strip">
          <div className="container gov-strip-inner">
            <div className="gov-identity">
              <Image
                className="gov-flag"
                src="/Flag_of_the_Philippines.svg"
                alt=""
                aria-hidden="true"
                width={24}
                height={16}
              />
              <span>Republic of the Philippines</span>
              <span className="gov-divider" />
              <span>Official local government portal</span>
            </div>
          </div>
        </div>

        <header className="site-header">
          <div className="container header-inner">
            <a className="brand" href="#home" aria-label="Barangay Portal home">
              <Image
                className="brand-logo"
                src="/centro-norte-logo.png"
                alt="Barangay Centro Norte seal"
                width={52}
                height={52}
                priority
              />
              <span className="brand-copy">
                <strong>Barangay Portal</strong>
                <span>Serbisyong malapit sa iyo</span>
              </span>
            </a>

            <nav className="main-nav" aria-label="Main navigation">
              <a
                className={`nav-link${activeSection === "home" ? " active" : ""}`}
                href="#home"
                onClick={() => setActiveSection("home")}
              >
                Home
              </a>
              <a
                className={`nav-link${activeSection === "services" ? " active" : ""}`}
                href="#services"
                onClick={() => setActiveSection("services")}
              >
                Services
              </a>
              <a
                className={`nav-link${activeSection === "announcements" ? " active" : ""}`}
                href="#announcements"
                onClick={() => setActiveSection("announcements")}
              >
                Announcements
              </a>
              <a
                className={`nav-link${activeSection === "officials" ? " active" : ""}`}
                href="#officials"
                onClick={() => setActiveSection("officials")}
              >
                Officials
              </a>
              <a
                className={`nav-link${activeSection === "about" ? " active" : ""}`}
                href="#about"
                onClick={() => setActiveSection("about")}
              >
                About
              </a>
            </nav>

            <Link className="header-cta" href="/login">
              Sign in <Icon name="arrow" size={16} />
            </Link>
          </div>
        </header>
      </div>
      <div className="site-header-spacer" aria-hidden="true" />

      <main className="main-content">
        <section className="hero-section" id="home">
          <Image
            className="hero-background"
            src="/masakbayan.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
          />
          <div className="container hero-grid">
            <ViewTransition
              name="signin-panel"
              share="morph"
              default="none"
            >
              <div className="hero-content">
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  YOUR COMMUNITY, CONNECTED
                </div>
                <h1>
                  Your barangay.
                  <br />
                  <span>Just a click away.</span>
                </h1>
                <p className="hero-description">
                  A simpler way to access local services, stay informed, and
                  connect with the people who serve your community.
                </p>
                <div className="hero-actions">
                  <a className="button button-primary" href="#services">
                    Browse services <Icon name="arrow" size={17} />
                  </a>
                  <a className="button button-secondary" href="#announcements">
                    What&apos;s happening?
                  </a>
                </div>
                <div className="hero-note">
                  <span className="note-icon">
                    <Icon name="shield" size={16} />
                  </span>
                  A trusted digital gateway to your local government
                </div>
              </div>
            </ViewTransition>
          </div>
          <div className="hero-bottom container">
            <a href="#services" className="scroll-cue">
              <span className="scroll-line" />
              Scroll to explore
            </a>
            <span className="hero-bottom-note">
              Serbisyong maaasahan. Komunidad na nagkakaisa.
            </span>
          </div>
        </section>

        <section className="services-section section-pad" id="services">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="section-kicker">HERE TO HELP</span>
                <h2>How can we help you today?</h2>
                <p>
                  Find the local service you need and get started with
                  confidence.
                </p>
              </div>
              <a className="text-link" href="#contact">
                Need assistance? <Icon name="arrow" size={16} />
              </a>
            </div>

            <div className="service-tools">
              <label className="service-search">
                <Icon name="search" size={19} />
                <input
                  type="search"
                  placeholder="Search a service..."
                  aria-label="Search barangay services"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <span className="search-shortcut">⌕</span>
              </label>
              <div className="service-filters" aria-label="Filter services">
                {categories.map((category) => (
                  <button
                    className={`filter-button${activeCategory === category ? " selected" : ""}`}
                    key={category}
                    type="button"
                    aria-pressed={activeCategory === category}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {visibleServices.length > 0 ? (
              <div className="service-grid">
                {visibleServices.map((service, index) => (
                  <a
                    className="service-card"
                    href="#contact"
                    key={service.name}
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <span className={`service-icon service-icon-${service.icon}`}>
                      <Icon name={service.icon} size={21} />
                    </span>
                    <span className="service-category">{service.category}</span>
                    <strong className="service-name">{service.name}</strong>
                    <span className="service-description">
                      {service.description}
                    </span>
                    <span className="service-link">
                      Learn more <Icon name="arrow" size={15} />
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="empty-state" role="status">
                <span className="empty-icon">
                  <Icon name="search" size={22} />
                </span>
                <strong>No services found</strong>
                <span>
                  Try another search or choose a different service category.
                </span>
                <button
                  className="text-link empty-reset"
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("All services");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="service-footnote">
              <span className="footnote-icon">
                <Icon name="clock" size={16} />
              </span>
              Online information is available anytime. In-person assistance is
              available during barangay office hours.
            </div>
          </div>
        </section>

        <section className="updates-section section-pad" id="announcements">
          <div className="container updates-layout">
            <div className="updates-intro">
              <span className="section-kicker">STAY IN THE LOOP</span>
              <h2>What&apos;s happening in your community?</h2>
              <p>
                Check back here for the latest notices, activities, and updates
                from your barangay.
              </p>
              <a className="text-link" href="#contact">
                Get in touch <Icon name="arrow" size={16} />
              </a>
            </div>

            <div className="announcement-feed">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <article className="announcement-card" key={announcement.id}>
                    <div className="announcement-topline">
                      <span className="announcement-badge">
                        <Icon name="megaphone" size={14} /> COMMUNITY NOTICE
                      </span>
                      <time
                        className="announcement-date"
                        dateTime={announcement.published_at}
                      >
                        <Icon name="calendar" size={14} />
                        {new Intl.DateTimeFormat("en-PH", {
                          dateStyle: "medium",
                          timeZone: "Asia/Manila",
                        }).format(new Date(announcement.published_at))}
                      </time>
                    </div>
                    <h3>{announcement.title}</h3>
                    <p className="published-announcement-body">
                      {announcement.body}
                    </p>
                    <div className="announcement-watermark" aria-hidden="true">
                      <Icon name="megaphone" size={102} strokeWidth={1} />
                    </div>
                  </article>
                ))
              ) : announcementLoadError ? (
                <p className="public-announcement-error" role="status">
                  {announcementLoadError}
                </p>
              ) : (
                <article className="announcement-card">
                  <div className="announcement-topline">
                    <span className="announcement-badge">
                      <Icon name="megaphone" size={14} /> COMMUNITY NOTICE
                    </span>
                    <span className="announcement-date">
                      <Icon name="calendar" size={14} /> Stay informed
                    </span>
                  </div>
                  <h3>Important updates, right where you need them.</h3>
                  <p>
                    Barangay announcements and community schedules will be
                    shared here. Visit or contact your barangay hall for the
                    latest information.
                  </p>
                  <a className="announcement-link" href="#contact">
                    Contact your barangay <Icon name="arrow" size={15} />
                  </a>
                  <div className="announcement-watermark" aria-hidden="true">
                    <Icon name="megaphone" size={102} strokeWidth={1} />
                  </div>
                </article>
              )}
            </div>
          </div>
        </section>

        <section className="officials-section section-pad" id="officials">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="section-kicker">YOUR LOCAL LEADERS</span>
                <h2>Barangay officials</h2>
                <p>
                  Meet the officials serving Barangay Centro Norte.
                </p>
              </div>
              <span className="officials-location-label">Centro Norte</span>
            </div>
            <div className="officials-card">
              <p className="officials-note">
                Official names and contact details have not been published in
                this portal yet. Please contact the barangay hall to confirm
                the current roster.
              </p>
              <ul className="officials-list">
                {officialPositions.map((position) => (
                  <li key={position}>
                    <span className="officials-role-icon" aria-hidden="true">
                      ♙
                    </span>
                    <span>
                      <strong>{position}</strong>
                      <small>Official details not yet published</small>
                    </span>
                  </li>
                ))}
              </ul>
              <a className="officials-contact" href="#contact">
                Contact the barangay hall <Icon name="arrow" size={15} />
              </a>
            </div>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="container about-inner">
            <div className="about-mark">
              <Icon name="users" size={22} />
            </div>
            <div className="about-copy">
              <span className="section-kicker">BUILT AROUND YOU</span>
              <h2>A more connected community starts here.</h2>
              <p>
                This portal makes it easier to find local information and
                connect with your barangay, wherever you are.
              </p>
            </div>
            <a className="about-button" href="/login">
              Connect with us <Icon name="arrow" size={16} />
            </a>
            <div className="about-decoration" aria-hidden="true" />
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div className="container footer-main">
          <div className="footer-brand">
            <a className="brand footer-brand-link" href="#home">
              <Image
                className="brand-logo footer-logo"
                src="/centro-norte-logo.png"
                alt="Barangay Centro Norte seal"
                width={48}
                height={48}
              />
              <span className="brand-copy">
                <strong>Barangay Portal</strong>
                <span>Serbisyong malapit sa iyo</span>
              </span>
            </a>
            <p>
              Your digital gateway to local services, community information,
              and the people who are here to help.
            </p>
          </div>

          <div className="footer-column">
            <strong>Explore</strong>
            <a href="#about">About the portal</a>
          </div>

          <div className="footer-column footer-contact">
            <strong>Visit your barangay hall</strong>
            <span>
              <Icon name="location" size={16} /> 3507 Centro Norte, Alcala, Cagayan, 
            </span>
            <span>
              <Icon name="clock" size={16} /> Mon - Fri: 8:00 AM - 5:00 PM
            </span>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <span>© Barangay Portal</span>
            <span>Serving the community, one neighbor at a time.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
