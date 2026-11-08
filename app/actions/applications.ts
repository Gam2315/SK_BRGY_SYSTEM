"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/supabase/activity-logs";
import { createClient } from "@/lib/supabase/server";
import { isValidPhilippinePhoneNumber } from "@/lib/philippine-phone";
import {
  civilStatusOptions,
  educationalAttainmentOptions,
  registeredVoterOptions,
  religionOptions,
  workStatusOptions,
  youthAgeGroupOptions,
  youthClassificationOptions,
} from "@/lib/education-application-options";
import type {
  BarangayZone,
  EducationLevel,
} from "@/lib/supabase/database.types";

const APPLICATION_DOCUMENT_BUCKET = "application-documents";
const MAX_APPLICATION_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_APPLICATION_FILE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export type ApplicationFormState = {
  error?: string;
  success?: string;
};

type ApplicationDocument = {
  field: string;
  key: string;
  file: File;
};

function getRequiredField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalField(formData: FormData, name: string) {
  return getRequiredField(formData, name) || null;
}

function isEducationLevel(value: string): value is EducationLevel {
  return value === "high_school" || value === "college";
}

function isBarangayZone(value: string): value is BarangayZone {
  return /^Zone [1-7]$/.test(value);
}

function isOption<T extends readonly string[]>(
  value: string,
  options: T,
): value is T[number] {
  return options.some((option) => option === value);
}

function getRequiredFile(formData: FormData, name: string) {
  const value = formData.get(name);

  if (!(value instanceof File) || value.size === 0) {
    return { error: "Please attach all required documents." } as const;
  }

  if (!Object.hasOwn(ALLOWED_APPLICATION_FILE_TYPES, value.type)) {
    return {
      error: "Upload documents as JPG, PNG, WebP, or PDF files.",
    } as const;
  }

  if (value.size > MAX_APPLICATION_FILE_SIZE) {
    return { error: "Each document must be 5 MB or smaller." } as const;
  }

  return { file: value } as const;
}

async function removeUploadedDocuments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
) {
  if (paths.length === 0) {
    return false;
  }

  const { error } = await supabase.storage
    .from(APPLICATION_DOCUMENT_BUCKET)
    .remove(paths);

  if (error) {
    console.error("Could not remove incomplete application documents:", error.message);
    return true;
  }

  return false;
}

async function uploadApplicationDocuments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  documents: ApplicationDocument[],
) {
  const paths: string[] = [];
  const storedPaths: Record<string, string> = {};

  for (const document of documents) {
    const extension = ALLOWED_APPLICATION_FILE_TYPES[document.file.type];
    const path = `${userId}/${crypto.randomUUID()}-${document.key}.${extension}`;
    const { error } = await supabase.storage
      .from(APPLICATION_DOCUMENT_BUCKET)
      .upload(path, document.file, {
        contentType: document.file.type,
        upsert: false,
      });

    if (error) {
      console.error(`Could not upload ${document.key} document:`, error.message);
      const cleanupFailed = await removeUploadedDocuments(supabase, paths);
      return {
        error: cleanupFailed
          ? "A document upload failed and temporary files could not be removed. Contact the barangay office."
          : `A document could not be uploaded: ${error.message}`,
      } as const;
    }

    paths.push(path);
    storedPaths[document.field] = path;
  }

  return { paths, storedPaths } as const;
}

async function getApplicant() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error) {
    console.error("Could not verify applicant session:", error.message);
  }

  if (!user?.id || !user.email) {
    return {
      error: "Please sign in with a confirmed account before applying.",
    } as const;
  }

  return { supabase, user: { ...user, email: user.email } } as const;
}

export async function submitEducationalAssistanceApplication(
  _previousState: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const applicantName = getRequiredField(formData, "applicant_name");
  const contactNumber = getOptionalField(formData, "contact_number");
  const zone = getRequiredField(formData, "zone");
  const religion = getRequiredField(formData, "religion");
  const religionOther = getOptionalField(formData, "religion_other");
  const civilStatus = getRequiredField(formData, "civil_status");
  const youthAgeGroup = getRequiredField(formData, "youth_age_group");
  const youthClassification = getRequiredField(
    formData,
    "youth_classification",
  );
  const workStatus = getRequiredField(formData, "work_status");
  const educationalAttainment = getRequiredField(
    formData,
    "educational_attainment",
  );
  const registeredVoter = getRequiredField(formData, "registered_voter");
  const educationLevel = getRequiredField(formData, "education_level");
  const schoolName = getRequiredField(formData, "school_name");
  const yearOrGradeLevel = getRequiredField(formData, "year_or_grade_level");
  const schoolAssessment = getRequiredFile(formData, "school_assessment");
  const schoolIdFront = getRequiredFile(formData, "school_id_front");
  const schoolIdBack = getRequiredFile(formData, "school_id_back");

  if (!applicantName || !schoolName) {
    return { error: "Complete all required fields before submitting." };
  }

  if (!isBarangayZone(zone)) {
    return { error: "Select a valid zone (Zone 1 through Zone 7)." };
  }

  if (
    !isOption(religion, religionOptions) ||
    !isOption(civilStatus, civilStatusOptions) ||
    !isOption(youthAgeGroup, youthAgeGroupOptions) ||
    !isOption(youthClassification, youthClassificationOptions) ||
    !isOption(workStatus, workStatusOptions) ||
    !isOption(educationalAttainment, educationalAttainmentOptions) ||
    !isOption(registeredVoter, registeredVoterOptions)
  ) {
    return {
      error: "Select a valid option for each required demographic field.",
    };
  }

  const isGraduate =
    educationalAttainment === "College Graduate" ||
    educationalAttainment === "Doctorate Graduate";
  let validatedEducationLevel: EducationLevel | null = null;
  if (isGraduate) {
    if (educationLevel || yearOrGradeLevel) {
      return {
        error:
          "Education level and year or grade must be omitted for college and doctorate graduates.",
      };
    }
  } else {
    if (!isEducationLevel(educationLevel) || !yearOrGradeLevel) {
      return {
        error: "Select an education level and year or grade before submitting.",
      };
    }
    if (
      educationalAttainment === "Highschool Graduate" &&
      educationLevel !== "college"
    ) {
      return {
        error:
          "Highschool graduates can only select college as their education level.",
      };
    }
    validatedEducationLevel = educationLevel;
  }

  if (
    (religion === "Other" &&
      (!religionOther || religionOther.length > 100)) ||
    (religion !== "Other" && religionOther)
  ) {
    return {
      error:
        'Specify your religion when selecting "Other" (maximum 100 characters).',
    };
  }

  if ("error" in schoolAssessment) {
    return { error: `School assessment: ${schoolAssessment.error}` };
  }

  if ("error" in schoolIdFront) {
    return { error: `School ID front: ${schoolIdFront.error}` };
  }

  if ("error" in schoolIdBack) {
    return { error: `School ID back: ${schoolIdBack.error}` };
  }

  if (
    applicantName.length > 150 ||
    schoolName.length > 200 ||
    yearOrGradeLevel.length > 80 ||
    (contactNumber &&
      (contactNumber.length > 40 ||
        !isValidPhilippinePhoneNumber(contactNumber)))
  ) {
    return {
      error:
        "Check the information you entered. Contact numbers must use +63 followed by a valid Philippine number.",
    };
  }

  const applicant = await getApplicant();

  if ("error" in applicant) {
    return { error: applicant.error };
  }

  const { data: settings, error: settingsError } = await applicant.supabase
    .from("educational_assistance_settings")
    .select("is_open")
    .eq("id", true)
    .single();

  if (settingsError) {
    console.error(
      "Could not verify educational assistance application availability:",
      settingsError.message,
    );
    return {
      error:
        "Application availability could not be verified. Please try again later or contact the barangay office.",
    };
  }

  if (!settings?.is_open) {
    return {
      error: "Educational assistance applications are currently closed.",
    };
  }

  const uploads = await uploadApplicationDocuments(
    applicant.supabase,
    applicant.user.id,
    [
      {
        field: "school_assessment_path",
        key: "school-assessment",
        file: schoolAssessment.file,
      },
      {
        field: "school_id_front_path",
        key: "school-id-front",
        file: schoolIdFront.file,
      },
      {
        field: "school_id_back_path",
        key: "school-id-back",
        file: schoolIdBack.file,
      },
    ],
  );

  if ("error" in uploads) {
    return { error: uploads.error };
  }

  const { error } = await applicant.supabase
    .from("educational_assistance_applications")
    .insert({
      user_id: applicant.user.id,
      applicant_name: applicantName,
      applicant_email: applicant.user.email,
      contact_number: contactNumber,
      zone,
      religion,
      religion_other: religionOther,
      civil_status: civilStatus,
      youth_age_group: youthAgeGroup,
      youth_classification: youthClassification,
      work_status: workStatus,
      educational_attainment: educationalAttainment,
      registered_voter: registeredVoter,
      education_level: validatedEducationLevel,
      school_name: schoolName,
      year_or_grade_level: isGraduate ? null : yearOrGradeLevel,
      school_assessment_path: uploads.storedPaths.school_assessment_path,
      school_id_front_path: uploads.storedPaths.school_id_front_path,
      school_id_back_path: uploads.storedPaths.school_id_back_path,
      status: "Pending",
    });

  if (error) {
    console.error("Could not submit educational assistance application:", error.message);
    const cleanupFailed = await removeUploadedDocuments(
      applicant.supabase,
      uploads.paths,
    );
    return {
      error: cleanupFailed
        ? "Your application could not be saved and uploaded documents could not be removed. Contact the barangay office."
        : error.code === "P0001"
          ? "Educational assistance applications are currently closed."
          : `Application save failed (${error.code}): ${error.message}`,
    };
  }

  await recordActivity(applicant.supabase, applicant.user, {
    action: "Application submitted",
    summary: "Submitted an educational assistance application.",
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: "Your educational assistance application was submitted." };
}

export async function submitJobseekerApplication(
  _previousState: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const applicantName = getRequiredField(formData, "applicant_name");
  const contactNumber = getOptionalField(formData, "contact_number");
  const desiredPosition = getRequiredField(formData, "desired_position");
  const skillsExperience = getOptionalField(formData, "skills_experience");
  const validIdFront = getRequiredFile(formData, "valid_id_front");
  const validIdBack = getRequiredFile(formData, "valid_id_back");

  if (!applicantName || !desiredPosition) {
    return { error: "Complete all required fields before submitting." };
  }

  if ("error" in validIdFront) {
    return {
      error: `Valid ID front: ${validIdFront.error}`,
    };
  }

  if ("error" in validIdBack) {
    return { error: `Valid ID back: ${validIdBack.error}` };
  }

  if (
    applicantName.length > 150 ||
    desiredPosition.length > 150 ||
    (contactNumber &&
      (contactNumber.length > 40 ||
        !isValidPhilippinePhoneNumber(contactNumber))) ||
    (skillsExperience && skillsExperience.length > 2000)
  ) {
    return {
      error:
        "Check the information you entered. Contact numbers must use +63 followed by a valid Philippine number.",
    };
  }

  const applicant = await getApplicant();

  if ("error" in applicant) {
    return { error: applicant.error };
  }

  const uploads = await uploadApplicationDocuments(
    applicant.supabase,
    applicant.user.id,
    [
      {
        field: "valid_id_front_path",
        key: "valid-id-front",
        file: validIdFront.file,
      },
      {
        field: "valid_id_back_path",
        key: "valid-id-back",
        file: validIdBack.file,
      },
    ],
  );

  if ("error" in uploads) {
    return { error: uploads.error };
  }

  const { error } = await applicant.supabase
    .from("jobseeker_applications")
    .insert({
      user_id: applicant.user.id,
      applicant_name: applicantName,
      applicant_email: applicant.user.email,
      contact_number: contactNumber,
      desired_position: desiredPosition,
      skills_experience: skillsExperience,
      valid_id_front_path: uploads.storedPaths.valid_id_front_path,
      valid_id_back_path: uploads.storedPaths.valid_id_back_path,
      status: "Pending",
    });

  if (error) {
    console.error("Could not submit jobseeker application:", error.message);
    const cleanupFailed = await removeUploadedDocuments(
      applicant.supabase,
      uploads.paths,
    );
    return {
      error: cleanupFailed
        ? "Your application could not be saved and uploaded documents could not be removed. Contact the barangay office."
        : `Application save failed (${error.code}): ${error.message}`,
    };
  }

  await recordActivity(applicant.supabase, applicant.user, {
    action: "Application submitted",
    summary: "Submitted a jobseeker application.",
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: "Your jobseeker application was submitted." };
}
