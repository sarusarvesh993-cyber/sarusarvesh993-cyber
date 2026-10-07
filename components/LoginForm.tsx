"use client";

import { useActionState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { signInAction, type ActionState } from "@/app/actions";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initialState);
  return (
    <form action={action} className="login-fields">
      {state.error && <div className="form-alert form-alert-error" role="alert">{state.error}</div>}
      <label>
        Owner email
        <div className="input-icon-wrap"><Mail size={15} aria-hidden="true" /><input className="input" type="email" name="email" autoComplete="username" required placeholder="you@example.com" /></div>
      </label>
      <label>
        Password
        <div className="input-icon-wrap"><LockKeyhole size={15} aria-hidden="true" /><input className="input" type="password" name="password" autoComplete="current-password" required placeholder="Your Supabase Auth password" /></div>
      </label>
      <button className="button button-primary login-submit" type="submit" disabled={pending}>
        {pending ? "Checking access…" : "Sign in securely"}
      </button>
      <p className="form-help">No public sign-up. Create the owner account in your Supabase dashboard, then set the same address as <code>OWNER_EMAIL</code>.</p>
    </form>
  );
}
