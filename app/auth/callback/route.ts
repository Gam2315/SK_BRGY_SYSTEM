import { NextResponse, type NextRequest } from "next/server";
import { recordActivity } from "@/lib/supabase/activity-logs";
import { isPortalAdmin } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const config = getSupabaseConfig();
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));

  if (!config) {
    return NextResponse.redirect(new URL("/login?error=setup", request.url));
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=callback", request.url),
    );
  }

  const supabase = await createClient({ writeCookies: true });
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase auth callback failed:", error.message);
    return NextResponse.redirect(
      new URL("/login?error=callback", request.url),
    );
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error("Could not verify user after auth callback:", userError.message);
    return NextResponse.redirect(
      new URL("/login?error=callback", request.url),
    );
  }

  if (userData.user?.id && userData.user.email) {
    await recordActivity(supabase, userData.user, {
      action: "Sign in",
      summary: "Signed in to the portal.",
    });
  }

  const isAdmin = userData.user
    ? await isPortalAdmin(supabase)
    : false;
  const destination = isAdmin ? "/admin" : nextPath;

  return NextResponse.redirect(new URL(destination, request.url));
}
