import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BellRing, Database, ExternalLink, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getProfile, getSyncRuns } from "@/lib/data";
import { ProfileForm } from "@/components/ProfileForm";
import { formatDateTimeIST } from "@/lib/dates";

export const metadata: Metadata = { title: "Preferences & security" };

export default async function SettingsPage() {
  const { supabase, user } = await requireOwner();
  const [profile, syncRuns] = await Promise.all([getProfile(supabase, user), getSyncRuns(supabase, 8)]);
  const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  const cronConfigured = Boolean(process.env.CRON_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY);
  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">A plan shaped by your answers</span><h1>Preferences & security</h1><p>Update your study budget, target attempt, preparation stage, optional coverage and the official notice sources to watch.</p></div></div>
      {!profile?.onboarding_complete && <div className="notice-box blue-notice"><span>Finish the required preferences to create your first weekly plan. No value is preselected.</span></div>}
      <ProfileForm profile={profile ?? null} emailConfigured={emailConfigured} />

      <section className="section-block settings-security-section">
        <div className="section-heading"><div><div className="card-label">Before putting personal notes online</div><h2>Deployment privacy is a separate control</h2><p>A private GitHub repository does not make a Vercel deployment private.</p></div></div>
        <div className="security-grid">
          <article className="card security-card"><div className="security-card-icon"><ShieldCheck size={16} /></div><h3>Vercel access protection</h3><p>Set Vercel Deployment Protection to Vercel Authentication for <strong>All Deployments</strong>, including production domains, and allow only your own Vercel user/team. Check generated preview and production URLs; do not enable shareable links or automation bypass unless you have a separate access control.</p><a href="https://vercel.com/docs/deployment-protection" target="_blank" rel="noreferrer" className="text-link">Vercel protection guide <ExternalLink size={11} /></a></article>
          <article className="card security-card"><div className="security-card-icon blue"><Database size={16} /></div><h3>Supabase account & RLS</h3><p>Personal notes, plans, topic progress, review cards and dismissals use <code>auth.uid()</code> row policies. The service-role key is server-only and bypasses RLS; use it only for scheduled source ingestion and protect it as a project secret.</p><a href="https://supabase.com/docs/guides/database/secure-data" target="_blank" rel="noreferrer" className="text-link">Supabase secure-data guide <ExternalLink size={11} /></a></article>
          <article className="card security-card"><div className="security-card-icon orange"><KeyRound size={16} /></div><h3>Owner authentication</h3><p>There is no public sign-up form. The app checks the configured owner email on private pages and server actions. Keep Supabase Auth recovery email secure and do not share your password.</p><Link href="/login" className="text-link">Sign-in page <ArrowUpRight size={11} /></Link></article>
          <article className="card security-card"><div className="security-card-icon gold"><BellRing size={16} /></div><h3>Optional email & scheduled updates</h3><p>{emailConfigured ? "Resend credentials are configured on the server; email remains opt-in in your preferences." : "Email alerts are not configured. In-app potential notice links still work when a sync succeeds."} Cron endpoint configuration: <strong>{cronConfigured ? "server secrets detected" : "needs server secrets"}</strong>. Daily target is 04:00 IST; Vercel Hobby jobs have hourly timing tolerance.</p><a href="https://vercel.com/docs/cron-jobs/usage-and-pricing" target="_blank" rel="noreferrer" className="text-link">Cron schedule limits <ExternalLink size={11} /></a></article>
        </div>
      </section>

      <section className="section-block"><div className="section-heading"><div><h2>Recent source checks</h2><p>Syncs check a recent PIB feed and a configured subset of government listing pages. A successful run does not prove complete coverage.</p></div><Link href="/current-affairs" className="text-link">Source details <ArrowUpRight size={11} /></Link></div>
        <div className="card source-history-list">{syncRuns.length ? syncRuns.slice(0, 6).map((run) => <div className="source-history-row" key={run.id}><span className={`sync-status sync-${run.status}`}>{run.status}</span><div><strong>{run.source_name}</strong><p>{run.message}</p></div><time>{formatDateTimeIST(run.created_at)} IST</time></div>) : <p className="source-history-empty">No source syncs yet.</p>}</div>
      </section>
      <section className="section-block"><div className="notice-box blue-notice"><LockKeyhole size={15} /><span><strong>Backups and removal:</strong> notes, progress and plans are stored in your Supabase project. Use its backup/export tools before destructive changes. Deleting your Supabase Auth owner account cascades personal rows, but the current UI does not include an account-deletion or portable-export workflow.</span></div></section>
    </>
  );
}
