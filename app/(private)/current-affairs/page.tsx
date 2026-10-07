import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarClock, CircleHelp, ExternalLink, Info, Newspaper } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getCurrentAffairs, getSyncRuns } from "@/lib/data";
import { formatDateTimeIST } from "@/lib/dates";
import { CurrentAffairsCard } from "@/components/CurrentAffairsCard";
import { RefreshSourcesForm } from "@/components/RefreshSourcesForm";

export const metadata: Metadata = { title: "Current affairs" };

export default async function CurrentAffairsPage() {
  const { supabase } = await requireOwner();
  const [affairs, syncRuns] = await Promise.all([getCurrentAffairs(supabase, 80), getSyncRuns(supabase, 12)]);
  const latest = syncRuns[0];
  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">Sourced daily reading · syllabus map</span><h1>Current affairs</h1><p>Recent PIB English feed items are filtered by text rules, then linked to a syllabus topic and a practice prompt.</p></div><div className="page-heading-actions"><RefreshSourcesForm /></div></div>
      <div className="current-affairs-banner">
        <div className="current-affairs-banner-icon"><Newspaper size={19} /></div>
        <div><h2>Read the source before the summary</h2><p>The feed&apos;s title, excerpt, date and original link are retained. The “why it matters” and subject mapping are rule-based study prompts—not editorial verification or a complete news digest.</p></div>
      </div>
      <div className="current-affairs-meta-grid">
        <div className="card meta-mini"><div className="meta-mini-icon"><CalendarClock size={15} /></div><div><span>Scheduled check</span><strong>04:00 IST target</strong><small>Vercel Hobby may run within the hour; source or network errors can delay updates.</small></div></div>
        <div className="card meta-mini"><div className="meta-mini-icon orange"><Info size={15} /></div><div><span>Source scope</span><strong>PIB English press releases</strong><small>No unverified social posts, scraped general news or unsupported facts are added.</small></div></div>
        <div className="card meta-mini"><div className="meta-mini-icon blue"><CircleHelp size={15} /></div><div><span>Mapping method</span><strong>Rule-based topic overlap</strong><small>A match can be imperfect. Open the original; dismiss items that are not relevant.</small></div></div>
      </div>
      <div className="notice-box blue-notice"><span><strong>Mapping caveat:</strong> feed wording can match a topic loosely or miss relevant material that uses different words. The library shows selected recent matches only; it does not claim complete current-affairs coverage or fact-check an item&apos;s claims.</span><Link href="/syllabus" className="text-link">Browse mapping topics <ArrowRight size={12} /></Link></div>
      <section className="section-block">
        <div className="section-heading"><div><h2>Recent mapped items</h2><p>{affairs.length} stored item{affairs.length === 1 ? "" : "s"} in this private deployment.</p></div>{latest && <span className="sync-foot inline-sync">Last check {formatDateTimeIST(latest.created_at)} IST · {latest.status}</span>}</div>
        {affairs.length ? <div className="news-list">{affairs.map((item) => <CurrentAffairsCard item={item} key={item.id} />)}</div> : <div className="empty-state"><div className="empty-icon"><Newspaper size={18} /></div><h3>No mapped items yet</h3><p>Start a manual refresh. Only successfully parsed source records with at least one topic mapping will appear.</p><RefreshSourcesForm /></div>}
      </section>
      <section className="section-block source-history-section">
        <div className="section-heading"><div><h2>Source refresh history</h2><p>Recent check outcomes, including partial failures.</p></div><a className="text-link" href="https://www.pib.gov.in/ViewRss.aspx?reg=1&lang=1" target="_blank" rel="noreferrer">PIB RSS details <ExternalLink size={12} /></a></div>
        <div className="card source-history-list">{syncRuns.length ? syncRuns.map((run) => <div className="source-history-row" key={run.id}><span className={`sync-status sync-${run.status}`}>{run.status}</span><div><strong>{run.source_name}</strong><p>{run.message}</p></div><time>{formatDateTimeIST(run.created_at)} IST</time></div>) : <p className="source-history-empty">No refresh has run in this deployment yet.</p>}</div>
      </section>
    </>
  );
}
