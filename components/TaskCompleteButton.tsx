import { Check } from "lucide-react";
import { completeTaskAction } from "@/app/actions";

export function TaskCompleteButton({ id, done }: { id: string; done: boolean }) {
  if (done) return <span className="task-check done" aria-label="Completed"><Check size={13} /></span>;
  return <form action={completeTaskAction}><input type="hidden" name="task_id" value={id} /><button className="task-check task-check-button" type="submit" aria-label="Mark task complete"><Check size={13} /></button></form>;
}
