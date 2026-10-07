import Link from "next/link";
import type { Metadata } from "next";
import { Activity, ArrowRight, BookOpenCheck, CalendarClock, CircleCheck, Clock3, RotateCcw } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getDueReviewCards, getProfile, getReviewCards, getReviewEvents, getTaskStats, getTopicProgress } from "@/lib/data";
import { addDaysToDateKey, formatDateIST, getISTDateKey, weekdayIST } from "@/lib/dates";
import { syllabusTopics, priorityLabels } from "@/lib/content/syllabus";
import { getPriorityTone } from "@/lib/priorities";
import { ReviewCardItem } from "@/components/ReviewCardItem";

export const metadata: Metadata = { title: "Progress & revision" };

const statusText: Record<string, string> = { not_started: "Not started", learning: "Learning", reviewing: "Reviewing", confident: "Confident" };

export default async function ProgressPage() {
  const { supabase, user } = await requireOwner();
  const today = getISTDateKey();
  const [profile, stats, dueCards, allCards, events, topicProgress] = await Promise.all([
    getProfile(supabase, user),
    getTaskStats(supabase, user.id, today),
    getDueReviewCards(supabase, user.id, today),
    getReviewCards(supabase, user.id),
    getReviewEvents(supabase, user.id),
    getTopicProgress(supabase, user.id),
  ]);
  const includeHistory = Boolean(profile?.include_history_optional || profile?.optional_subject === "History");
  const visibleTopics = syllabusTopics.filter((topic) => !topic.optionalOnly || includeHistory);
  const topicMap = new Map(visibleTopics.map((topic) => [topic.id, topic]));
  const tracked = topicProgress.filter((item) => topicMap.has(item.topic_id));
  const days = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(today, index - 6));
  const dayStats = days.map((date) => ({ date, count: stats.completed.filter((task) => task.completed_at ? getISTDateKey(new Date(task.completed_at)) === date : task.task_date === date).length }));
  const maxCount = Math.max(1, ...dayStats.map((item) => item.count));
  const minutes = stats.completed.reduce((sum, item) => sum + item.minutes, 0);

  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">Honest signals · no streak pressure</span><h1>Progress & revision</h1><p>Review completed sessions, confidence notes and card history. A missed target is a signal to adjust—not a character judgement.</p></div><Link href="/study-plan#review" className="button button-secondary"><RotateCcw size={14} /> Review due cards</Link></div>
      <section className="metrics-grid progress-metrics">
        <div className="card metric-card"><div className="metric-icon"><CircleCheck size={16} /></div><div><div className="metric-number">{stats.completed.length}</div><div className="metric-caption">Sessions completed · 7 days</div></div></div>
        <div className="card metric-card"><div className="metric-icon orange"><Clock3 size={16} /></div><div><div className="metric-number">{minutes}<small>m</small></div><div className="metric-caption">Completed study time · 7 days</div></div></div>
        <div className="card metric-card"><div className="metric-icon blue"><BookOpenCheck size={16} /></div><div><div className="metric-number">{tracked.length}</div><div className="metric-caption">Topics with progress entries</div></div></div>
        <div className="card metric-card"><div className="metric-icon gold"><CalendarClock size={16} /></div><div><div className="metric-number">{dueCards.length}<small> / {allCards.length}</small></div><div className="metric-caption">Cards due / active</div></div></div>
      </section>

      <section className="section-block progress-grid">
        <div className="card card-pad activity-card"><div className="section-heading"><div><div className="card-label">Recent study activity</div><h2>Completed sessions</h2><p>Last seven calendar dates in IST. Empty bars are not a missed-day judgement.</p></div><Activity size={17} className="muted-icon" /></div>
          <div className="activity-chart" role="img" aria-label="Completed sessions over the last seven days">{dayStats.map((item) => <div className="activity-day" key={item.date}><div className="activity-bar-rail"><div className="activity-bar" style={{ height: `${item.count ? Math.max(8, item.count / maxCount * 100) : 2}%` }} title={`${item.count} completed session${item.count === 1 ? "" : "s"}`} /></div><strong>{item.count}</strong><span>{weekdayIST(item.date).slice(0, 2)}</span><small>{item.date.slice(-2)}</small></div>)}</div>
        </div>
        <div className="card card-pad progress-side-card"><div className="card-label">Revision system</div><h2>Use recall before review</h2><p>For each card, attempt a free recall, compare with your reference answer, and rate it honestly. The interval rule is a simple SM-2-style heuristic, not an evidence guarantee.</p><div className="small-stat"><span>Due today</span><strong>{dueCards.length}</strong></div><div className="small-stat"><span>Active cards</span><strong>{allCards.length}</strong></div><Link className="text-link" href="/study-plan#review">Open revision queue <ArrowRight size={12} /></Link></div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><div className="card-label">Spaced repetition · active recall</div><h2>Due review cards</h2><p>Cards are private to your account. Again schedules tomorrow; higher ratings set progressively longer intervals.</p></div></div>
        {dueCards.length ? <div className="review-grid">{dueCards.slice(0, 8).map((card) => <ReviewCardItem key={card.id} card={card} />)}</div> : <div className="empty-state"><div className="empty-icon"><RotateCcw size={18} /></div><h3>Nothing due right now</h3><p>Add a topic card or complete a learning session to build your revision queue.</p><Link href="/study-plan#review" className="button button-secondary button-small">Go to review tools</Link></div>}
      </section>

      <section className="section-block">
        <div className="section-heading"><div><div className="card-label">Topic confidence</div><h2>Tracked syllabus topics</h2><p>Confidence reflects your own rating; it is not a test score. Update topic status from the syllabus browser.</p></div><Link className="text-link" href="/syllabus">Update syllabus progress <ArrowRight size={12} /></Link></div>
        {tracked.length ? <div className="card tracked-topics-table"><table><thead><tr><th>Topic</th><th>Status</th><th>Confidence</th><th>Last updated</th><th>Recommendation</th></tr></thead><tbody>{tracked.sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0)).map((item) => {
          const topic = topicMap.get(item.topic_id)!;
          return <tr key={item.topic_id}><td><Link href={`/syllabus?topic=${encodeURIComponent(topic.id)}`} className="table-topic-link"><strong>{topic.title}</strong><small>{topic.paperLabel} · {topic.subject}</small></Link></td><td><span className={`status-chip status-${item.status}`}>{statusText[item.status] ?? item.status}</span></td><td><span className="confidence-circles">{Array.from({ length: 5 }, (_, index) => <i key={index} className={index < item.confidence ? "filled" : ""} />)}</span><small>{item.confidence}/5</small></td><td>{item.last_studied_on ? formatDateIST(item.last_studied_on) : "Not recorded"}</td><td><span className={`priority ${getPriorityTone(topic.priority)}`}>{priorityLabels[topic.priority]}</span></td></tr>;
        })}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><BookOpenCheck size={18} /></div><h3>No topic confidence entries yet</h3><p>Open a syllabus topic and record status and confidence to begin your own review map.</p><Link href="/syllabus" className="button button-secondary button-small">Browse the syllabus</Link></div>}
      </section>

      <section className="section-block">
        <div className="section-heading"><div><div className="card-label">History</div><h2>Recent revision ratings</h2><p>Last 20 rating events, stored alongside the card interval.</p></div></div>
        <div className="card review-history-list">{events.length ? events.slice(0, 20).map((event) => <div className="review-history-row" key={event.id}><span className="review-history-score">{event.rating}/5</span><div><strong>{event.card?.prompt ?? "Deleted review card"}</strong><p>{event.previous_interval_days} → {event.next_interval_days} day interval</p></div><time>{formatDateIST(event.reviewed_at.slice(0, 10))}</time></div>) : <p className="source-history-empty">No review ratings yet. Your rating history will appear here after the first card review.</p>}</div>
      </section>
    </>
  );
}
