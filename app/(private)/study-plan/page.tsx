import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, CalendarDays, Check, Clock3, RotateCcw, Sparkles } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getCurrentWeekTasks, getDueReviewCards, getProfile, getReviewCards } from "@/lib/data";
import { addDaysToDateKey, formatDateIST, getISTDateKey, weekdayIST } from "@/lib/dates";
import type { StudyTask } from "@/lib/types";
import { regeneratePlanAction } from "@/app/actions";
import { TaskCompleteButton } from "@/components/TaskCompleteButton";
import { ReviewCardItem } from "@/components/ReviewCardItem";
import { ReviewCardForm } from "@/components/ReviewCardForm";
import { syllabusTopics } from "@/lib/content/syllabus";

export const metadata: Metadata = { title: "Study plan" };

export default async function StudyPlanPage() {
  const { supabase, user } = await requireOwner();
  const profile = await getProfile(supabase, user);
  if (!profile?.onboarding_complete) return <div className="empty-state"><div className="empty-icon"><CalendarDays size={18} /></div><h3>Set your study preferences first</h3><p>The plan is generated from your selected attempt year, time, preparation level and optional-subject choices.</p><Link className="button button-primary button-small" href="/settings">Complete Preferences</Link></div>;

  const today = getISTDateKey();
  const [tasks, dueCards, allCards] = await Promise.all([
    getCurrentWeekTasks(supabase, user.id, today),
    getDueReviewCards(supabase, user.id, today),
    getReviewCards(supabase, user.id),
  ]);
  const weeklyMinutes = tasks.reduce((sum, task) => sum + task.minutes, 0);
  const done = tasks.filter((task) => task.status === "done").length;
  const weekDays = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(today, index));
  const visibleTopics = syllabusTopics.filter((topic) => !topic.optionalOnly || profile.include_history_optional || profile.optional_subject === "History");

  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow">Your weekly rhythm · target {profile.target_year}</span><h1>Study plan</h1><p>{profile.daily_minutes} minutes per day · {profile.prep_level} stage · a weekly review uses active recall and spaced repetition.</p></div>
        <div className="page-heading-actions"><form action={regeneratePlanAction}><button className="button button-secondary" type="submit"><RotateCcw size={14} /> Regenerate next 7 days</button></form></div>
      </div>

      <div className="notice-box blue-notice"><Sparkles size={15} /><span><strong>How this plan works:</strong> the subject rotation is a study scaffold from the syllabus, not a prediction of question frequency. Your selected hours are divided among concept work, retrieval, practice and current-affairs linking. Completed sessions are preserved when a plan is refreshed.</span></div>

      <section className="card card-pad plan-overview">
        <div className="section-heading"><div><div className="card-label">Next 7 days · India Standard Time</div><h2>Week at a glance</h2><p>Each day is generated from today&apos;s date in Asia/Kolkata; edit Preferences to change the pacing.</p></div><div className="plan-summary"><span><Check size={13} /> {done} / {tasks.length} sessions done</span><span><Clock3 size={13} /> {weeklyMinutes} planned minutes</span><span><BookOpen size={13} /> {allCards.length} recall cards</span></div></div>
        <div className="plan-days">{weekDays.map((date, index) => {
          const dayTasks = tasks.filter((task) => task.task_date === date);
          const complete = dayTasks.filter((task) => task.status === "done").length;
          return <a href={`#day-${date}`} key={date} className={`plan-day${date === today ? " today" : ""}`}><span>{weekdayIST(date).slice(0, 3)}</span><strong>{Number(date.slice(-2))}</strong><small>{dayTasks.length ? `${complete}/${dayTasks.length} done` : index === 0 ? "No sessions" : "—"}</small></a>;
        })}</div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><h2>Daily sessions</h2><p>Short, bounded tasks. If an official question is not mapped, use the archive instead of inventing a PYQ.</p></div><span className="week-label">{formatDateIST(today)} — {formatDateIST(addDaysToDateKey(today, 6))}</span></div>
        <div className="day-stack">
          {weekDays.map((date) => {
            const dayTasks = tasks.filter((task) => task.task_date === date);
            return <section className="card day-card" id={`day-${date}`} key={date}>
              <div className="day-card-head"><div><span className="card-label">{date === today ? "Today" : weekdayIST(date)}</span><h3>{formatDateIST(date, { weekday: undefined })}</h3></div><span className="day-count">{dayTasks.filter((task) => task.status === "done").length}/{dayTasks.length} complete</span></div>
              {dayTasks.length ? <div className="plan-tasks">{dayTasks.map((task) => <PlanTask task={task} key={task.id} />)}</div> : <p className="no-day-tasks">No sessions are scheduled. Regenerate the plan if you changed your available study time.</p>}
            </section>;
          })}
        </div>
      </section>

      <section className="section-block" id="review">
        <div className="section-heading"><div><div className="card-label">Active recall · spaced repetition</div><h2>Review due cards</h2><p>Answer from memory first. The interval is a transparent heuristic and may not fit every learner.</p></div><Link href="/progress" className="text-link">Revision history <ArrowRight size={12} /></Link></div>
        {dueCards.length ? <div className="review-grid">{dueCards.slice(0, 6).map((card) => <ReviewCardItem key={card.id} card={card} />)}</div> : <div className="empty-state"><div className="empty-icon"><RotateCcw size={18} /></div><h3>No review cards are due today</h3><p>Mark a learning session complete to create a starter card, or add a card below. New cards are due today so you can test retrieval immediately.</p></div>}
      </section>
      <section className="section-block"><ReviewCardForm topics={visibleTopics} /></section>
    </>
  );
}

function PlanTask({ task }: { task: StudyTask }) {
  const topic = task.topic_id ? syllabusTopics.find((item) => item.id === task.topic_id) : null;
  return <div className={`plan-task${task.status === "done" ? " plan-task-done" : ""}`}>
    <div className="plan-time">{task.minutes}<small>MIN</small></div>
    <div><h3>{task.title}</h3><p>{task.details}</p>{topic && <Link className="task-topic-link" href={`/syllabus?topic=${encodeURIComponent(topic.id)}`}>{topic.subject} · syllabus link <ArrowRight size={10} /></Link>}</div>
    <div className="plan-task-action"><TaskCompleteButton id={task.id} done={task.status === "done"} /></div>
  </div>;
}
