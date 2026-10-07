"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveNoteAction, type ActionState } from "@/app/actions";
import { ActionMessage } from "@/components/ActionMessage";
import type { SyllabusTopic } from "@/lib/content/syllabus";
import type { TopicNote } from "@/lib/types";

type Props = { topics: SyllabusTopic[]; notes: TopicNote[]; initialTopic?: string };

export function NotesWorkspace({ topics, notes, initialTopic = "" }: Props) {
  const available = topics.filter((topic) => !topic.strategyOnly);
  const firstTopic = available.find((topic) => topic.id === initialTopic) ?? available[0];
  const [topicId, setTopicId] = useState(firstTopic?.id ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(notes.map((note) => [note.topic_id, note.content])));
  const [state, action, pending] = useActionState(saveNoteAction, {} as ActionState);
  const topic = useMemo(() => available.find((item) => item.id === topicId), [available, topicId]);
  const value = drafts[topicId] ?? "";

  function updateDraft(nextValue: string) {
    setDrafts((current) => ({ ...current, [topicId]: nextValue }));
  }

  return (
    <div className="notes-workspace">
      <div className="card note-selector-card">
        <div className="card-label">Private to your owner account</div>
        <label className="form-label" htmlFor="note-topic">Choose a syllabus topic</label>
        <select id="note-topic" className="select" value={topicId} onChange={(event) => setTopicId(event.target.value)}>
          {available.map((item) => <option key={item.id} value={item.id}>{item.paperLabel} · {item.title}</option>)}
        </select>
        <div className="note-selector-foot"><span>{notes.length} saved topic note{notes.length === 1 ? "" : "s"}</span><span>Encrypted in transit · RLS per user</span></div>
      </div>
      <form action={action} className="card note-editor-card">
        <input type="hidden" name="topic_id" value={topicId} />
        <input type="hidden" name="return_slug" value={topic?.id ?? ""} />
        <div className="note-editor-head"><div><div className="card-label">{topic?.subject ?? "Personal notes"}</div><h2>{topic?.title ?? "Topic note"}</h2></div><span className="soft-chip">Private note</span></div>
        <p className="note-editor-hint">Use this space for your own compressed explanation, examples, doubts and source links. Do not paste copyrighted book chapters or large question-paper text.</p>
        <textarea className="textarea note-editor" name="content" value={value} onChange={(event) => updateDraft(event.target.value)} maxLength={20000} placeholder="Write a definition, a short causal chain, an example, a PYQ insight or a question to revisit…" />
        <div className="note-editor-footer"><span>{value.length.toLocaleString()} / 20,000 characters · Save to persist</span><button type="submit" className="button button-primary" disabled={pending}><Save size={14} />{pending ? "Saving…" : "Save note"}</button></div>
        <ActionMessage state={state} />
      </form>
      <div className="notice-box blue-notice"><span><strong>Privacy:</strong> these notes are stored in Supabase Postgres and protected by a per-user row policy. They are not stored in browser local storage or placed in the Git repository.</span></div>
    </div>
  );
}
