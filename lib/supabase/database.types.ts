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
  submitted_at: string;
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
};

type EducationalAssistanceApplicationInsert = Omit<
  EducationalAssistanceApplication,
  "id" | "submitted_at" | "review_notes" | "reviewed_at" | "reviewed_by"
> & {
  id?: string;
  submitted_at?: string;
  review_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: {
      is_portal_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
