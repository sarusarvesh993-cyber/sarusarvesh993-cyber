"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getISTDateKey, addDaysToDateKey } from "@/lib/dates";
import { requireOwner, normaliseEmail } from "@/lib/auth";
import { isSupabaseConfigured, createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateWeeklyPlan } from "@/lib/study-plan";
import { scheduleNextReview, type ReviewRating } from "@/lib/spaced-repetition";
import { getSyllabusTopic } from "@/lib/content/syllabus";
import { getLesson } from "@/lib/content/lessons";
import { runSourceSync } from "@/lib/sync";
import type { ExamScope, PrepLevel, Profile, StudyLanguage } from "@/lib/types";

export type ActionState = { error?: string; success?: string };

const OPTIONAL_SUBJECTS = [
  "History", "Geography", "Political Science and International Relations", "Public Administration",
  "Sociology", "Anthropology", "Economics", "Philosophy", "Other", "Not decided",
] as const;
const PREP_LEVELS: PrepLevel[] = ["starting", "building", "revision"];
const LANGUAGES: StudyLanguage[] = ["English", "Hindi", "Bilingual"];
const EXAM_SCOPES: ExamScope[] = ["upsc", "upsc_ssc", "broad"];

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

async function replaceFuturePlan(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string, profile: Profile) {
  const today = getISTDateKey();
  const { error: deleteError } = await supabase.from("study_tasks")
    .delete()
    .eq("user_id", userId)
    .eq("source", "generated")
    .gte("task_date", today)
    .neq("status", "done");
  if (deleteError) throw new Error("Could not safely update future planned sessions.");
  const rows = generateWeeklyPlan(profile, today).map((task) => ({ ...task, user_id: userId }));
  const { error } = await supabase.from("study_tasks").upsert(rows, { onConflict: "user_id,plan_key", ignoreDuplicates: true });
  if (error) throw new Error("Could not save the generated study plan. Check the database migration and try again.");
}

export async function signInAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "Authentication is not configured yet. Use the deployment setup guide first." };
  const email = normaliseEmail(field(formData, "email"));
  // Passwords are opaque credentials: do not trim or otherwise normalise them.
  const password = String(formData.get("password") ?? "");
  const ownerEmail = normaliseEmail(process.env.OWNER_EMAIL);
  if (!email || !password) return { error: "Enter the owner email and password." };
  if (!ownerEmail || email !== ownerEmail) return { error: "This private study desk is restricted to the configured owner account." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Sign-in failed. Check the owner account and password, then try again." };
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email || normaliseEmail(data.user.email) !== ownerEmail) {
    await supabase.auth.signOut();
    return { error: "The authenticated account does not match OWNER_EMAIL." };
  }
  redirect("/");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function saveProfileAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireOwner();
  const year = Number(field(formData, "target_year"));
  const minutes = Number(field(formData, "daily_minutes"));
  const prepLevel = field(formData, "prep_level") as PrepLevel;
  const language = field(formData, "preferred_language") as StudyLanguage;
  const optionalSubjectValue = field(formData, "optional_subject");
  const examScope = field(formData, "exam_scope") as ExamScope;
  const eligibility = field(formData, "eligibility_context");
  const includeHistoryOptional = checked(formData, "include_history_optional");
  const emailAlerts = checked(formData, "email_alerts");

  const thisYear = new Date().getUTCFullYear();
  if (!Number.isInteger(year) || year < thisYear || year > thisYear + 15) return { error: "Choose a valid target attempt year." };
  if (!Number.isInteger(minutes) || minutes < 30 || minutes > 720) return { error: "Choose daily study time between 30 minutes and 12 hours." };
  if (!PREP_LEVELS.includes(prepLevel)) return { error: "Choose your current preparation level." };
  if (!LANGUAGES.includes(language)) return { error: "Choose a preferred study language." };
  if (optionalSubjectValue && !OPTIONAL_SUBJECTS.includes(optionalSubjectValue as typeof OPTIONAL_SUBJECTS[number])) return { error: "Choose an optional subject from the list or leave it undecided." };
  if (!EXAM_SCOPES.includes(examScope)) return { error: "Choose which official exam sources to monitor." };
  if (eligibility.length > 800) return { error: "Eligibility context must be 800 characters or fewer." };
  if (emailAlerts && (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)) {
    return { error: "Email alerts need a server-side Resend API key and verified sender first. In-app alerts remain available." };
  }

  const profile: Profile = {
    user_id: user.id,
    target_year: year,
    daily_minutes: minutes,
    prep_level: prepLevel,
    preferred_language: language,
    optional_subject: optionalSubjectValue || null,
    include_history_optional: includeHistoryOptional,
    exam_scope: examScope,
    eligibility_context: eligibility || null,
    email_alerts: emailAlerts,
    onboarding_complete: true,
  };
  const { error } = await supabase.from("profiles").upsert(profile, { onConflict: "user_id" });
  if (error) {
    console.error("[profile:save]", error.message);
    return { error: "Could not save your settings. Check that the database migration has been applied." };
  }

  try {
    await replaceFuturePlan(supabase, user.id, profile);
  } catch (error) {
    console.error("[plan:profile-save]", error);
    return { error: error instanceof Error ? error.message : "Could not generate a study plan." };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/study-plan");
  revalidatePath("/settings");
  if (field(formData, "return_to") !== "settings") redirect("/dashboard?welcome=1");
  return { success: "Preferences saved. Future generated sessions have been refreshed; completed sessions were kept." };
}

export async function regeneratePlanAction() {
  const { supabase, user } = await requireOwner();
  const profileResult = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (profileResult.error || !profileResult.data) redirect("/settings?error=profile");
  try {
    await replaceFuturePlan(supabase, user.id, profileResult.data as Profile);
  } catch {
    redirect("/study-plan?error=plan");
  }
  revalidatePath("/study-plan");
  revalidatePath("/dashboard");
  redirect("/study-plan?regenerated=1");
}

export async function completeTaskAction(formData: FormData) {
  const { supabase, user } = await requireOwner();
  const id = field(formData, "task_id");
  if (!id) return;
  const { data, error } = await supabase.from("study_tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .neq("status", "done")
    .select("topic_id,type")
    .maybeSingle();
  if (error || !data) return;

  if (data.topic_id && (data.type === "study" || data.type === "answer_practice")) {
    const topic = getSyllabusTopic(data.topic_id);
    if (topic) {
      const existing = await supabase.from("review_cards").select("id").eq("user_id", user.id).eq("topic_id", topic.id).limit(1);
      if (!existing.error && !existing.data?.length) {
        await supabase.from("review_cards").insert({
          user_id: user.id,
          topic_id: topic.id,
          prompt: `Without looking, explain “${topic.title}” in three points and give one example.`,
          answer: `${topic.summary}\n\nCheck yourself against this syllabus-based note: ${topic.rationale}`,
          next_due_on: addDaysToDateKey(getISTDateKey(), 1),
          interval_days: 0,
          ease_factor: 2.5,
          repetitions: 0,
        });
      }
    }
  }
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/study-plan");
  revalidatePath("/progress");
}

export async function saveTopicProgressAction(formData: FormData) {
  const { supabase, user } = await requireOwner();
  const topicId = field(formData, "topic_id");
  const status = field(formData, "status");
  const confidence = Number(field(formData, "confidence"));
  if (!getSyllabusTopic(topicId) || !["not_started", "learning", "reviewing", "confident"].includes(status) || !Number.isInteger(confidence) || confidence < 0 || confidence > 5) return;
  const { error } = await supabase.from("topic_progress").upsert({
    user_id: user.id,
    topic_id: topicId,
    status,
    confidence,
    last_studied_on: status === "not_started" ? null : getISTDateKey(),
  }, { onConflict: "user_id,topic_id" });
  if (!error) {
    revalidatePath("/syllabus");
    revalidatePath("/progress");
    revalidatePath("/dashboard");
  }
}

export async function saveNoteAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireOwner();
  const topicId = field(formData, "topic_id");
  const content = String(formData.get("content") ?? "");
  if (!getSyllabusTopic(topicId)) return { error: "Choose a syllabus topic for this note." };
  if (content.length > 20_000) return { error: "Notes are limited to 20,000 characters per topic." };
  const { error } = await supabase.from("topic_notes").upsert({ user_id: user.id, topic_id: topicId, content }, { onConflict: "user_id,topic_id" });
  if (error) {
    console.error("[notes:save]", error.message);
    return { error: "Could not save this note. Try again after checking the database connection." };
  }
  revalidatePath("/notes");
  const lessonSlug = field(formData, "return_slug");
  if (lessonSlug && getLesson(lessonSlug)?.topicId === topicId) revalidatePath(`/learn/${lessonSlug}`);
  return { success: "Note saved privately to your account." };
}

export async function createReviewCardAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireOwner();
  const topicId = field(formData, "topic_id");
  const prompt = field(formData, "prompt");
  const answer = String(formData.get("answer") ?? "").trim();
  if (topicId && !getSyllabusTopic(topicId)) return { error: "Choose a valid syllabus topic." };
  if (prompt.length < 3 || prompt.length > 1200 || answer.length < 1 || answer.length > 4000) return { error: "Add a prompt (3–1,200 characters) and an answer (up to 4,000 characters)." };
  const { error } = await supabase.from("review_cards").insert({
    user_id: user.id,
    topic_id: topicId || null,
    prompt,
    answer,
    next_due_on: getISTDateKey(),
    interval_days: 0,
    ease_factor: 2.5,
    repetitions: 0,
  });
  if (error) {
    console.error("[review:create]", error.message);
    return { error: "Could not add this review card." };
  }
  revalidatePath("/study-plan");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return { success: "Card added. Try answering it before revealing the back." };
}

export async function gradeReviewAction(formData: FormData) {
  const { supabase, user } = await requireOwner();
  const cardId = field(formData, "card_id");
  const rating = Number(field(formData, "rating")) as ReviewRating;
  if (![1, 3, 4, 5].includes(rating)) return;
  const { data: card, error: readError } = await supabase.from("review_cards").select("*").eq("id", cardId).eq("user_id", user.id).maybeSingle();
  if (readError || !card) return;
  const schedule = scheduleNextReview(card, rating, getISTDateKey());
  const previousInterval = card.interval_days;
  const { error: updateError } = await supabase.from("review_cards").update({ ...schedule, last_reviewed_at: new Date().toISOString() }).eq("id", cardId).eq("user_id", user.id);
  if (updateError) return;
  const { error: eventError } = await supabase.from("review_events").insert({
    user_id: user.id,
    review_card_id: cardId,
    rating,
    previous_interval_days: previousInterval,
    next_interval_days: schedule.interval_days,
  });
  if (eventError) console.error("[review:event]", eventError.message);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/study-plan");
  revalidatePath("/progress");
}

export async function dismissExamAlertAction(formData: FormData) {
  const { supabase, user } = await requireOwner();
  const alertId = field(formData, "alert_id");
  if (!alertId) return;
  await supabase.from("exam_alert_dismissals").upsert({ user_id: user.id, alert_id: alertId }, { onConflict: "user_id,alert_id", ignoreDuplicates: true });
  revalidatePath("/exam-alerts");
}

export async function refreshSourcesAction(_previous: ActionState): Promise<ActionState> {
  void _previous;
  await requireOwner();
  try {
    const admin = createSupabaseAdminClient();
    const { data: lastRun, error } = await admin.from("source_sync_runs").select("created_at")
      .eq("trigger_kind", "manual").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error("Unable to check the manual refresh rate limit.");
    if (lastRun?.created_at && Date.now() - new Date(lastRun.created_at).getTime() < 5 * 60_000) {
      return { error: "A manual refresh ran in the last five minutes. Check the latest sync status before retrying." };
    }
    const result = await runSourceSync("manual");
    revalidatePath("/current-affairs");
    revalidatePath("/exam-alerts");
    revalidatePath("/dashboard");
    return { success: result.messages.join(" ") || `Refresh finished with status: ${result.status}.` };
  } catch (error) {
    console.error("[sync:manual]", error);
    return { error: error instanceof Error ? error.message : "The source refresh failed. Check sync history." };
  }
}
