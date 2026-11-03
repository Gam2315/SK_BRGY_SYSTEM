"use client";

import { useActionState } from "react";
import {
  deleteAnnouncement,
  publishAnnouncement,
  retryAnnouncementEmails,
  updateAnnouncement,
  type AnnouncementActionState,
} from "@/app/actions/announcements";
import type { Announcement } from "@/lib/supabase/database.types";

const initialState: AnnouncementActionState = {};

export default function AdminAnnouncementManager({
  announcements,
  error,
}: {
  announcements: Announcement[];
  error?: string;
}) {
  const [state, formAction, pending] = useActionState(
    publishAnnouncement,
    initialState,
  );

  return (
    <section
      className="admin-announcement-manager"
      id="announcements"
      aria-labelledby="announcement-manager-title"
    >
      <div className="admin-announcement-heading">
        <div>
          <span className="admin-tool-label">COMMUNITY UPDATES</span>
          <h3 id="announcement-manager-title">Compose an announcement</h3>
          <p>
            Published announcements appear on the public landing page and are
            emailed to residents who opted in.
          </p>
        </div>
      </div>

      <div className="admin-announcement-compose" id="announcement-composer">
        <form action={formAction} className="admin-announcement-form">
          <label>
            <span>Title</span>
            <input
              maxLength={160}
              name="title"
              placeholder="Announcement title"
              required
            />
          </label>
          <label>
            <span>Message</span>
            <textarea
              maxLength={5000}
              name="body"
              placeholder="Write the announcement for residents"
              required
              rows={5}
            />
          </label>
          <button disabled={pending} type="submit">
            {pending ? "Publishing and sending..." : "Publish and notify subscribers"}
          </button>
        </form>
      </div>

      {state.error && (
        <p className="announcement-action-message error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="announcement-action-message success" role="status">
          {state.success}
        </p>
      )}
      {state.warning && (
        <p className="announcement-action-message warning" role="alert">
          {state.warning}
        </p>
      )}
      {error && (
        <p className="announcement-action-message error" role="alert">
          Could not load announcements: {error}
        </p>
      )}

      <div className="admin-announcement-list">
        <h4>Published announcements ({announcements.length})</h4>
        {announcements.length === 0 ? (
          <p className="admin-announcement-empty">
            No announcements have been published yet.
          </p>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementRow
              announcement={announcement}
              key={announcement.id}
            />
          ))
        )}
      </div>
    </section>
  );
}

function AnnouncementRow({
  announcement,
}: {
  announcement: Announcement;
}) {
  const updateAction = updateAnnouncement.bind(null, announcement.id);
  const deleteAction = deleteAnnouncement.bind(null, announcement.id);
  const retryAction = retryAnnouncementEmails.bind(null, announcement.id);
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction,
    initialState,
  );
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAction,
    initialState,
  );
  const [retryState, retryFormAction, retryPending] = useActionState(
    retryAction,
    initialState,
  );

  return (
    <article className="admin-announcement-item">
      <div className="admin-announcement-item-heading">
        <span>{announcement.email_status === "sent" ? "Email sent" : `Email ${announcement.email_status}`}</span>
        <time dateTime={announcement.published_at}>
          {new Intl.DateTimeFormat("en-PH", {
            dateStyle: "medium",
            timeZone: "Asia/Manila",
          }).format(new Date(announcement.published_at))}
        </time>
      </div>
      <form action={updateFormAction} className="admin-announcement-form">
        <label>
          <span>Title</span>
          <input
            defaultValue={announcement.title}
            maxLength={160}
            name="title"
            required
          />
        </label>
        <label>
          <span>Message</span>
          <textarea
            defaultValue={announcement.body}
            maxLength={5000}
            name="body"
            required
            rows={4}
          />
        </label>
        <button disabled={updatePending} type="submit">
          {updatePending ? "Saving..." : "Save edits"}
        </button>
      </form>
      {updateState.error && (
        <p className="announcement-action-message error" role="alert">
          {updateState.error}
        </p>
      )}
      {updateState.success && (
        <p className="announcement-action-message success" role="status">
          {updateState.success}
        </p>
      )}
      {announcement.email_status !== "sent" && (
        <form action={retryFormAction}>
          <button
            className="admin-announcement-retry"
            disabled={retryPending}
            type="submit"
          >
            {retryPending ? "Retrying..." : "Retry email notification"}
          </button>
        </form>
      )}
      {retryState.error && (
        <p className="announcement-action-message error" role="alert">
          {retryState.error}
        </p>
      )}
      {retryState.success && (
        <p className="announcement-action-message success" role="status">
          {retryState.success}
        </p>
      )}
      {announcement.email_error && announcement.email_status === "failed" && (
        <p className="announcement-action-message warning" role="alert">
          {announcement.email_error}
        </p>
      )}
      <form
        action={deleteFormAction}
        className="admin-announcement-delete-form"
        onSubmit={(event) => {
          if (!window.confirm("Delete this announcement from the public landing page?")) {
            event.preventDefault();
          }
        }}
      >
        <button className="admin-announcement-delete" disabled={deletePending} type="submit">
          {deletePending ? "Deleting..." : "Delete announcement"}
        </button>
      </form>
      {deleteState.error && (
        <p className="announcement-action-message error" role="alert">
          {deleteState.error}
        </p>
      )}
      {deleteState.success && (
        <p className="announcement-action-message success" role="status">
          {deleteState.success}
        </p>
      )}
    </article>
  );
}
