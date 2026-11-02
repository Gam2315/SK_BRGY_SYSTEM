import { Suspense, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/components/login-form";
import { getSupabaseConfig } from "@/lib/supabase/config";

const errorMessages: Record<string, string> = {
  callback: "That confirmation link could not be verified. Please try again.",
  setup: "Sign-in is temporarily unavailable while the portal is configured.",
  signout: "We could not sign you out completely. Please try again.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link className="auth-home-link" href="/">
          <Image
            src="/centro-norte-logo.png"
            alt="Barangay Centro Norte seal"
            width={48}
            height={48}
          />
          <span>
            <strong>Barangay Portal</strong>
            <small>Serbisyong malapit sa iyo</small>
          </span>
        </Link>

        <div className="auth-visual-copy">
          <span className="auth-kicker">YOUR COMMUNITY, CONNECTED</span>
          <h1>
            Local service,
            <br />
            <span>made personal.</span>
          </h1>
          <p>
            Sign in to connect with your barangay and get the support and
            information you need.
          </p>
          <div className="auth-community-note">
            <span className="auth-community-dot" />
            Serbisyong maaasahan. Komunidad na nagkakaisa.
          </div>
        </div>

        <div className="auth-visual-footer">
          <span>BARANGAY CENTRO NORTE</span>
          <span>ALCALA, CAGAYAN</span>
        </div>
      </section>

      <section className="auth-form-side">
        <ViewTransition
          name="signin-panel"
          share="morph"
          default="none"
        >
          <div className="auth-form-wrap">
          <Link className="auth-back-link" href="/">
            <span aria-hidden="true">←</span> Back to home
          </Link>
          <div className="auth-mobile-brand">
            <Image
              src="/centro-norte-logo.png"
              alt="Barangay Centro Norte seal"
              width={44}
              height={44}
            />
            <span>Barangay Portal</span>
          </div>

          <div className="auth-heading">
            <span className="section-kicker">WELCOME TO YOUR PORTAL</span>
            <h2>Sign in to your account</h2>
            <p>Access community services with your email address.</p>
          </div>

          <Suspense fallback={null}>
            <LoginErrorMessage searchParams={searchParams} />
          </Suspense>

          <LoginForm configured={Boolean(getSupabaseConfig())} />

          <p className="auth-privacy-note">
            Your account is protected. Administrator access is reserved for
            authorized barangay staff.
          </p>

          <Link className="auth-back-home" href="/">
            Return to the Barangay Portal
          </Link>
          </div>
        </ViewTransition>
      </section>
    </main>
  );
}

async function LoginErrorMessage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!error || !errorMessages[error]) {
    return null;
  }

  return (
    <p className="auth-error" role="alert">
      {errorMessages[error]}
    </p>
  );
}
