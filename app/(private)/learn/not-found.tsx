import Link from "next/link";

export default function LessonNotFound() {
  return <div className="empty-state"><h3>Lesson not found</h3><p>This lesson is not part of the enabled library. Enable History Optional coverage in Preferences if you expect an optional-only topic.</p><Link href="/learn" className="button button-secondary button-small">Back to concept library</Link></div>;
}
