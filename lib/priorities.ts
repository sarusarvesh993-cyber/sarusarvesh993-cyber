import type { Priority } from "@/lib/content/syllabus";

export function getPriorityTone(priority: Priority) {
  switch (priority) {
    case "core": return "tone-core";
    case "important": return "tone-important";
    case "lower priority": return "tone-lower";
    case "deprioritize": return "tone-deprioritize";
  }
}

export function summarizePYQYears(years: number[]) {
  const unique = [...new Set(years)].sort((a, b) => a - b);
  if (unique.length === 0) return "No PYQ year is transcribed for this topic in this starter dataset.";
  return unique.join(", ");
}
