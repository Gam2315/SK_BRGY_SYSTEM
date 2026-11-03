"use client";

import { useActionState } from "react";
import {
  updateAnnouncementSubscription,
  type AnnouncementActionState,
} from "@/app/actions/announcements";

export default function ResidentAnnouncementSubscription({
  subscribed,
  error,
}: {
  subscribed: boolean;
  error?: string;
}) {
  const [state, formAction, pending] = useActionState<
    AnnouncementActionState,
    FormData
  >(updateAnnouncementSubscription, {});

  return (
    <section className="resident-announcement-preferences">
      <div>
        <strong>Email announcement notifications</strong>
        <p>
          Choose whether to receive new barangay announcements at your
          confirmed account email.
        </p>
      </div>
      <form action={formAction}>
        <label>
          <input
            defaultChecked={subscribed}
            name="subscribed"
            type="checkbox"
          />
          <span>Send announcements to my email</span>
        </label>
        <button disabled={pending} type="submit">
          {pending ? "Saving..." : "Save preference"}
        </button>
      </form>
      {(state.error || error) && (
        <p className="announcement-action-message error" role="alert">
          {state.error ?? error}
        </p>
      )}
      {state.success && (
        <p className="announcement-action-message success" role="status">
          {state.success}
        </p>
      )}
    </section>
  );
}
