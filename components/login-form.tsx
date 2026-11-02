"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = { mode: "signin" };

export default function LoginForm({ configured }: { configured: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, formAction, pending] = useActionState(
    authenticate,
    initialState,
  );
  const message = state.mode === mode ? state.error ?? state.notice : undefined;

  return (
    <>
      <div className="auth-mode-tabs" role="tablist" aria-label="Account action">
        <button
          aria-selected={mode === "signin"}
          className={mode === "signin" ? "selected" : ""}
          id="signin-tab"
          onClick={() => setMode("signin")}
          role="tab"
          type="button"
        >
          Sign in
        </button>
        <button
          aria-selected={mode === "signup"}
          className={mode === "signup" ? "selected" : ""}
          id="signup-tab"
          onClick={() => setMode("signup")}
          role="tab"
          type="button"
        >
          Create account
        </button>
      </div>

      <form action={formAction} className="auth-form">
        <input name="mode" type="hidden" value={mode} />
        <label htmlFor="auth-email">Email address</label>
        <input
          autoComplete="email"
          id="auth-email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <div className="auth-password-label">
          <label htmlFor="auth-password">Password</label>
          {mode === "signup" && (
            <span className="password-hint">At least 8 characters</span>
          )}
        </div>
        <input
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          id="auth-password"
          minLength={mode === "signup" ? 8 : undefined}
          name="password"
          placeholder="Enter your password"
          required
          type="password"
        />

        {message && (
          <p
            className={state.error ? "auth-error" : "auth-success"}
            role={state.error ? "alert" : "status"}
          >
            {message}
          </p>
        )}

        {!configured && (
          <p className="auth-setup-notice" role="status">
            Connect a Supabase project in <code>.env.local</code> to enable
            account access.
          </p>
        )}

        <button
          className="auth-submit"
          disabled={pending || !configured}
          type="submit"
        >
          {pending
            ? "Please wait..."
            : mode === "signin"
              ? "Sign in to your account"
              : "Create your account"}
          {!pending && <span aria-hidden="true">→</span>}
        </button>
      </form>

      <p className="auth-switch-prompt">
        {mode === "signin" ? "New to the portal?" : "Already have an account?"}{" "}
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          type="button"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </>
  );
}
