"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Search } from "lucide-react";
import { saveTopicProgressAction } from "@/app/actions";
import { OFFICIAL_SYLLABUS_SOURCE, OFFICIAL_PYQ_ARCHIVE, priorityLabels, type SyllabusTopic } from "@/lib/content/syllabus";
import type { PYQ, PYQCoverageRow } from "@/lib/content/pyqs";
import type { TopicProgress } from "@/lib/types";
import { getPriorityTone } from "@/lib/priorities";

type Props = {
  topics: SyllabusTopic[];
  questions: PYQ[];
  coverage: PYQCoverageRow[];
  progress: TopicProgress[];
  includeHistoryOptional: boolean;
  initialTopic?: string;
};

export function SyllabusBrowser({ topics, questions, coverage, progress, includeHistoryOptional, initialTopic = "" }: Props) {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All stages");
  const [paper, setPaper] = useState("All papers");
  const [priority, setPriority] = useState("All priorities");
  const [expanded, setExpanded] = useState<string | null>(initialTopic || null);
  const initial = initialTopic ? topics.find((topic) => topic.id === initialTopic) : null;
  const availableTopics = topics.filter((topic) => !topic.optionalOnly || includeHistoryOptional);
  const papers = [...new Set(availableTopics.filter((topic) => !topic.strategyOnly).map((topic) => topic.paperLabel))];
  const filtered = useMemo(() => {
    const needle = search.toLocaleLowerCase("en-IN").trim();
    return availableTopics.filter((topic) => {
      if (stage !== "All stages" && topic.stage !== stage) return false;
      if (paper !== "All papers" && topic.paperLabel !== paper) return false;
      if (priority !== "All priorities" && topic.priority !== priority) return false;
      if (needle && !`${topic.title} ${topic.subject} ${topic.summary} ${topic.rationale}`.toLocaleLowerCase("en-IN").includes(needle)) return false;
      return true;
    });
  }, [availableTopics, search, stage, paper, priority]);

  const progressByTopic = new Map(progress.map((item) => [item.topic_id, item]));
  const stageOptions = ["All stages", "Prelims", "Mains", "Personality Test"];
  const priorityOptions = ["All priorities", "core", "important", "lower priority", "deprioritize"];

  return (
    <div>
      <div className="card card-pad source-strip">
        <div className="source-strip-copy">
          <div className="card-label">Official syllabus · paraphrased for navigation</div>
          <p>Use UPSC&apos;s notice as the authority. This starter syllabus is keyed to the linked 2026 notice, not to your selected attempt year. Priority labels are this app&apos;s reasoned study recommendations—not an official UPSC ranking or a prediction.</p>
        </div>
        <div className="source-strip-links">
          <a className="text-link" href={OFFICIAL_SYLLABUS_SOURCE.url} target="_blank" rel="noreferrer">Open 2026 official syllabus <ExternalLink size={12} /></a>
          <a className="text-link" href={OFFICIAL_PYQ_ARCHIVE.url} target="_blank" rel="noreferrer">Open official PYQ archive <ExternalLink size={12} /></a>
        </div>
      </div>

      {initial && <div className="notice-box green-notice syllabus-deep-link"><BookOpen size={15} /><span>Showing <strong>{initial.title}</strong>. Clear the search or choose another filter to explore the wider syllabus.</span></div>}

      <div className="syllabus-toolbar">
        <div className="search-wrap"><Search size={14} /><input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topics, subjects or rationale" aria-label="Search syllabus" /></div>
        <select className="select filter-select" value={stage} onChange={(event) => setStage(event.target.value)} aria-label="Filter by exam stage">
          {stageOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
        <select className="select filter-select paper-select" value={paper} onChange={(event) => setPaper(event.target.value)} aria-label="Filter by paper">
          <option>All papers</option>{papers.map((option) => <option key={option}>{option}</option>)}
        </select>
        <select className="select filter-select" value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Filter by recommendation priority">
          {priorityOptions.map((option) => <option key={option} value={option}>{option === "All priorities" ? option : priorityLabels[option as keyof typeof priorityLabels]}</option>)}
        </select>
      </div>

      <div className="syllabus-result-line"><span>{filtered.length} topic groups</span><span>{includeHistoryOptional ? "History Optional coverage enabled" : "History Optional hidden until selected in Preferences"}</span></div>
      <div className="syllabus-list">
        {filtered.map((topic) => {
          const open = expanded === topic.id;
          const topicQuestions = questions.filter((question) => question.topicIds.includes(topic.id) && (includeHistoryOptional || !question.optional));
          const topicYears = [...new Set(topicQuestions.map((question) => question.year))].sort((a, b) => a - b);
          const topicProgress = progressByTopic.get(topic.id);
          return (
            <article className="syllabus-card" key={topic.id} id={topic.id}>
              <button className="syllabus-card-top syllabus-toggle" type="button" onClick={() => setExpanded(open ? null : topic.id)} aria-expanded={open}>
                <div className="syllabus-card-main">
                  <div className="syllabus-meta"><span className="stage-chip">{topic.stage}</span><span className="soft-chip">{topic.paperLabel}</span><span className="soft-chip">{topic.subject}</span></div>
                  <h3 className="syllabus-topic-title">{topic.title}</h3>
                  <p className="syllabus-summary">{topic.summary}</p>
                </div>
                <div className="syllabus-card-aside">
                  <span className={`priority ${getPriorityTone(topic.priority)}`}>{priorityLabels[topic.priority]}</span>
                  <span className="expand-icon">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                </div>
              </button>
              {open && (
                <div className="syllabus-details">
                  <div className="syllabus-details-grid">
                    <div>
                      <h4>Why this priority</h4>
                      <p>{topic.rationale}</p>
                      {topic.strategyOnly && <p className="strategy-warning">Study-strategy guidance only—not an official syllabus item. Deprioritising means managing time, never assuming a topic is safe to ignore.</p>}
                      <div className="topic-progress-form">
                        <div className="form-label">Your progress</div>
                        <form action={saveTopicProgressAction} className="progress-inline-form">
                          <input type="hidden" name="topic_id" value={topic.id} />
                          <select className="select" name="status" defaultValue={topicProgress?.status ?? "learning"} aria-label={`Progress for ${topic.title}`}>
                            <option value="not_started">Not started</option><option value="learning">Learning</option><option value="reviewing">Reviewing</option><option value="confident">Confident</option>
                          </select>
                          <select className="select" name="confidence" defaultValue={String(topicProgress?.confidence ?? 1)} aria-label={`Confidence for ${topic.title}`}>
                            {[0, 1, 2, 3, 4, 5].map((value) => <option value={value} key={value}>Confidence {value}/5</option>)}
                          </select>
                          <button className="button button-secondary button-small" type="submit">Update</button>
                        </form>
                        {topicProgress?.last_studied_on && <span className="form-help">Last updated: {topicProgress.last_studied_on}</span>}
                      </div>
                    </div>
                    <div>
                      <h4>PYQ sample · years {topicYears.length ? topicYears.join(", ") : "not transcribed"}</h4>
                      {topicQuestions.length ? (
                        <div className="pyq-list">
                          {topicQuestions.map((question) => (
                            <div className="pyq-mini" key={question.id}>
                              <div className="pyq-mini-top"><strong>{question.year} · {question.stage} · {question.paper}</strong>{question.optional && <span className="soft-chip">Optional</span>}</div>
                              <p><b>{question.label}.</b> {question.theme}</p>
                              <p className="question-style">Question style: {question.questionStyle}</p>
                              <div className="pyq-links"><a className="text-link" href={question.officialUrl} target="_blank" rel="noreferrer">Official UPSC paper/archive <ExternalLink size={11} /></a>{question.transcriptUrl && <a className="transcript-link" href={question.transcriptUrl} target="_blank" rel="noreferrer">Cross-check transcription</a>}</div>
                            </div>
                          ))}
                        </div>
                      ) : <p>No question is transcribed for this topic in the starter analysis. That is a coverage gap, not evidence of low exam relevance. <a className="text-link inline-link" href={OFFICIAL_PYQ_ARCHIVE.url} target="_blank" rel="noreferrer">Open official archive <ExternalLink size={10} /></a></p>}
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="empty-state"><div className="empty-icon"><Search size={18} /></div><h3>No matching syllabus topics</h3><p>Try a shorter search or reset a filter.</p><button type="button" className="button button-secondary button-small" onClick={() => { setSearch(""); setStage("All stages"); setPaper("All papers"); setPriority("All priorities"); }}>Clear filters</button></div>}

      <section className="section-block">
        <div className="section-heading"><div><h2>PYQ coverage transparency</h2><p>Years shown are starter-sample tags—not a complete paper review or a trend study.</p></div><a className="text-link" href={OFFICIAL_PYQ_ARCHIVE.url} target="_blank" rel="noreferrer">Official archive <ExternalLink size={12} /></a></div>
        <div className="card coverage-scroll">
          <table className="coverage-table">
            <thead><tr><th>Paper / scope</th><th>Years represented in sample</th><th>Coverage gap</th></tr></thead>
            <tbody>{coverage.map((row) => <tr key={row.paper}><td><strong>{row.paper}</strong></td><td className="coverage-years">{row.analyzedYears.join(", ")}</td><td>{row.notReviewedNote}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="notice-box blue-notice coverage-footnote"><span><strong>Method and limit:</strong> PYQ labels are paraphrased themes for a small starter sample, cross-checked with secondary transcriptions where linked. The app has not systematically parsed or audited the official PDFs; UPSC&apos;s paper is the authority for wording and context. Unrepresented years are not evidence of no questions, low relevance, or safe omission. Priority reflects syllabus centrality and foundational value, not a forecast.</span></div>
      </section>
    </div>
  );
}
