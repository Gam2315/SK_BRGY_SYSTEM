"use server";

import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const MAX_REPORTER_NAME_LENGTH = 120;
const MAX_CONCERN_LENGTH = 5000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const CONCERN_REPORT_IMAGE_BUCKET = "concern-report-images";
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ConcernReportActionState = {
  error?: string;
  success?: string;
};

export async function submitConcernReport(
  _previousState: ConcernReportActionState,
  formData: FormData,
): Promise<ConcernReportActionState> {
  const rawName = formData.get("reporter_name");
  const rawConcern = formData.get("concern");
  const rawImage = formData.get("image");

  if (typeof rawName !== "string" || typeof rawConcern !== "string") {
    return { error: "Complete the concern details before submitting." };
  }

  const reporterName = rawName.trim();
  const concern = rawConcern.trim();

  if (!concern) {
    return { error: "Please describe your concern before submitting." };
  }

  if (
    reporterName.length > MAX_REPORTER_NAME_LENGTH ||
    concern.length > MAX_CONCERN_LENGTH
  ) {
    return {
      error:
        "Your name must be 120 characters or fewer and your concern must be 5,000 characters or fewer.",
    };
  }

  if (rawImage !== null && !(rawImage instanceof File)) {
    return { error: "Choose a JPG, PNG, or WebP picture to attach." };
  }

  const image = rawImage instanceof File && rawImage.size > 0 ? rawImage : null;

  if (image && !Object.hasOwn(ALLOWED_IMAGE_TYPES, image.type)) {
    return { error: "Pictures must be JPG, PNG, or WebP files." };
  }

  if (image && image.size > MAX_IMAGE_SIZE) {
    return { error: "The attached picture must be 5 MB or smaller." };
  }

  if (!getSupabaseConfig()) {
    return {
      error:
        "Concern reports are temporarily unavailable. Please contact the barangay office.",
    };
  }

  const supabase = await createClient();
  let imagePath: string | null = null;

  if (image) {
    const extension = ALLOWED_IMAGE_TYPES[image.type];
    imagePath = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(CONCERN_REPORT_IMAGE_BUCKET)
      .upload(imagePath, image, {
        contentType: image.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Could not upload concern report picture:", uploadError.message);
      return {
        error:
          "The picture could not be uploaded. Please try again or submit your concern without it.",
      };
    }
  }

  const { error } = await supabase.from("concern_reports").insert({
    reporter_name: reporterName || null,
    concern,
    image_path: imagePath,
  });

  if (error) {
    console.error("Could not save concern report:", error.message);
    if (imagePath) {
      const { error: cleanupError } = await supabase.storage
        .from(CONCERN_REPORT_IMAGE_BUCKET)
        .remove([imagePath]);
      if (cleanupError) {
        console.error(
          "Could not remove picture from failed concern report:",
          cleanupError.message,
        );
      }
    }
    return {
      error:
        "Your concern could not be sent right now. Please try again or contact the barangay office.",
    };
  }

  return { success: "Your concern was sent to the barangay. Thank you." };
}
