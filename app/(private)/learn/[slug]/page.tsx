import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, BookMarked, CircleHelp, ExternalLink, Lightbulb, NotebookPen, RotateCcw, ShieldAlert } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getNoteForTopic, getProfile } from "@/lib/data";
import { getLesson } from "@/lib/content/lessons";
import { getSyllabusTopic } from "@/lib/content/syllabus";
import { NoteForm } from "@/components/NoteForm";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  return { title: lesson?.title ?? "Concept lesson" };
}

export default async function LessonPage({ params }: Props) {
  const { supabase, user } = await requireOwner();
  const [{ slug }, profile] = await Promise.all([params, getProfile(supabase, user)]);
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  if (lesson.topicId.startsWith("historyopt.") && !profile?.include_history_optional && profile?.optional_subject !== "History") notFound();
  const topic = getSyllabusTopic(lesson.topicId);
  if (!topic) notFound();
  const note = await getNoteForTopic(supabase, user.id, lesson.topicId);

  return (
    <>
      <div className="lesson-back-row"><Link className="text-link" href="/learn"><ArrowLeft size={12} /> Concept library</Link><span className="soft-chip">{lesson.stage}</span></div>
      <div className="page-heading lesson-page-heading"><div><span className="eyebrow">{lesson.readingTime} · guided explanation</span><h1>{lesson.title}</h1><p>{lesson.stage}. Use the references at the bottom to check source wording and examples.</p></div><Link className="button button-secondary" href={`/syllabus?topic=${encodeURIComponent(topic.id)}`}><BookMarked size={14} /> Syllabus topic</Link></div>
      <div className="lesson-body">
        <article className="card lesson-main">
          <section className="lesson-definition"><div className="lesson-section-kicker"><Lightbulb size={14} /> Definition</div><p className="lesson-definition-text">{lesson.definition}</p></section>
          <section className="lesson-section"><h3>Background</h3><ul>{lesson.background.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
          <section className="lesson-section"><h3>Key ideas</h3><ul>{lesson.keyIdeas.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
          <section className="lesson-section"><h3>Examples and application</h3><ul>{lesson.examples.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
          <section className="lesson-section lesson-warning-section"><h3><ShieldAlert size={14} /> Prelims traps</h3><ul>{lesson.prelimsTraps.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
          <section className="lesson-section"><h3>Mains answer angles</h3><ul>{lesson.mainsAngles.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
          <section className="lesson-section revision-box"><h3><RotateCcw size={14} /> Short revision note</h3><p>{lesson.revisionNote}</p></section>
          <section className="lesson-section"><h3><CircleHelp size={14} /> Practice questions</h3><ol>{lesson.practiceQuestions.map((item, index) => <li key={index}>{item}</li>)}</ol></section>
          <section className="lesson-section source-list"><h3>Sources to verify and continue</h3><p>Read the primary source where the question depends on exact wording. Any historical interpretation above is a study explanation, not an official UPSC answer key.</p>{lesson.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} <ExternalLink size={11} /></a>)}</section>
        </article>
        <aside className="lesson-aside">
          <div className="card lesson-aside-card"><h3>Connect the topic</h3><p>Use related themes to move between static content, PYQs and current updates.</p>{lesson.related.map((item) => <Link key={item.href + item.label} href={item.href}>{item.label} <ArrowUpRight size={11} /></Link>)}</div>
          <div className="card lesson-aside-card"><h3><NotebookPen size={14} /> My note</h3><p>Your note is saved per topic in your secure account database.</p></div>
          <NoteForm topic={topic} note={note} lessonSlug={lesson.id} />
        </aside>
      </div>
    </>
  );
}
