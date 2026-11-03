"use client";

import { useActionState } from "react";
import {
  updateApplicationReview,
  type ApplicationReviewState,
} from "@/app/actions/application-reviews";

type ApplicationType = "education" | "jobseeker";

export default function AdminApplicationReviewControls({
  applicationId,
  applicationType,
  status,
  reviewNotes,
  missingRequirements,
}: {
  applicationId: string;
  applicationType: ApplicationType;
  status: string;
  reviewNotes: string | null;
  missingRequirements: string[];
}) {
  const action = updateApplicationReview.bind(
    null,
    applicationType,
    applicationId,
  );
  const [state, formAction, isPending] = useActionState<
    ApplicationReviewState,
    FormData
  >(action, {});
  const isComplete = missingRequirements.length === 0;

  return (
    <div className="admin-application-review">
      <div
        className={`admin-application-check${isComplete ? " complete" : " incomplete"}`}
      >
        <strong>
          Automatic completeness check:{" "}
          {isComplete ? "Ready for review" : "Needs attention"}
        </strong>
        {isComplete ? (
          <p>Required information and document uploads are present.</p>
        ) : (
          <p>Missing: {missingRequirements.join(", ")}.</p>
        )}
        <p>
          This check does not verify document authenticity or eligibility. Make
          the final decision after reviewing the application.
        </p>
      </div>

      {reviewNotes && (
        <p className="admin-application-review-note">
          <strong>Current review note:</strong> {reviewNotes}
        </p>
      )}

      <form action={formAction} className="admin-application-review-form">
        <label>
          <span>Optional reason or review note</span>
          <ReviewNoteField
            key={reviewNotes ?? "no-review-note"}
            initialValue={reviewNotes ?? ""}
          />
        </label>
        <div className="admin-application-review-actions">
          <button
            disabled={isPending}
            name="status"
            type="submit"
            value="Approved"
          >
            {isPending
              ? "Saving..."
              : status === "Approved"
                ? "Keep approved"
                : "Approve"}
          </button>
          <button
            className="reject"
            disabled={isPending}
            name="status"
            type="submit"
            value="Rejected"
          >
            {isPending
              ? "Saving..."
              : status === "Rejected"
                ? "Keep rejected"
                : "Reject"}
          </button>
        </div>
      </form>

      {state.error && (
        <p className="application-review-message error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="application-review-message success" role="status">
          {state.success}
        </p>
      )}
    </div>
  );
}

function ReviewNoteField({ initialValue }: { initialValue: string }) {
  return (
    <textarea
      defaultValue={initialValue}
      maxLength={1000}
      name="review_notes"
      placeholder="Add a note for the applicant"
    />
  );
}
