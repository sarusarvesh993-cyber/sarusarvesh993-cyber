import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpenCheck, Clock3, Sparkles } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { lessons } from "@/lib/content/lessons";

export const metadata: Metadata = { title: "Concept library" };

const descriptions: Record<string, string> = {
  "harappan-evidence": "Use archaeology carefully: what the evidence supports, and where an inference should stay qualified.",
  "vedic-transition": "Compare period change without flattening regional or source variation.",
  "ashokan-dhamma": "Read inscriptions as evidence and separate ethical ideas from institutional interpretation.",
  "chola-architecture": "Turn features, examples and patronage into a focused culture answer.",
  "colonial-economy": "Explain economic mechanisms and causation without reducing a complex period to one factor.",
  "quit-india": "Build a sequence from context to mobilisation, response and qualified consequences.",
  "federalism-basics": "A reusable GS-II frame for institutions, federalism and separation of powers.",
  "active-recall": "Use short retrieval prompts and a transparent review schedule rather than passive rereading.",
};

export default async function LearnIndexPage() {
  const { supabase, user } = await requireOwner();
  const profile = await getProfile(supabase, user);
  const includeHistory = Boolean(profile?.include_history_optional || profile?.optional_subject === "History");
  const visibleLessons = lessons.filter((lesson) => includeHistory || !lesson.topicId.startsWith("historyopt."));
  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">Step-by-step explanations</span><h1>Concept library</h1><p>Definitions, background, key ideas, examples, Prelims traps, Mains angles, revision prompts and practice questions.</p></div><Link className="button button-secondary" href="/syllabus"><BookOpenCheck size={14} /> Browse syllabus</Link></div>
      <div className="notice-box blue-notice"><Sparkles size={15} /><span><strong>Content policy:</strong> lessons separate background from analysis and link to official syllabus/papers. This is a focused starter library, not a replacement for the complete syllabus, primary sources or standard texts.</span></div>
      <section className="lesson-grid learn-grid">
        {visibleLessons.map((lesson, index) => <Link href={`/learn/${lesson.id}`} className="card lesson-card" key={lesson.id}>
          <div className={`lesson-icon lesson-icon-${index % 4}`}><BookOpenCheck size={17} /></div>
          <div className="lesson-card-meta"><span>{lesson.stage}</span><span><Clock3 size={11} /> {lesson.readingTime}</span></div>
          <h3>{lesson.title}</h3><p>{descriptions[lesson.id] ?? lesson.definition}</p>
          <div className="lesson-card-footer"><span>{lesson.practiceQuestions.length} practice prompts</span><span className="text-link">Open lesson <ArrowRight size={11} /></span></div>
        </Link>)}
      </section>
    </>
  );
}
