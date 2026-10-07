"use client";

import { useState } from "react";
import { Check, Clock3, Eye, RotateCcw } from "lucide-react";
import type { ReviewCard } from "@/lib/types";
import { gradeReviewAction } from "@/app/actions";
import { getSyllabusTopic } from "@/lib/content/syllabus";

export function ReviewCardItem({ card }: { card: ReviewCard }) {
  const [revealed, setRevealed] = useState(false);
  const topic = card.topic_id ? getSyllabusTopic(card.topic_id) : null;
  return (
    <article className="review-card">
      <div className="review-card-top">
        <span className="card-label">{topic?.subject ?? "Active recall"}</span>
        <span className="review-due"><Clock3 size={12} /> Due {card.next_due_on}</span>
      </div>
      <p className="review-card-question">{card.prompt}</p>
      {!revealed ? (
        <button className="review-reveal" type="button" onClick={() => setRevealed(true)}><Eye size={13} /> Reveal reference answer</button>
      ) : (
        <>
          <div className="review-answer">{card.answer}</div>
          <p className="review-instruction">Compare against your recall, then choose a rating. The next date changes with your response.</p>
          <div className="review-actions">
            <form action={gradeReviewAction}><input type="hidden" name="card_id" value={card.id} /><input type="hidden" name="rating" value="1" /><button className="button button-danger button-small" type="submit"><RotateCcw size={12} /> Again · 1 day</button></form>
            <form action={gradeReviewAction}><input type="hidden" name="card_id" value={card.id} /><input type="hidden" name="rating" value="3" /><button className="button button-quiet button-small" type="submit">Hard</button></form>
            <form action={gradeReviewAction}><input type="hidden" name="card_id" value={card.id} /><input type="hidden" name="rating" value="4" /><button className="button button-secondary button-small" type="submit"><Check size={12} /> Good</button></form>
            <form action={gradeReviewAction}><input type="hidden" name="card_id" value={card.id} /><input type="hidden" name="rating" value="5" /><button className="button button-secondary button-small" type="submit">Easy</button></form>
          </div>
        </>
      )}
    </article>
  );
}
