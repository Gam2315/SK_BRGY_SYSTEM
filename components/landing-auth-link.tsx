import Link from "next/link";
import { connection } from "next/server";
import { isPortalAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Placement = "header" | "about";

export default async function LandingAuthLink({
  placement,
}: {
  placement: Placement;
}) {
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error && error.name !== "AuthSessionMissingError") {
    console.error("Could not verify landing page session:", error.message);
  }

  const href = typeof data?.claims.sub === "string"
    ? await isPortalAdmin(supabase)
      ? "/admin"
      : "/dashboard"
    : "/login";
  const label = href === "/login"
    ? placement === "header"
      ? "Sign in"
      : "Connect with us"
    : placement === "header"
      ? "Dashboard"
      : "Go to dashboard";

  return (
    <Link
      className={placement === "header" ? "header-cta" : "about-button"}
      href={href}
    >
      {label} <span aria-hidden="true">→</span>
    </Link>
  );
}

export function LandingAuthLinkFallback({
  placement,
}: {
  placement: Placement;
}) {
  return (
    <Link
      className={placement === "header" ? "header-cta" : "about-button"}
      href="/login"
    >
      {placement === "header" ? "Sign in" : "Connect with us"}{" "}
      <span aria-hidden="true">→</span>
    </Link>
  );
}
