export type UserRole = "user" | "admin";

export type ApplicationStatus =
  | "draft"
  | "applied"
  | "responded"
  | "interviewing"
  | "rejected"
  | "offer";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  file_path: string;
  original_file_name: string;
  parsed_text: string | null;
  structured_json: JsonValue | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobDescriptionRecord {
  id: string;
  user_id: string;
  raw_text: string;
  company_name: string | null;
  job_title: string | null;
  structured_json: JsonValue | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisRecord {
  id: string;
  user_id: string;
  resume_id: string;
  jd_id: string;
  match_score: number | null;
  strengths_json: JsonValue | null;
  gaps_json: JsonValue | null;
  suggestions_json: JsonValue | null;
  generated_intro: string | null;
  generated_resume_bullets: JsonValue | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationRecord {
  id: string;
  user_id: string;
  analysis_id: string | null;
  company_name: string;
  job_title: string;
  channel: string | null;
  applied_at: string | null;
  used_ai_suggestion: boolean;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface FeedbackRecord {
  id: string;
  user_id: string;
  application_id: string;
  response_result: string | null;
  interview_stage: string | null;
  user_rating: number | null;
  user_comment: string | null;
  created_at: string;
  updated_at: string;
}