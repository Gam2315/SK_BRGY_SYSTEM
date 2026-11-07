"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/supabase/activity-logs";
import { isPortalAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidPhilippinePhoneNumber } from "@/lib/philippine-phone";

const OFFICIAL_PHOTO_BUCKET = "barangay-official-photos";
const MAX_OFFICIAL_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_OFFICIAL_PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type BarangayOfficialActionState = {
  error?: string;
  success?: string;
  warning?: string;
};

export async function updateBarangayOfficial(
  officialId: string,
  _previousState: BarangayOfficialActionState,
  formData: FormData,
): Promise<BarangayOfficialActionState> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(officialId)) {
    return { error: "This official record is invalid. Refresh and try again." };
  }

  const fullNameValue = formData.get("full_name");
  const phoneValue = formData.get("phone");
  const emailValue = formData.get("email");
  const publishedValue = formData.get("is_published");
  const photoValue = formData.get("photo");
  const fullName = typeof fullNameValue === "string" ? fullNameValue.trim() : "";
  const phone = typeof phoneValue === "string" ? phoneValue.trim() : "";
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const isPublished = publishedValue === "true";
  const photo =
    photoValue instanceof File && photoValue.size > 0 ? photoValue : null;
  if (
    fullName.length > 120 ||
    phone.length > 40 ||
    (phone !== "" && !isValidPhilippinePhoneNumber(phone)) ||
    email.length > 254 ||
    (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    return {
      error:
        "Enter a name up to 120 characters, a valid Philippine phone number starting with +63, and a valid email address.",
    };
  }

  if (isPublished && !fullName) {
    return {
      error: "Enter the official's name before publishing their details.",
    };
  }

  if (
    photo &&
    (!Object.hasOwn(ALLOWED_OFFICIAL_PHOTO_TYPES, photo.type) ||
      photo.size > MAX_OFFICIAL_PHOTO_SIZE)
  ) {
    return {
      error: "Profile pictures must be JPG, PNG, or WebP files up to 5 MB.",
    };
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("Could not verify barangay official administrator:", authError.message);
    return { error: "Could not verify your session. Sign in again and retry." };
  }

  if (!auth.user?.id || !(await isPortalAdmin(supabase))) {
    return { error: "Only portal administrators can manage barangay officials." };
  }

  const { data: currentOfficial, error: currentOfficialError } = await supabase
    .from("barangay_officials")
    .select("photo_path")
    .eq("id", officialId)
    .maybeSingle();

  if (currentOfficialError || !currentOfficial) {
    console.error(
      "Could not load barangay official before update:",
      currentOfficialError?.message,
    );
    return { error: "Could not load this official. Refresh and try again." };
  }

  let uploadedPhotoPath: string | null = null;
  if (photo) {
    const extension = ALLOWED_OFFICIAL_PHOTO_TYPES[photo.type];
    uploadedPhotoPath = `${officialId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(OFFICIAL_PHOTO_BUCKET)
      .upload(uploadedPhotoPath, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Could not upload barangay official profile picture:", uploadError.message);
      return {
        error:
          "Could not upload the profile picture. Confirm the barangay officials setup SQL has been run.",
      };
    }
  }

  const { data, error } = await supabase
    .from("barangay_officials")
    .update({
      full_name: fullName || null,
      phone: phone || null,
      email: email || null,
      ...(uploadedPhotoPath ? { photo_path: uploadedPhotoPath } : {}),
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", officialId)
    .select("id, position")
    .maybeSingle();

  if (error || !data) {
    console.error("Could not update barangay official:", error?.message);
    if (uploadedPhotoPath) {
      const { error: cleanupError } = await supabase.storage
        .from(OFFICIAL_PHOTO_BUCKET)
        .remove([uploadedPhotoPath]);
      if (cleanupError) {
        console.error(
          "Could not remove the profile picture after the official update failed:",
          cleanupError.message,
        );
      }
    }
    return {
      error:
        "Could not save official details. Confirm the barangay officials setup SQL has been run.",
    };
  }

  let photoCleanupWarning: string | undefined;
  if (uploadedPhotoPath && currentOfficial.photo_path) {
    const { error: removeError } = await supabase.storage
      .from(OFFICIAL_PHOTO_BUCKET)
      .remove([currentOfficial.photo_path]);
    if (removeError) {
      console.error(
        "Official details were saved but the previous profile picture could not be removed:",
        removeError.message,
      );
      photoCleanupWarning =
        "The new profile picture was saved, but the previous file could not be removed.";
    }
  }

  await recordActivity(supabase, auth.user, {
    action: "Barangay official updated",
    summary: `${isPublished ? "Published" : "Saved"} details for ${data.position}.`,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return {
    success: isPublished
      ? "Official details saved and published on the public portal."
      : "Official details saved. They are not shown on the public portal.",
    warning: photoCleanupWarning,
  };
}
