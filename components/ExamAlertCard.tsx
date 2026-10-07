import { ExternalLink, ShieldAlert } from "lucide-react";
import { dismissExamAlertAction } from "@/app/actions";
import type { ExamAlert } from "@/lib/types";
import { formatDateIST } from "@/lib/dates";

function shownDate(value: string | null, label: string) {
  return <span className="alert-date"><strong>{label}</strong> · {value ? formatDateIST(value) : "not extracted — verify notice"}</span>;
}

export function ExamAlertCard({ alert, hasEligibilityContext }: { alert: ExamAlert; hasEligibilityContext: boolean }) {
  return (
    <article className="card alert-card">
      <div>
        <div className="news-source"><ShieldAlert size={13} /> Potential · {alert.source_name}</div>
        <h3>{alert.exam_name}</h3>
        <p>{alert.title}</p>
        <div className="alert-dates">
          {shownDate(alert.notification_date, "Notice date")}
          {shownDate(alert.application_deadline, "Deadline")}
          {shownDate(alert.exam_date, "Exam date")}
        </div>
        <div className="alert-source-row">
          <a className="text-link" href={alert.source_url} target="_blank" rel="noreferrer">Official notice link <ExternalLink size={12} /></a>
          <a className="transcript-link" href={alert.source_page_url} target="_blank" rel="noreferrer">Official notice board</a>
        </div>
        <div className="alert-rationale"><strong>Why it may be relevant</strong><p>{alert.relevance_rationale}</p></div>
        <div className="alert-rationale"><strong>Eligibility summary</strong><p>{alert.eligibility_summary ?? "Not extracted from this listing. Open the official notice for the exact education, age, category and attempt rules."} {hasEligibilityContext && " Your saved eligibility note is a reminder only; no eligibility match has been calculated."}</p></div>
        {alert.overlap?.length > 0 && <div className="news-mapping">{alert.overlap.map((item) => <span className="soft-chip" key={item}>{item}</span>)}</div>}
        <div className="alert-callout alert-callout-block">This is an automatically detected candidate link, not a verified eligibility or deadline alert.</div>
      </div>
      <div className="alert-actions">
        <form action={dismissExamAlertAction}><input type="hidden" name="alert_id" value={alert.id} /><button type="submit" className="button button-quiet button-small">Dismiss</button></form>
      </div>
    </article>
  );
}
