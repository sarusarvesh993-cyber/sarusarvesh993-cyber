"use client";

import type { ActionState } from "@/app/actions";

export function ActionMessage({ state }: { state: ActionState }) {
  if (state.error) return <div className="form-alert form-alert-error" role="alert">{state.error}</div>;
  if (state.success) return <div className="form-alert form-alert-success" role="status">{state.success}</div>;
  return null;
}
