export type PrepLevel = "starting" | "building" | "revision";
export type StudyLanguage = "English" | "Hindi" | "Bilingual";
export type ExamScope = "upsc" | "upsc_ssc" | "broad";
export type StudyTaskType = "study" | "recall" | "pyq" | "current_affairs" | "weekly_review" | "answer_practice" | "error_log";
export type TaskStatus = "planned" | "in_progress" | "done";

export type Profile = {
  user_id: string;
  target_year: number | null;
  daily_minutes: number | null;
  prep_level: PrepLevel | null;
  preferred_language: StudyLanguage | null;
  optional_subject: string | null;
  include_history_optional: boolean;
  exam_scope: ExamScope | null;
  eligibility_context: string | null;
  email_alerts: boolean;
  onboarding_complete: boolean;
  created_at?: string;
  updated_at?: string;
};

export type StudyTask = {
  id: string;
  user_id: string;
  plan_key: string;
  task_date: string;
  type: StudyTaskType;
  title: string;
  details: string;
  topic_id: string | null;
  minutes: number;
  status: TaskStatus;
  source: "generated" | "manual";
  completed_at: string | null;
  created_at?: string;
};

export type ReviewCard = {
  id: string;
  user_id: string;
  topic_id: string | null;
  prompt: string;
  answer: string;
  next_due_on: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  last_reviewed_at: string | null;
  created_at?: string;
};

export type ReviewEvent = {
  id: string;
  user_id: string;
  review_card_id: string;
  rating: 1 | 3 | 4 | 5;
  previous_interval_days: number;
  next_interval_days: number;
  reviewed_at: string;
  card: { prompt: string } | null;
};

export type TopicProgress = {
  user_id: string;
  topic_id: string;
  status: "not_started" | "learning" | "reviewing" | "confident";
  confidence: number;
  last_studied_on: string | null;
  updated_at?: string;
};

export type TopicNote = {
  id: string;
  user_id: string;
  topic_id: string;
  content: string;
  updated_at: string;
};

export type CurrentAffair = {
  id: string;
  source_url: string;
  source_name: string;
  title: string;
  description: string | null;
  published_at: string | null;
  stage: string;
  paper: string;
  subject: string;
  topic_id: string;
  why_matters: string;
  static_connection: string;
  exam_relevance: string;
  action: "study" | "revise" | "monitor";
  priority: "core" | "important" | "lower priority";
  practice_question: string;
  created_at: string;
};

export type ExamAlert = {
  id: string;
  source_url: string;
  source_page_url: string;
  source_name: string;
  exam_name: string;
  title: string;
  notification_date: string | null;
  application_deadline: string | null;
  exam_date: string | null;
  eligibility_summary: string | null;
  relevance_rationale: string;
  overlap: string[];
  last_seen_at: string;
  created_at: string;
};
