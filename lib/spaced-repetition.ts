import { addDaysToDateKey } from "@/lib/dates";

export type ReviewRating = 1 | 3 | 4 | 5;
export type ReviewState = {
  interval_days: number;
  ease_factor: number;
  repetitions: number;
};
export type ReviewSchedule = ReviewState & { next_due_on: string };

const validRatings = new Set<number>([1, 3, 4, 5]);

/** A small, inspectable SM-2-style interval scheduler (not a guarantee of optimal retention). */
export function scheduleNextReview(
  state: ReviewState,
  rating: ReviewRating,
  today: string,
): ReviewSchedule {
  if (!validRatings.has(rating)) throw new Error("Rating must be one of 1, 3, or 4, 5.");

  const failed = rating < 3;
  const easeDelta = 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02);
  const ease_factor = Math.max(1.3, Number((state.ease_factor + easeDelta).toFixed(2)));

  let repetitions = state.repetitions;
  let interval_days: number;
  if (failed) {
    repetitions = 0;
    interval_days = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval_days = 1;
    else if (repetitions === 2) interval_days = 6;
    else interval_days = Math.max(1, Math.round(state.interval_days * ease_factor));
  }

  return {
    interval_days,
    ease_factor,
    repetitions,
    next_due_on: addDaysToDateKey(today, interval_days),
  };
}
