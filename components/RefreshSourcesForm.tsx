"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { refreshSourcesAction, type ActionState } from "@/app/actions";
import { ActionMessage } from "@/components/ActionMessage";

export function RefreshSourcesForm() {
  const [state, action, pending] = useActionState(refreshSourcesAction, {} as ActionState);
  return (
    <div className="refresh-form-wrap">
      {state.error || state.success ? <ActionMessage state={state} /> : null}
      <form action={action}>
        <button type="submit" className="button button-secondary" disabled={pending}>
          <RefreshCw size={14} className={pending ? "spin" : ""} />{pending ? "Checking official sources…" : "Refresh sources"}
        </button>
      </form>
    </div>
  );
}
