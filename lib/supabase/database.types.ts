import type {
  CivilStatus,
  EducationalAttainment,
  RegisteredVoter,
  Religion,
  WorkStatus,
  YouthAgeGroup,
  YouthClassification,
} from "@/lib/education-application-options";

export type EducationLevel = "high_school" | "college";
export type BarangayZone =
  | "Zone 1"
  | "Zone 2"
  | "Zone 3"
  | "Zone 4"
  | "Zone 5"
  | "Zone 6"
  | "Zone 7";

export type EducationalAssistanceApplication = {
  id: string;
  user_id: string | null;
  applicant_name: string;
  applicant_email: string;
  contact_number: string | null;
  zone: BarangayZone | null;
  religion: Religion | null;
  religion_other: string | null;
  civil_status: CivilStatus | null;
  youth_age_group: YouthAgeGroup | null;
  youth_classification: YouthClassification | null;
  work_status: WorkStatus | null;
  educational_attainment: EducationalAttainment | null;
  registered_voter: RegisteredVoter | null;
  education_level: EducationLevel | null;
  school_name: string;
  year_or_grade_level: string | null;
  school_assessment_path: string | null;
  school_id_front_path: string | null;
  school_id_back_path: string | null;
  status: string;
  review_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  archive_batch_id: string | null;
  claim_token?: string | null;
  claimed_at?: string | null;
  claimed_by?: string | null;
  submitted_at: string;
};

export type EducationAssistanceArchiveBatch = {
  id: string;
  name: string;
  archived_at: string;
  archived_by: string;
};

export type EducationAssistanceSettings = {
  id: boolean;
  is_open: boolean;
  updated_at: string;
  updated_by: string | null;
};

export type JobseekerApplication = {
  id: string;
  user_id: string | null;
  applicant_name: string;
  applicant_email: string;
  contact_number: string | null;
  desired_position: string;
  skills_experience: string | null;
  valid_id_front_path: string | null;
  valid_id_back_path: string | null;
  status: string;
  review_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  submitted_at: string;
};

export type ApplicationDocumentLink = {
  label: string;
  url: string;
  isImage: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  published_at: string;
  created_by: string;
  email_status: "pending" | "sent" | "failed";
  email_sent_at: string | null;
  email_error: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  actor_user_id: string | null;
  actor_email: string;
  action: string;
  summary: string;
  created_at: string;
};

export type ConcernReport = {
  id: string;
  reporter_name: string | null;
  concern: string;
  image_path: string | null;
  submitted_at: string;
};

export type CommunityPost = {
  id: string;
  kind: "activity" | "project";
  title: string;
  body: string;
  activity_date: string;
  image_paths: string[];
  created_by: string;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type CommunityPostWithImages = CommunityPost & {
  image_urls: string[];
};

export type BarangayOfficial = {
  id: string;
  position: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  photo_path: string | null;
  is_published: boolean;
  sort_order: number;
  updated_at: string;
};

type EducationalAssistanceApplicationInsert = Omit<
  EducationalAssistanceApplication,
  "id" | "submitted_at" | "review_notes" | "reviewed_at" | "reviewed_by"
    | "archive_batch_id" | "claim_token" | "claimed_at" | "claimed_by"
> & {
  id?: string;
  submitted_at?: string;
  review_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  archive_batch_id?: string | null;
  claim_token?: string | null;
  claimed_at?: string | null;
  claimed_by?: string | null;
};

type JobseekerApplicationInsert = Omit<
  JobseekerApplication,
  "id" | "submitted_at" | "review_notes" | "reviewed_at" | "reviewed_by"
> & {
  id?: string;
  submitted_at?: string;
  review_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

export type Database = {
  public: {
    Tables: {
      educational_assistance_applications: {
        Row: EducationalAssistanceApplication;
        Insert: EducationalAssistanceApplicationInsert;
        Update: Partial<EducationalAssistanceApplicationInsert>;
        Relationships: [];
      };
      education_assistance_archive_batches: {
        Row: EducationAssistanceArchiveBatch;
        Insert: Omit<EducationAssistanceArchiveBatch, "id" | "archived_at"> & {
          id?: string;
          archived_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      educational_assistance_settings: {
        Row: EducationAssistanceSettings;
        Insert: {
          id?: boolean;
          is_open?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<EducationAssistanceSettings>;
        Relationships: [];
      };
      jobseeker_applications: {
        Row: JobseekerApplication;
        Insert: JobseekerApplicationInsert;
        Update: Partial<JobseekerApplicationInsert>;
        Relationships: [];
      };
      portal_admins: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: Partial<{
          user_id: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      announcements: {
        Row: Announcement;
        Insert: Omit<Announcement, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Announcement, "id" | "created_at">>;
        Relationships: [];
      };
      community_posts: {
        Row: CommunityPost;
        Insert: Omit<CommunityPost, "id" | "published_at" | "created_at" | "updated_at"> & {
          id?: string;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<CommunityPost, "id" | "created_at">>;
        Relationships: [];
      };
      barangay_officials: {
        Row: BarangayOfficial;
        Insert: Omit<BarangayOfficial, "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<BarangayOfficial, "id">>;
        Relationships: [];
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      concern_reports: {
        Row: ConcernReport;
        Insert: Omit<ConcernReport, "id" | "submitted_at" | "image_path"> & {
          id?: string;
          submitted_at?: string;
          image_path?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      announcement_subscribers: {
        Row: {
          user_id: string;
          email: string;
          subscribed: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          subscribed?: boolean;
          updated_at?: string;
        };
        Update: Partial<{
          user_id: string;
          email: string;
          subscribed: boolean;
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      archive_education_assistance_applications: {
        Args: {
          p_name: string;
        };
        Returns: {
          batch_id: string;
          archive_name: string;
          archived_at: string;
          application_count: number;
        }[];
      };
      is_portal_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      record_education_assistance_claim: {
        Args: {
          p_claim_token: string;
        };
        Returns: {
          id: string;
          applicant_name: string;
          applicant_email: string;
          contact_number: string | null;
          zone: BarangayZone | null;
          education_level: EducationLevel;
          school_name: string;
          year_or_grade_level: string;
          claimed_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
