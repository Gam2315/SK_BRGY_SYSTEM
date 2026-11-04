"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/supabase/activity-logs";
import { isAdminEmail } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AnnouncementActionState = {
  error?: string;
  success?: string;
  warning?: string;
};

async function getAdministrator() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Could not verify announcement administrator:", error.message);
    return { error: "Could not verify your session. Sign in again." } as const;
  }

  if (!data.user?.id || !data.user.email || !isAdminEmail(data.user.email)) {
    return { error: "Only the configured portal administrator can manage announcements." } as const;
  }

  return { supabase, user: data.user } as const;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

async function deliverAnnouncementEmails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  announcement: { id: string; title: string; body: string },
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ANNOUNCEMENT_FROM_EMAIL;
  let emailStatus: "sent" | "failed" = "sent";
  let emailError: string | null = null;

  try {
    if (!apiKey || !from) {
      throw new Error(
        "Set RESEND_API_KEY and ANNOUNCEMENT_FROM_EMAIL in the deployment environment.",
      );
    }

    const { data: subscribers, error: subscribersError } = await supabase
      .from("announcement_subscribers")
      .select("email")
      .eq("subscribed", true);

    if (subscribersError) {
      throw new Error(`Could not load subscribed residents: ${subscribersError.message}`);
    }

    const emails = [
      ...new Set(
        (subscribers ?? [])
          .map(({ email }) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    const escapedTitle = escapeHtml(announcement.title);
    const escapedBody = escapeHtml(announcement.body);
    const text = `${announcement.title}\n\n${announcement.body}`;
    const html = `<main style="font-family:Arial,sans-serif;line-height:1.6;color:#17232f"><h1>${escapedTitle}</h1><p style="white-space:pre-wrap">${escapedBody}</p><p style="font-size:12px;color:#687279">You received this message because you subscribed to Barangay Centro Norte announcements. You can change your email preferences from your resident dashboard.</p></main>`;

    for (let start = 0; start < emails.length; start += 100) {
      const batch = emails.slice(start, start + 100).map((email) => ({
        from,
        to: [email],
        subject: `Barangay Centro Norte: ${announcement.title}`,
        html,
        text,
      }));
      const response = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Email provider returned ${response.status}: ${detail.slice(0, 500)}`);
      }
    }

    return {
      emailStatus,
      emailError,
      sentCount: emails.length,
    };
  } catch (error) {
    emailStatus = "failed";
    emailError =
      error instanceof Error ? error.message.slice(0, 1000) : "Unknown email delivery error.";
    console.error("Announcement email delivery failed:", emailError);
    return { emailStatus, emailError, sentCount: 0 };
  }
}

async function sendAnnouncementEmails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  announcement: { id: string; title: string; body: string },
) {
  const delivery = await deliverAnnouncementEmails(supabase, announcement);
  const { error } = await supabase
    .from("announcements")
    .update({
      email_status: delivery.emailStatus,
      email_sent_at: delivery.emailStatus === "sent" ? new Date().toISOString() : null,
      email_error: delivery.emailError,
      updated_at: new Date().toISOString(),
    })
    .eq("id", announcement.id);

  if (error) {
    console.error("Could not save announcement email status:", error.message);
    return {
      ...delivery,
      emailStatus: "failed" as const,
      emailError: "Announcement saved, but its email delivery status could not be saved.",
    };
  }

  return delivery;
}

export async function publishAnnouncement(
  _previousState: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  const titleValue = formData.get("title");
  const bodyValue = formData.get("body");
  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  const body = typeof bodyValue === "string" ? bodyValue.trim() : "";

  if (!title || title.length > 160 || !body || body.length > 5000) {
    return { error: "Enter a title (up to 160 characters) and message (up to 5,000 characters)." };
  }

  const administrator = await getAdministrator();
  if ("error" in administrator) {
    return { error: administrator.error };
  }

  const { data: announcement, error } = await administrator.supabase
    .from("announcements")
    .insert({
      title,
      body,
      created_by: administrator.user.id,
      published_at: new Date().toISOString(),
      email_status: "pending",
      email_sent_at: null,
      email_error: null,
    })
    .select("id, title, body")
    .single();

  if (error || !announcement) {
    console.error("Could not publish announcement:", error?.message);
    return {
      error: `Could not publish announcement${error?.code ? ` (${error.code})` : ""}. Confirm the latest announcement setup SQL has been run.`,
    };
  }

  await recordActivity(administrator.supabase, administrator.user, {
    action: "Announcement published",
    summary: "Published a community announcement.",
  });

  const delivery = await sendAnnouncementEmails(administrator.supabase, announcement);
  revalidatePath("/");
  revalidatePath("/admin");

  if (delivery.emailStatus === "failed") {
    return {
      success: "Announcement published on the public landing page.",
      warning: `Email notification failed: ${delivery.emailError} Use Retry email in the announcement list after correcting the email setup.`,
    };
  }

  return {
    success: `Announcement published. Email notification sent to ${delivery.sentCount} subscribed resident${delivery.sentCount === 1 ? "" : "s"}.`,
  };
}

export async function updateAnnouncement(
  announcementId: string,
  _previousState: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  const titleValue = formData.get("title");
  const bodyValue = formData.get("body");
  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  const body = typeof bodyValue === "string" ? bodyValue.trim() : "";

  if (!title || title.length > 160 || !body || body.length > 5000) {
    return { error: "Enter a title (up to 160 characters) and message (up to 5,000 characters)." };
  }

  const administrator = await getAdministrator();
  if ("error" in administrator) {
    return { error: administrator.error };
  }

  const { data, error } = await administrator.supabase
    .from("announcements")
    .update({ title, body, updated_at: new Date().toISOString() })
    .eq("id", announcementId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Could not update announcement:", error?.message);
    return { error: "Could not save announcement changes." };
  }

  await recordActivity(administrator.supabase, administrator.user, {
    action: "Announcement updated",
    summary: "Edited a community announcement.",
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: "Announcement updated. Editing does not send another email." };
}

export async function deleteAnnouncement(
  announcementId: string,
  _previousState: AnnouncementActionState,
  _formData: FormData,
): Promise<AnnouncementActionState> {
  void _previousState;
  void _formData;

  const administrator = await getAdministrator();
  if ("error" in administrator) {
    return { error: administrator.error };
  }

  const { error } = await administrator.supabase
    .from("announcements")
    .delete()
    .eq("id", announcementId);

  if (error) {
    console.error("Could not delete announcement:", error.message);
    return { error: "Could not delete the announcement." };
  }

  await recordActivity(administrator.supabase, administrator.user, {
    action: "Announcement deleted",
    summary: "Deleted a community announcement.",
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: "Announcement deleted." };
}

export async function retryAnnouncementEmails(
  announcementId: string,
  _previousState: AnnouncementActionState,
  _formData: FormData,
): Promise<AnnouncementActionState> {
  void _previousState;
  void _formData;

  const administrator = await getAdministrator();
  if ("error" in administrator) {
    return { error: administrator.error };
  }

  const { data: announcement, error } = await administrator.supabase
    .from("announcements")
    .select("id, title, body")
    .eq("id", announcementId)
    .maybeSingle();

  if (error || !announcement) {
    console.error("Could not load announcement for email retry:", error?.message);
    return { error: "Could not find that announcement." };
  }

  const delivery = await sendAnnouncementEmails(administrator.supabase, announcement);
  revalidatePath("/admin");

  if (delivery.emailStatus === "failed") {
    return { error: `Email retry failed: ${delivery.emailError}` };
  }

  await recordActivity(administrator.supabase, administrator.user, {
    action: "Announcement email retried",
    summary: `Retried announcement email delivery to ${delivery.sentCount} subscribers.`,
  });

  return {
    success: `Email notification sent to ${delivery.sentCount} subscribed resident${delivery.sentCount === 1 ? "" : "s"}.`,
  };
}

export async function updateAnnouncementSubscription(
  _previousState: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  const administrator = await createClient();
  const { data, error } = await administrator.auth.getUser();

  if (error) {
    console.error("Could not verify announcement subscription session:", error.message);
    return { error: "Could not verify your session. Sign in again." };
  }

  if (!data.user?.id || !data.user.email || !data.user.email_confirmed_at) {
    return { error: "Confirm your email address before changing announcement email preferences." };
  }

  const subscribed = formData.get("subscribed") === "on";
  const { error: saveError } = await administrator
    .from("announcement_subscribers")
    .upsert(
      {
        user_id: data.user.id,
        email: data.user.email,
        subscribed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (saveError) {
    console.error("Could not save announcement preference:", saveError.message);
    return { error: "Could not save your email preference. Please try again." };
  }

  await recordActivity(administrator, data.user, {
    action: "Announcement preference updated",
    summary: subscribed
      ? "Subscribed to announcement emails."
      : "Unsubscribed from announcement emails.",
  });

  revalidatePath("/dashboard");
  return {
    success: subscribed
      ? "You are subscribed to barangay announcement emails."
      : "You have unsubscribed from announcement emails.",
  };
}
