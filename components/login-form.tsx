"use client";

import { useActionState, useState } from "react";
import {
  authenticate,
  signInWithGoogle,
  type AuthFormState,
} from "@/app/actions/auth";

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

      <div className="auth-google-section">
        <div className="auth-divider">
          <span>or continue with</span>
        </div>
        <form action={signInWithGoogle} className="auth-google-form">
          <button
            className="auth-google-button"
            disabled={!configured}
            type="submit"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 48 48"
              width="18"
              height="18"
            >
              <path
                fill="#4285F4"
                d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
              />
              <path
                fill="#34A853"
                d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
              />
              <path
                fill="#FBBC05"
                d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"
              />
              <path
                fill="#EA4335"
                d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </form>
      </div>

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
