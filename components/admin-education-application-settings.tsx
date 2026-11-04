"use client";

import { useActionState } from "react";
import {
  updateEducationApplicationAvailability,
  type EducationApplicationSettingsState,
} from "@/app/actions/education-application-settings";

const initialState: EducationApplicationSettingsState = {};

export default function AdminEducationApplicationSettings({
  isOpen,
  error,
}: {
  isOpen?: boolean;
  error?: string;
}) {
  const [state, action, pending] = useActionState(
    updateEducationApplicationAvailability,
    initialState,
  );
  const isAvailable = isOpen !== undefined && !error;

  return (
    <div className="education-application-settings">
      <div className="education-application-settings-status">
        <span>Application status</span>
        <strong
          className={
            isAvailable ? (isOpen ? "open" : "closed") : "unavailable"
          }
        >
          {isAvailable ? (isOpen ? "Open" : "Closed") : "Unavailable"}
        </strong>
      </div>
      {error ? (
        <p
          className="education-application-settings-message error"
          role="alert"
        >
          <strong>Could not load application settings.</strong>
          <span>
            {error} Run the full latest{" "}
            <code>supabase/educational-assistance.sql</code> in the Supabase
            SQL Editor for the project configured in this app, then refresh
            this page.
          </span>
        </p>
      ) : (
        <form action={action}>
          <input name="is_open" type="hidden" value={String(!isOpen)} />
          <button disabled={pending} type="submit">
            {pending
              ? "Saving..."
              : isOpen
                ? "Close applications"
                : "Open applications"}
          </button>
        </form>
      )}
      {state.error && (
        <p
          className="education-application-settings-message action-error"
          role="alert"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          className="education-application-settings-message success"
          role="status"
        >
          {state.success}
        </p>
      )}
    </div>
  );
}
