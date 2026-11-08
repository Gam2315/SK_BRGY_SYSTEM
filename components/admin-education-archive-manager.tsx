"use client";

import { useActionState } from "react";
import {
  archiveEducationAssistanceApplications,
  type EducationAssistanceArchiveState,
} from "@/app/actions/education-assistance-archive";
import type { EducationAssistanceArchiveBatch } from "@/lib/supabase/database.types";

const initialState: EducationAssistanceArchiveState = {};

export default function AdminEducationArchiveManager({
  activeApplicationCount,
  archiveBatches,
  archiveBatchesError,
  selectedArchiveId,
  onSelectArchive,
}: {
  activeApplicationCount: number;
  archiveBatches: EducationAssistanceArchiveBatch[];
  archiveBatchesError?: string;
  selectedArchiveId: string | null;
  onSelectArchive: (archiveId: string | null) => void;
}) {
  const [state, action, pending] = useActionState(
    archiveEducationAssistanceApplications,
    initialState,
  );
  const selectedArchive = archiveBatches.find(
    (archive) => archive.id === selectedArchiveId,
  );

  return (
    <section className="education-archive-manager" aria-label="Program archives">
      <div className="education-archive-manager-current">
        <label htmlFor="education-archive-picker">Application list</label>
        <select
          id="education-archive-picker"
          onChange={(event) => onSelectArchive(event.target.value || null)}
          value={selectedArchiveId ?? ""}
        >
          <option value="">Current active program</option>
          {archiveBatches.map((archive) => {
            const archivedDate = new Intl.DateTimeFormat("en-PH", {
              dateStyle: "medium",
              timeZone: "Asia/Manila",
            }).format(new Date(archive.archived_at));

            return (
              <option key={archive.id} value={archive.id}>
                {archive.name} · {archivedDate}
              </option>
            );
          })}
        </select>
      </div>

      {selectedArchive ? (
        <p className="education-archive-manager-note">
          Viewing archived applications from{" "}
          <strong>{selectedArchive.name}</strong>, archived{" "}
          {new Intl.DateTimeFormat("en-PH", {
            dateStyle: "medium",
            timeZone: "Asia/Manila",
          }).format(new Date(selectedArchive.archived_at))}. Archived
          applications cannot be reviewed again. Existing approved claim QR
          codes remain valid.
        </p>
      ) : (
        <form
          action={action}
          className="education-archive-manager-form"
          onSubmit={(event) => {
            if (
              !window.confirm(
                "Archive all current educational assistance applications? This keeps them for reference, closes submissions, and does not delete any data. Existing approved claim QR codes will remain valid. You can reopen applications when the new program is ready.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <label htmlFor="education-archive-name">Archive current list</label>
          <input
            autoComplete="off"
            id="education-archive-name"
            maxLength={120}
            name="archive_name"
            placeholder="e.g. AY 2025-2026"
            required
          />
          <button
            disabled={pending || activeApplicationCount === 0}
            type="submit"
          >
            {pending ? "Archiving..." : "Archive list"}
          </button>
        </form>
      )}

      {archiveBatchesError && (
        <p className="education-archive-manager-message error" role="alert">
          Could not load program archives: {archiveBatchesError}. Run the latest
          educational assistance setup SQL in Supabase.
        </p>
      )}
      {state.error && (
        <p className="education-archive-manager-message error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="education-archive-manager-message success" role="status">
          {state.success}
        </p>
      )}
    </section>
  );
}
