"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createReviewCardAction, type ActionState } from "@/app/actions";
import { ActionMessage } from "@/components/ActionMessage";
import type { SyllabusTopic } from "@/lib/content/syllabus";

export function ReviewCardForm({ topics }: { topics: SyllabusTopic[] }) {
  const [state, action, pending] = useActionState(createReviewCardAction, {} as ActionState);
  return (
    <form action={action} className="card card-pad form-card">
      <div className="card-label">Make recall visible</div>
      <h3 className="card-title form-card-title">Create an active-recall card</h3>
      <div className="form-grid">
        <div className="form-field full">
          <label htmlFor="review-topic">Syllabus topic (optional)</label>
          <select className="select" id="review-topic" name="topic_id" defaultValue="">
            <option value="">General revision</option>{topics.filter((topic) => !topic.strategyOnly).map((topic) => <option value={topic.id} key={topic.id}>{topic.paperLabel} · {topic.title}</option>)}
          </select>
        </div>
        <div className="form-field full"><label htmlFor="review-prompt">Question / prompt</label><input className="input" id="review-prompt" name="prompt" maxLength={1200} required placeholder="What can I explain without looking?" /></div>
        <div className="form-field full"><label htmlFor="review-answer">Reference answer / checklist</label><textarea className="textarea" id="review-answer" name="answer" maxLength={4000} required placeholder="Write the key points you want to retrieve and check." /></div>
      </div>
      <ActionMessage state={state} />
      <div className="form-footer"><p>Cards are private and due today. Ratings schedule the next review with an inspectable SM-2-style rule.</p><button className="button button-primary" type="submit" disabled={pending}><Plus size={14} />{pending ? "Adding…" : "Add review card"}</button></div>
    </form>
  );
}
