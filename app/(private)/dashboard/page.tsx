import Link from "next/link";
import type { Metadata } from "next";
import { Activity, ArrowRight, BellRing, BookOpenCheck, CalendarDays, Clock3, Flame, RefreshCw } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getProfile, getCurrentAffairs, getDueReviewCards, getExamAlerts, getSyncRuns, getTaskStats } from "@/lib/data";
import { getISTDateKey, formatDateIST, formatDateTimeIST } from "@/lib/dates";
import { ProfileForm } from "@/components/ProfileForm";
import { CurrentAffairsCard } from "@/components/CurrentAffairsCard";
import { TaskCompleteButton } from "@/components/TaskCompleteButton";
import { RefreshSourcesForm } from "@/components/RefreshSourcesForm";
import { getSyllabusTopic } from "@/lib/content/syllabus";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function DatabaseSetupNotice() {
  return <div className="notice-box red-notice"><span><strong>Database setup is incomplete.</strong> Apply the Supabase migration with the deployment script, then sign in again. No progress or notes are shown until the database is ready.</span></div>;
}

export default async function DashboardPage() {
  const { supabase, user } = await requireOwner();
  let profile: Profile | null;
  try { profile = await getProfile(supabase, user); }
  catch { return <div className="onboarding-wrap"><PageHeading title="Connect your private study data" description="The authenticated page is ready, but the secure database schema is not available yet." /><DatabaseSetupNotice /><div className="card card-pad setup-next"><h2>Next setup steps</h2><ol><li>Apply <code>supabase/migrations/202610070001_initial_schema.sql</code>.</li><li>Create the owner account in Supabase Auth and set the same address as <code>OWNER_EMAIL</code>.</li><li>Reload to complete onboarding. No demo progress is created.</li></ol></div></div>; }

  if (!profile?.onboarding_complete) {
    return (
      <div className="onboarding-wrap">
        <div className="onboarding-hero"><span className="eyebrow">A plan that starts with your constraints</span><h2>Before we build your week</h2><p>Choose the inputs that change the study mix. Nothing is preselected; the first seven days are generated only after you save.</p></div>
        <ProfileForm profile={profile ?? null} onboarding emailConfigured={Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)} />
      </div>
    );
  }

  const today = getISTDateKey();
  const [stats, dueCards, affairs, alertData, syncRuns] = await Promise.all([
    getTaskStats(supabase, user.id, today),
    getDueReviewCards(supabase, user.id, today),
    getCurrentAffairs(supabase, 3),
    getExamAlerts(supabase, user.id, today, profile?.exam_scope ?? "upsc"),
    getSyncRuns(supabase, 6),
  ]);
  const todayTasks = stats.todayTasks;
  const latestSync = syncRuns[0];
  const todayMinutes = todayTasks.reduce((total, task) => total + task.minutes, 0);
  const targetLabel = profile.target_year ? `your ${profile.target_year} attempt` : "your attempt";
  const weekHours = (stats.totalMinutes / 60).toFixed(stats.totalMinutes % 60 ? 1 : 0);
  const nextDate = todayTasks.length ? formatDateIST(today, { weekday: "long" }) : "today";

  return (
    <>
      <div className="page-heading dashboard-heading">
        <div><span className="eyebrow">{formatDateIST(today, { weekday: "long" })} · {formatDateIST(today)}</span><h1>{greeting()}, aspirant.</h1><p>Your {targetLabel} plan is paced to the study time and preparation level you selected. Adjust either any time in Preferences.</p></div>
        <div className="page-heading-actions"><Link href="/study-plan" className="button button-secondary"><CalendarDays size={14} /> Open study plan</Link></div>
      </div>

      <section className="dashboard-hero">
        <div className="hero-card">
          <div className="hero-date">PERSONAL STUDY PLAN · {profile.daily_minutes} MIN / DAY</div>
          <h2>Clarity for today.<br />Consistency for the week.</h2>
          <p>{todayTasks.length ? `${todayTasks.length} planned sessions for ${nextDate}, built from your own settings.` : "No sessions are planned for today yet. Create a fresh week from your study plan."} Review and current-affairs sessions stay useful only when they fit your schedule.</p>
          <div className="hero-actions"><Link href="/study-plan" className="button button-primary"><BookOpenCheck size={14} /> Start today&apos;s plan</Link><Link href="/syllabus" className="button button-secondary">Explore syllabus</Link></div>
        </div>
        <div className="hero-side">
          <div className="card-label">A small daily check-in</div>
          <h3>{dueCards.length ? `${dueCards.length} recall ${dueCards.length === 1 ? "card" : "cards"} due` : "Keep retrieval in the loop"}</h3>
          <p>{dueCards.length ? "Try to answer from memory before opening the reference. Rate difficulty honestly to set the next review." : "Mark a study session complete and add a card when a topic is ready for spaced review."}</p>
          <Link href="/study-plan#review" className="text-link">{dueCards.length ? "Review due cards" : "Set up active recall"} <ArrowRight size={13} /></Link>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Study metrics">
        <div className="card metric-card"><div className="metric-icon"><CheckMetricIcon /></div><div><div className="metric-number">{stats.todayCompleted}<span className="metric-divider">/</span>{todayTasks.length}</div><div className="metric-caption">Sessions done today</div></div></div>
        <div className="card metric-card"><div className="metric-icon orange"><Clock3 size={16} /></div><div><div className="metric-number">{todayMinutes}<small>m</small></div><div className="metric-caption">Planned study time today</div></div></div>
        <div className="card metric-card"><div className="metric-icon blue"><Activity size={16} /></div><div><div className="metric-number">{weekHours}<small>h</small></div><div className="metric-caption">Completed in the last 7 days</div></div></div>
        <div className="card metric-card"><div className="metric-icon gold"><BellRing size={16} /></div><div><div className="metric-number">{alertData.active.length}</div><div className="metric-caption">Potential official exam links</div></div></div>
      </section>

      <section className="section-block dashboard-grid">
        <div className="card card-pad today-card">
          <div className="section-heading"><div><div className="card-label">Daily plan · {formatDateIST(today)}</div><h2>Today&apos;s sessions</h2><p>Mark a session done to track progress. Completion may create a topic recall card.</p></div><Link className="text-link" href="/study-plan">Full week <ArrowRight size={12} /></Link></div>
          {todayTasks.length ? <div className="task-list">{todayTasks.map((task) => {
            const topic = task.topic_id ? getSyllabusTopic(task.topic_id) : null;
            return <div className="task-row" key={task.id}><TaskCompleteButton id={task.id} done={task.status === "done"} /><div className="task-copy"><strong className={task.status === "done" ? "task-done-text" : ""}>{task.title}</strong><p>{task.details}</p><span className="task-type">{task.type.replaceAll("_", " ")}{topic ? ` · ${topic.subject}` : ""}</span></div><span className="task-meta">{task.minutes} min</span></div>;
          })}</div> : <div className="empty-state"><div className="empty-icon"><CalendarDays size={18} /></div><h3>No sessions for today</h3><p>Regenerate the next seven days from Study plan. Existing notes and completed sessions are retained.</p><Link href="/study-plan" className="button button-secondary button-small">Open study plan</Link></div>}
          {todayTasks.length > 0 && <div className="today-footer"><span>Completion for today</span><div className="inline-progress"><div className="progress-track"><div className="progress-fill" style={{ width: `${todayTasks.length ? Math.round(stats.todayCompleted / todayTasks.length * 100) : 0}%` }} /></div><strong>{stats.todayCompleted}/{todayTasks.length}</strong></div></div>}
        </div>
        <aside className="card card-pad overview-aside">
          <div className="card-label">Weekly rhythm</div><h2 className="card-title aside-title">Progress you can review</h2><p className="card-subtitle">A small checkpoint is more useful than an invented streak.</p>
          <div className="weekly-progress"><div className="weekly-progress-head"><span>Task completion · last 7 days</span><strong>{stats.weekCompletion}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${stats.weekCompletion}%` }} /></div></div>
          <div className="small-stat"><span>Sessions completed</span><strong>{stats.completed.length}</strong></div>
          <div className="small-stat"><span>Review cards due</span><strong>{dueCards.length}</strong></div>
          <div className="small-stat"><span>Potential exam links</span><strong>{alertData.active.length}</strong></div>
          <div className="aside-links"><Link className="text-link" href="/progress">Progress details <ArrowRight size={12} /></Link><Link className="text-link" href="/exam-alerts">Review official alert links <ArrowRight size={12} /></Link></div>
        </aside>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><div className="card-label">Official-source filter · PIB</div><h2>Current affairs worth a closer look</h2><p>Rule-based syllabus matches from recent PIB releases. A matched heading is a prompt to verify the original, not a generated news fact.</p></div><Link className="text-link" href="/current-affairs">All current affairs <ArrowRight size={12} /></Link></div>
        {affairs.length ? <div className="news-list dashboard-news">{affairs.slice(0, 2).map((item) => <CurrentAffairsCard key={item.id} item={item} />)}</div> : <div className="card dashboard-news-empty"><div><div className="card-label">No items synced yet</div><p>Daily current-affairs cards appear only after a source refresh returns a recent PIB item that matches the configured syllabus rules.</p></div><RefreshSourcesForm /></div>}
        {latestSync && <div className="sync-foot"><RefreshCw size={11} /> Last source check: {formatDateTimeIST(latestSync.created_at)} IST · {latestSync.status}</div>}
      </section>
    </>
  );
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return <div className="page-heading"><div><span className="eyebrow">PRIVATE STUDY DESK</span><h1>{title}</h1><p>{description}</p></div></div>;
}

function CheckMetricIcon() {
  return <Flame size={16} />;
}
