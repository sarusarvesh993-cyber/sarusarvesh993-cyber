import { ArrowUpRight, CalendarDays, ExternalLink, Newspaper } from "lucide-react";
import Link from "next/link";
import type { CurrentAffair } from "@/lib/types";
import { formatDateIST } from "@/lib/dates";
import { getPriorityTone } from "@/lib/priorities";

export function CurrentAffairsCard({ item }: { item: CurrentAffair }) {
  return (
    <article className="card news-card">
      <div className="news-card-head">
        <div>
          <div className="news-source"><Newspaper size={13} /> {item.source_name}<span>·</span><CalendarDays size={12} />{item.published_at ? formatDateIST(item.published_at) : "Publication date not supplied"}</div>
          <h3>{item.title}</h3>
        </div>
        <span className={`priority ${getPriorityTone(item.priority)}`}>{item.priority}</span>
      </div>
      {item.description && <p className="news-desc">{item.description}</p>}
      <div className="news-mapping">
        <span className="stage-chip">{item.stage}</span><span className="soft-chip">{item.paper}</span><span className="soft-chip">{item.subject}</span>
      </div>
      <div className="news-analysis">
        <div><h4>Why it matters</h4><p>{item.why_matters}</p></div>
        <div><h4>Static connection</h4><p>{item.static_connection}</p></div>
        <div><h4>Exam lens & action</h4><p>{item.exam_relevance} <strong>Action: {item.action}.</strong></p></div>
      </div>
      <div className="news-practice"><span className="card-label">Practice question</span><p>{item.practice_question}</p></div>
      <div className="news-action">
        <div className="news-related-links"><Link className="text-link" href={`/syllabus?topic=${encodeURIComponent(item.topic_id)}`}>Syllabus topic <ArrowUpRight size={12} /></Link></div>
        <a className="text-link" href={item.source_url} target="_blank" rel="noreferrer">Open source <ExternalLink size={12} /></a>
      </div>
    </article>
  );
}
