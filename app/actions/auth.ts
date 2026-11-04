"use server";

import { redirect } from "next/navigation";
import { recordActivity } from "@/lib/supabase/activity-logs";
import { getSupabaseConfig, isAdminEmail } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  mode: "signin" | "signup";
  notice?: string;
};

export async function authenticate(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const mode = formData.get("mode") === "signup" ? "signup" : "signin";
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  if (typeof emailValue !== "string" || typeof passwordValue !== "string") {
    return { mode, error: "Enter your email address and password." };
  }

  const email = emailValue.trim().toLowerCase();
  const password = passwordValue;

  if (!email || !email.includes("@") || !password) {
    return { mode, error: "Enter a valid email address and password." };
  }

  const supabaseConfig = getSupabaseConfig();

  if (!supabaseConfig) {
    return {
      mode,
      error:
        "Sign-in is not configured yet. Add your Supabase URL and publishable key to .env.local.",
    };
  }

  if (mode === "signup") {
    if (isAdminEmail(email)) {
      return {
        mode,
        error:
          "The administrator account is provisioned separately. Sign in with your admin account instead.",
      };
    }

    if (password.length < 8) {
      return {
        mode,
        error: "Choose a password with at least 8 characters.",
      };
    }

    const supabase = await createClient({ writeCookies: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL(
          "/auth/callback?next=/dashboard",
          process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        ).toString(),
      },
    });

    if (error) {
      return { mode, error: error.message };
    }

    if (data.session) {
      if (data.user?.id && data.user.email) {
        await recordActivity(supabase, data.user, {
          action: "Account created",
          summary: "Created a resident portal account.",
        });
      }
      redirect("/dashboard");
    }

    return {
      mode,
      notice:
        "Your account was created. Check your inbox and spam folder for the confirmation link. If no email arrives, configure a custom SMTP provider in Supabase Authentication settings; Supabase's default mailer has strict recipient and rate limits.",
    };
  }

  const supabase = await createClient({ writeCookies: true });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { mode, error: error.message };
  }

  if (!data.user) {
    return {
      mode,
      error: "We could not verify your account. Please try signing in again.",
    };
  }

  await recordActivity(supabase, {
    id: data.user.id,
    email: data.user.email ?? email,
  }, {
    action: "Sign in",
    summary: "Signed in to the portal.",
  });

  redirect(isAdminEmail(data.user.email) ? "/admin" : "/dashboard");
}

export async function signInWithGoogle() {
  const supabaseConfig = getSupabaseConfig();

  if (!supabaseConfig) {
    redirect("/login?error=setup");
  }

  const supabase = await createClient({ writeCookies: true });
  const redirectTo = new URL(
    "/auth/callback",
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ).toString();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    console.error("Could not start Google sign-in:", error.message);
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabaseConfig = getSupabaseConfig();

  if (!supabaseConfig) {
    redirect("/login?error=setup");
  }

  const supabase = await createClient({ writeCookies: true });
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error("Could not verify session before sign-out:", userError.message);
    redirect("/login?error=signout");
  }

  if (userData.user?.id && userData.user.email) {
    await recordActivity(supabase, userData.user, {
      action: "Sign out",
      summary: "Signed out of the portal.",
    });
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase sign-out failed:", error.message);
    redirect("/login?error=signout");
  }

  redirect("/");
}
