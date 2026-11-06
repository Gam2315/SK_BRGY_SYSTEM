"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/supabase/activity-logs";
import { isPortalAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const COMMUNITY_POST_IMAGE_BUCKET = "community-post-images";
const MAX_COMMUNITY_POST_IMAGES = 3;
const MAX_COMMUNITY_POST_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_COMMUNITY_POST_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type CommunityPostActionState = {
  error?: string;
  success?: string;
};

async function getAdministrator() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Could not verify community post administrator:", error.message);
    return { error: "Could not verify your session. Sign in again." } as const;
  }

  if (!data.user?.id || !(await isPortalAdmin(supabase))) {
    return {
      error: "Only portal administrators can manage activities and projects.",
    } as const;
  }

  return { supabase, user: data.user } as const;
}

function readPostFields(formData: FormData) {
  const kindValue = formData.get("kind");
  const titleValue = formData.get("title");
  const bodyValue = formData.get("body");
  const dateValue = formData.get("activity_date");
  const kind =
    kindValue === "activity" || kindValue === "project" ? kindValue : null;
  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  const body = typeof bodyValue === "string" ? bodyValue.trim() : "";
  const activityDate =
    typeof dateValue === "string" ? dateValue.trim() : "";
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(activityDate)
    ? new Date(`${activityDate}T00:00:00.000Z`)
    : null;

  if (
    !kind ||
    !title ||
    title.length > 160 ||
    !body ||
    body.length > 5000 ||
    !parsedDate ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== activityDate
  ) {
    return {
      error:
        "Choose a post type, enter a title (up to 160 characters), description (up to 5,000 characters), and valid date.",
    } as const;
  }

  return { kind, title, body, activityDate } as const;
}

function readPostImages(formData: FormData) {
  const values = formData.getAll("images");
  if (values.some((value) => !(value instanceof File))) {
    return { error: "Choose valid image files to upload." } as const;
  }

  const files = values
    .filter((value): value is File => value instanceof File)
    .filter((value) => value.size > 0);
  if (files.length > MAX_COMMUNITY_POST_IMAGES) {
    return {
      error: `Attach up to ${MAX_COMMUNITY_POST_IMAGES} pictures per post.`,
    } as const;
  }

  for (const file of files) {
    if (!Object.hasOwn(ALLOWED_COMMUNITY_POST_IMAGE_TYPES, file.type)) {
      return {
        error: "Pictures must be JPG, PNG, or WebP files.",
      } as const;
    }

    if (file.size > MAX_COMMUNITY_POST_IMAGE_SIZE) {
      return {
        error: "Each picture must be 4 MB or smaller.",
      } as const;
    }
  }

  return { files } as const;
}

async function uploadPostImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  files: File[],
) {
  const paths: string[] = [];

  for (const file of files) {
    const extension = ALLOWED_COMMUNITY_POST_IMAGE_TYPES[file.type];
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from(COMMUNITY_POST_IMAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      console.error("Could not upload community post picture:", error.message);
      if (paths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from(COMMUNITY_POST_IMAGE_BUCKET)
          .remove(paths);
        if (cleanupError) {
          console.error(
            "Could not remove incomplete community post pictures:",
            cleanupError.message,
          );
          return {
            error:
              "A picture upload failed and temporary pictures could not be removed. Contact the site administrator.",
          } as const;
        }
      }

      return {
        error: `A picture could not be uploaded: ${error.message}`,
      } as const;
    }

    paths.push(path);
  }

  return { paths } as const;
}

export async function publishCommunityPost(
  _previousState: CommunityPostActionState,
  formData: FormData,
): Promise<CommunityPostActionState> {
  const fields = readPostFields(formData);
  if ("error" in fields) return fields;
  const images = readPostImages(formData);
  if ("error" in images) return images;

  const administrator = await getAdministrator();
  if ("error" in administrator) return administrator;

  const uploadedImages = await uploadPostImages(
    administrator.supabase,
    images.files,
  );
  if ("error" in uploadedImages) return uploadedImages;

  const { data, error } = await administrator.supabase
    .from("community_posts")
    .insert({
      kind: fields.kind,
      title: fields.title,
      body: fields.body,
      activity_date: fields.activityDate,
      image_paths: uploadedImages.paths,
      created_by: administrator.user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Could not publish community post:", error?.message);
    if (uploadedImages.paths.length > 0) {
      const { error: cleanupError } = await administrator.supabase.storage
        .from(COMMUNITY_POST_IMAGE_BUCKET)
        .remove(uploadedImages.paths);
      if (cleanupError) {
        console.error(
          "Could not remove pictures for the unpublished community post:",
          cleanupError.message,
        );
        return {
          error:
            "The post could not be published and its uploaded pictures could not be removed. Contact the site administrator.",
        };
      }
    }

    return {
      error: `Could not publish post${error?.code ? ` (${error.code})` : ""}. Confirm the community posts setup SQL has been run.`,
    };
  }

  await recordActivity(administrator.supabase, administrator.user, {
    action: "Community post published",
    summary: `Published a ${fields.kind} post: ${fields.title}.`,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: "Post published on the public landing page." };
}

export async function updateCommunityPost(
  postId: string,
  _previousState: CommunityPostActionState,
  formData: FormData,
): Promise<CommunityPostActionState> {
  const fields = readPostFields(formData);
  if ("error" in fields) return fields;

  const administrator = await getAdministrator();
  if ("error" in administrator) return administrator;

  const { data, error } = await administrator.supabase
    .from("community_posts")
    .update({
      kind: fields.kind,
      title: fields.title,
      body: fields.body,
      activity_date: fields.activityDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Could not update community post:", error?.message);
    return { error: "Could not save post changes." };
  }

  await recordActivity(administrator.supabase, administrator.user, {
    action: "Community post updated",
    summary: `Updated a community post: ${fields.title}.`,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: "Post updated." };
}

export async function deleteCommunityPost(
  postId: string,
  _previousState: CommunityPostActionState,
  _formData: FormData,
): Promise<CommunityPostActionState> {
  void _previousState;
  void _formData;

  const administrator = await getAdministrator();
  if ("error" in administrator) return administrator;

  const { data, error } = await administrator.supabase
    .from("community_posts")
    .delete()
    .eq("id", postId)
    .select("id, image_paths")
    .maybeSingle();

  if (error || !data) {
    console.error("Could not delete community post:", error?.message);
    return { error: "Could not delete post." };
  }

  if (data.image_paths.length > 0) {
    const { error: storageError } = await administrator.supabase.storage
      .from(COMMUNITY_POST_IMAGE_BUCKET)
      .remove(data.image_paths);
    if (storageError) {
      console.error(
        "Post was deleted but its pictures could not be removed:",
        storageError.message,
      );
      revalidatePath("/");
      revalidatePath("/admin");
      return {
        error:
          "The post was deleted, but its pictures could not be removed from storage. Contact the site administrator.",
      };
    }
  }

  await recordActivity(administrator.supabase, administrator.user, {
    action: "Community post deleted",
    summary: "Deleted an activity or completed project post.",
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: "Post deleted." };
}
