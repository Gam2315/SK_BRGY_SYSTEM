"use client";

import { useActionState } from "react";
import {
  submitConcernReport,
  type ConcernReportActionState,
} from "@/app/actions/concern-reports";

export default function ConcernReportForm() {
  const [state, formAction, pending] = useActionState<
    ConcernReportActionState,
    FormData
  >(submitConcernReport, {});

  return (
    <div className="concern-report-panel">
      <div className="concern-report-copy">
        <span className="section-kicker">WE&apos;RE HERE TO LISTEN</span>
        <h2>Report a concern</h2>
        <p>
          Send an issue affecting you or the community to the barangay website
          administrators for review.
        </p>
        <p className="concern-report-privacy">
          Leave your name blank to report anonymously. You can also attach a
          picture to help explain the concern. Please don&apos;t include
          passwords or other sensitive personal information.
        </p>
      </div>

      <form action={formAction} className="concern-report-form">
        <label>
          <span>Your name <small>(optional)</small></span>
          <input
            autoComplete="name"
            maxLength={120}
            name="reporter_name"
            placeholder="Leave blank to stay anonymous"
            type="text"
          />
        </label>
        <label>
          <span>Your concern</span>
          <textarea
            maxLength={5000}
            name="concern"
            placeholder="Tell us what happened and where it is affecting the community..."
            required
            rows={6}
          />
        </label>
        <label>
          <span>Attach a picture <small>(optional)</small></span>
          <input
            accept="image/jpeg,image/png,image/webp"
            name="image"
            type="file"
          />
          <small>JPG, PNG, or WebP. Maximum file size: 5 MB.</small>
        </label>
        {state.error && (
          <p className="concern-report-message error" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="concern-report-message success" role="status">
            {state.success}
          </p>
        )}
        <button
          className="button button-primary"
          disabled={pending}
          type="submit"
        >
          {pending ? "Sending report..." : "Send concern"}
        </button>
      </form>
    </div>
  );
}
