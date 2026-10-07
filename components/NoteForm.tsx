"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveNoteAction, type ActionState } from "@/app/actions";
import { ActionMessage } from "@/components/ActionMessage";
import type { SyllabusTopic } from "@/lib/content/syllabus";
import type { TopicNote } from "@/lib/types";

export function NoteForm({ topic, note, lessonSlug }: { topic: SyllabusTopic; note: TopicNote | null; lessonSlug: string }) {
  const [state, action, pending] = useActionState(saveNoteAction, {} as ActionState);
  return (
    <form action={action} className="card lesson-notes-card">
      <input type="hidden" name="topic_id" value={topic.id} />
      <input type="hidden" name="return_slug" value={lessonSlug} />
      <div className="card-label">Your private revision note</div>
      <h3>Capture what you want to remember</h3>
      <textarea className="textarea" name="content" maxLength={20000} defaultValue={note?.content ?? ""} placeholder="Definition · three key ideas · one example · a question to revisit" />
      <div className="lesson-note-footer"><span>{note ? "Saved note loaded" : "No saved note for this topic yet"}</span><button className="button button-primary button-small" type="submit" disabled={pending}><Save size={13} />{pending ? "Saving…" : "Save note"}</button></div>
      <ActionMessage state={state} />
    </form>
  );
}
