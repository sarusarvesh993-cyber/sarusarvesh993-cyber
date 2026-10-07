import "server-only";
import type { CurrentAffair, ExamAlert, ExamScope, Profile, ReviewCard, ReviewEvent, StudyTask, TopicNote, TopicProgress } from "@/lib/types";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { addDaysToDateKey, getISTDateKey } from "@/lib/dates";

export type AppSupabase = SupabaseClient;

function unwrap<T>(label: string, result: { data: unknown; error: { message: string } | null }): T {
  if (result.error) {
    // Keep database internals in server logs; show a stable, actionable message in the UI.
    console.error(`[data:${label}]`, result.error.message);
    throw new Error("The study database is not ready or could not be reached. Apply the Supabase migration and check server environment variables.");
  }
  return result.data as T;
}

export async function getProfile(supabase: AppSupabase, user: User): Promise<Profile | null> {
  const result = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  return unwrap<Profile | null>("profile", result);
}

export async function getTasks(supabase: AppSupabase, userId: string, fromDate?: string, toDate?: string): Promise<StudyTask[]> {
  let query = supabase.from("study_tasks").select("*").eq("user_id", userId).order("task_date", { ascending: true }).order("created_at", { ascending: true });
  if (fromDate) query = query.gte("task_date", fromDate);
  if (toDate) query = query.lte("task_date", toDate);
  return unwrap<StudyTask[]>("study_tasks", await query);
}

export async function getCurrentWeekTasks(supabase: AppSupabase, userId: string, anchor = getISTDateKey()) {
  return getTasks(supabase, userId, anchor, addDaysToDateKey(anchor, 6));
}

export async function getDueReviewCards(supabase: AppSupabase, userId: string, today = getISTDateKey()): Promise<ReviewCard[]> {
  const result = await supabase.from("review_cards").select("*").eq("user_id", userId).lte("next_due_on", today).order("next_due_on", { ascending: true }).limit(30);
  return unwrap<ReviewCard[]>("review_cards", result);
}

export async function getReviewCards(supabase: AppSupabase, userId: string): Promise<ReviewCard[]> {
  const result = await supabase.from("review_cards").select("*").eq("user_id", userId).order("next_due_on", { ascending: true }).limit(100);
  return unwrap<ReviewCard[]>("review_cards", result);
}

export async function getTopicProgress(supabase: AppSupabase, userId: string): Promise<TopicProgress[]> {
  const result = await supabase.from("topic_progress").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
  return unwrap<TopicProgress[]>("topic_progress", result);
}

export async function getNotes(supabase: AppSupabase, userId: string): Promise<TopicNote[]> {
  const result = await supabase.from("topic_notes").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
  return unwrap<TopicNote[]>("topic_notes", result);
}

export async function getNoteForTopic(supabase: AppSupabase, userId: string, topicId: string): Promise<TopicNote | null> {
  const result = await supabase.from("topic_notes").select("*").eq("user_id", userId).eq("topic_id", topicId).maybeSingle();
  return unwrap<TopicNote | null>("topic_notes", result);
}

export async function getCurrentAffairs(supabase: AppSupabase, limit = 30): Promise<CurrentAffair[]> {
  const result = await supabase.from("current_affairs").select("*").order("published_at", { ascending: false, nullsFirst: false }).limit(limit);
  return unwrap<CurrentAffair[]>("current_affairs", result);
}

export async function getExamAlerts(supabase: AppSupabase, userId: string, today = getISTDateKey(), scope: ExamScope | null = "upsc") {
  const [alertsResult, dismissedResult] = await Promise.all([
    supabase.from("exam_alerts").select("*").order("notification_date", { ascending: false, nullsFirst: false }).limit(100),
    supabase.from("exam_alert_dismissals").select("alert_id").eq("user_id", userId),
  ]);
  const allAlerts = unwrap<ExamAlert[]>("exam_alerts", alertsResult);
  const dismissedRows = unwrap<{ alert_id: string }[]>("exam_alert_dismissals", dismissedResult);
  const dismissed = new Set(dismissedRows.map((row) => row.alert_id));
  // Old shared records outside the current preference stay in the database but are not shown.
  const alerts = allAlerts.filter((alert) => {
    if (scope === "broad") return true;
    if (scope === "upsc_ssc") return !/RRB/i.test(alert.source_name);
    return /UPSC/i.test(alert.source_name);
  });
  const active = alerts.filter((alert) => !dismissed.has(alert.id) && (!alert.application_deadline || alert.application_deadline >= today));
  const expired = alerts.filter((alert) => !dismissed.has(alert.id) && Boolean(alert.application_deadline && alert.application_deadline < today));
  const dismissedAlerts = alerts.filter((alert) => dismissed.has(alert.id));
  return { active, expired, dismissed: dismissedAlerts };
}

export type SyncRun = {
  id: string;
  source_name: string;
  trigger_kind: "cron" | "manual";
  status: "success" | "partial" | "failed";
  items_added: number;
  message: string | null;
  created_at: string;
};

export async function getSyncRuns(supabase: AppSupabase, limit = 10): Promise<SyncRun[]> {
  const result = await supabase.from("source_sync_runs").select("*").order("created_at", { ascending: false }).limit(limit);
  return unwrap<SyncRun[]>("source_sync_runs", result);
}

export async function getReviewEvents(supabase: AppSupabase, userId: string): Promise<ReviewEvent[]> {
  const result = await supabase.from("review_events")
    .select("id,user_id,review_card_id,rating,previous_interval_days,next_interval_days,reviewed_at,card:review_cards(prompt)")
    .eq("user_id", userId)
    .order("reviewed_at", { ascending: false })
    .limit(100);
  return unwrap<ReviewEvent[]>("review_events", result);
}

export async function getTaskStats(supabase: AppSupabase, userId: string, today = getISTDateKey()) {
  const start = addDaysToDateKey(today, -6);
  const tasks = await getTasks(supabase, userId, start, today);
  const completed = tasks.filter((task) => task.status === "done");
  const totalMinutes = completed.reduce((sum, task) => sum + task.minutes, 0);
  const todayTasks = tasks.filter((task) => task.task_date === today);
  return {
    tasks,
    completed,
    totalMinutes,
    todayTasks,
    todayCompleted: todayTasks.filter((task) => task.status === "done").length,
    weekCompletion: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
  };
}
