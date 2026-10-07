import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText, LockKeyhole } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getNotes, getProfile } from "@/lib/data";
import { syllabusTopics } from "@/lib/content/syllabus";
import { NotesWorkspace } from "@/components/NotesWorkspace";

export const metadata: Metadata = { title: "My notes" };
type Props = { searchParams: Promise<{ topic?: string }> };

export default async function NotesPage({ searchParams }: Props) {
  const { supabase, user } = await requireOwner();
  const [profile, notes, params] = await Promise.all([getProfile(supabase, user), getNotes(supabase, user.id), searchParams]);
  const savedTopics = new Set(notes.map((note) => note.topic_id));
  const includeHistory = Boolean(profile?.include_history_optional || profile?.optional_subject === "History");
  const topics = syllabusTopics.filter((topic) => !topic.optionalOnly || includeHistory || savedTopics.has(topic.id));
  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">Personal knowledge · stored securely</span><h1>My notes</h1><p>Write compact, topic-linked explanations, examples, doubts and source references. Your notes live in your Supabase account, protected by row-level security.</p></div><Link className="button button-secondary" href="/syllabus"><FileText size={14} /> Open syllabus</Link></div>
      <div className="notice-box blue-notice"><LockKeyhole size={15} /><span><strong>Private record:</strong> only your signed-in account can read or change your notes under the database row policy. Avoid storing sensitive identity details. Backups and account deletion are managed from your Supabase project.</span></div>
      {notes.length > 0 && <div className="notes-summary-row"><span><strong>{notes.length}</strong> topic notes saved</span><span>Most recently edited {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" }).format(new Date(notes[0].updated_at))}</span></div>}
      <NotesWorkspace topics={topics} notes={notes} initialTopic={params.topic ?? ""} />
      <section className="section-block note-index-section"><div className="section-heading"><div><h2>Recent notes</h2><p>Jump to a note from its topic. New notes are saved only after you press Save.</p></div></div>
        {notes.length ? <div className="recent-note-grid">{notes.slice(0, 8).map((note) => {
          const topic = syllabusTopics.find((item) => item.id === note.topic_id);
          return <Link className="card recent-note-card" href={`/notes?topic=${encodeURIComponent(note.topic_id)}`} key={note.id}><span className="card-label">{topic?.paperLabel ?? "Syllabus topic"}</span><h3>{topic?.title ?? note.topic_id}</h3><p>{note.content.slice(0, 170) || "Empty note · click to edit"}{note.content.length > 170 ? "…" : ""}</p><span className="recent-note-footer">Updated {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" }).format(new Date(note.updated_at))}<ArrowUpRight size={12} /></span></Link>;
        })}</div> : <div className="empty-state"><div className="empty-icon"><FileText size={18} /></div><h3>Your first topic note is ready</h3><p>Choose a topic above, write a concise note and save. No demo text is prefilled.</p></div>}
      </section>
    </>
  );
}
