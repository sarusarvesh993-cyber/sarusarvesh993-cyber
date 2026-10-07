import Link from "next/link";
import type { Metadata } from "next";
import { BellRing, ExternalLink, ShieldAlert } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getExamAlerts, getProfile } from "@/lib/data";
import { getISTDateKey } from "@/lib/dates";
import { RefreshSourcesForm } from "@/components/RefreshSourcesForm";
import { ExamAlertCard } from "@/components/ExamAlertCard";

export const metadata: Metadata = { title: "Official exam alerts" };

const officialLinks = [
  { label: "UPSC notices and updates", href: "https://www.upsc.gov.in/whats-new" },
  { label: "SSC official website", href: "https://ssc.gov.in/" },
  { label: "RRB Chandigarh official site", href: "https://www.rrbcdg.gov.in/" },
];

export default async function ExamAlertsPage() {
  const { supabase, user } = await requireOwner();
  const profile = await getProfile(supabase, user);
  const alerts = await getExamAlerts(supabase, user.id, getISTDateKey(), profile?.exam_scope ?? "upsc");
  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">Official listing candidates · verify every notice</span><h1>Government exam alerts</h1><p>Selected official UPSC and optional SSC/RRB listing pages are checked for potential notice links. This is a discovery aid, not a complete vacancy feed.</p></div><div className="page-heading-actions"><RefreshSourcesForm /></div></div>
      <div className="notice-box red-notice"><ShieldAlert size={15} /><span><strong>No eligibility decisions.</strong> Dates and exam labels may be absent or misclassified in listing pages. Open the official notice and verify application dates, eligibility, amendments and deadlines yourself. This app does not promise coverage or determine whether you qualify.</span></div>
      <div className="alert-scope-card card">
        <div><span className="card-label">Your saved source scope</span><h2>{profile?.exam_scope === "broad" ? "UPSC · SSC · RRB Chandigarh" : profile?.exam_scope === "upsc_ssc" ? "UPSC · SSC" : "UPSC only"}</h2><p>Only official listing hosts are allowed by the first-release parser. The configured RRB source covers one regional board, not all Railways recruitment boards.</p></div>
        <div className="official-link-list">{officialLinks.map((item) => <a key={item.href} href={item.href} target="_blank" rel="noreferrer">{item.label} <ExternalLink size={12} /></a>)}</div>
      </div>
      <div className="alert-summary-row"><div className="alert-summary-icon"><BellRing size={16} /></div><div><strong>{alerts.active.length} potential notice link{alerts.active.length === 1 ? "" : "s"}</strong><p>{alerts.active.length ? "Detection is heuristic. Review the original notice even if a date or description is shown." : "No notice candidates were stored from the latest syncs. Always consult the official portals for amendments and newly issued notices."}</p></div></div>
      <section className="section-block">
        <div className="section-heading"><div><h2>Active candidates</h2><p>Links collected from the official source listing; nothing here confirms eligibility.</p></div></div>
        {alerts.active.length ? <div className="alert-list">{alerts.active.map((alert) => <ExamAlertCard key={alert.id} alert={alert} hasEligibilityContext={Boolean(profile?.eligibility_context)} />)}</div> : <div className="empty-state"><div className="empty-icon"><BellRing size={18} /></div><h3>No active candidate links</h3><p>A quiet feed is not evidence that there are no government vacancies. Recheck the official portals and your selected alert scope.</p><div className="empty-actions"><RefreshSourcesForm /><Link className="button button-secondary button-small" href="/settings">Change source scope</Link></div></div>}
      </section>
      {alerts.dismissed.length > 0 && <section className="section-block"><div className="section-heading"><div><h2>Dismissed links</h2><p>Dismissed only for your account; the underlying source record remains shared.</p></div></div><div className="card dismissed-list">{alerts.dismissed.slice(0, 12).map((alert) => <a href={alert.source_url} key={alert.id} target="_blank" rel="noreferrer"><span><strong>{alert.exam_name}</strong><small>{alert.title}</small></span><ExternalLink size={12} /></a>)}</div></section>}
    </>
  );
}
