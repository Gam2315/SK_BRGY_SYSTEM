export type EducationLevel = "high_school" | "college";

export type EducationalAssistanceApplication = {
  id: string;
  user_id: string | null;
  applicant_name: string;
  applicant_email: string;
  contact_number: string | null;
  education_level: EducationLevel;
  school_name: string;
  year_or_grade_level: string;
  school_assessment_path: string | null;
  school_id_front_path: string | null;
  school_id_back_path: string | null;
  status: string;
  review_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  claim_period_id?: string | null;
  claim_token?: string | null;
  claimed_at?: string | null;
  claimed_by?: string | null;
  submitted_at: string;
};

export type EducationClaimPeriod = {
  id: string;
  name: string;
  claim_date: string;
  instructions: string | null;
  created_by: string;
  created_at: string;
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

type EducationalAssistanceApplicationInsert = Omit<
  EducationalAssistanceApplication,
  "id" | "submitted_at" | "review_notes" | "reviewed_at" | "reviewed_by"
    | "claim_period_id" | "claim_token" | "claimed_at" | "claimed_by"
> & {
  id?: string;
  submitted_at?: string;
  review_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  claim_period_id?: string | null;
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
      education_claim_periods: {
        Row: EducationClaimPeriod;
        Insert: Omit<EducationClaimPeriod, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
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
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
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
