"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveProfileAction, type ActionState } from "@/app/actions";
import type { Profile } from "@/lib/types";
import { ActionMessage } from "@/components/ActionMessage";

type ProfileFormProps = {
  profile: Profile | null;
  onboarding?: boolean;
  emailConfigured: boolean;
};

const initialState: ActionState = {};

export function ProfileForm({ profile, onboarding = false, emailConfigured }: ProfileFormProps) {
  const [state, action, pending] = useActionState(saveProfileAction, initialState);
  const thisYear = new Date().getUTCFullYear();
  return (
    <form action={action} className="card onboarding-form">
      <input type="hidden" name="return_to" value={onboarding ? "onboarding" : "settings"} />
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="target_year"><span className="question-index">01</span>Target attempt year<span className="required">*</span></label>
          <select className="select" name="target_year" id="target_year" required defaultValue={profile?.target_year ? String(profile.target_year) : ""}>
            <option value="" disabled>Choose a year</option>
            {Array.from({ length: 10 }, (_, index) => thisYear + index).map((year) => <option key={year} value={year}>{year}{year === thisYear ? " · current cycle" : ""}</option>)}
          </select>
          <span className="form-help">Saved as your goal. This starter plan does not infer an exam date or change intensity from the attempt year alone.</span>
        </div>
        <div className="form-field">
          <label htmlFor="daily_minutes"><span className="question-index">02</span>Study time available per day<span className="required">*</span></label>
          <select className="select" name="daily_minutes" id="daily_minutes" required defaultValue={profile?.daily_minutes ? String(profile.daily_minutes) : ""}>
            <option value="" disabled>Choose a realistic amount</option>
            {[30, 45, 60, 90, 120, 180, 240, 300, 360].map((minutes) => <option key={minutes} value={minutes}>{minutes < 60 ? `${minutes} minutes` : `${minutes / 60} ${minutes === 60 ? "hour" : "hours"}`}</option>)}
          </select>
          <span className="form-help">The weekly plan will fit sessions to this budget.</span>
        </div>
        <div className="form-field">
          <label htmlFor="prep_level"><span className="question-index">03</span>Current preparation level<span className="required">*</span></label>
          <select className="select" name="prep_level" id="prep_level" required defaultValue={profile?.prep_level ?? ""}>
            <option value="" disabled>Choose the closest fit</option>
            <option value="starting">Starting · building the first pass</option>
            <option value="building">Building · studying and practising</option>
            <option value="revision">Revision · consolidating and testing</option>
          </select>
          <span className="form-help">This changes the balance of concept study, recall and answer practice.</span>
        </div>
        <div className="form-field">
          <label htmlFor="preferred_language"><span className="question-index">04</span>Preferred study language<span className="required">*</span></label>
          <select className="select" name="preferred_language" id="preferred_language" required defaultValue={profile?.preferred_language ?? ""}>
            <option value="" disabled>Choose a language preference</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Bilingual">Bilingual · Hindi and English</option>
          </select>
          <span className="form-help">Saved to personalise planning. The first-release lesson library is English-first; no automatic translation is claimed.</span>
        </div>
        <div className="form-field full">
          <label htmlFor="optional_subject"><span className="question-index">05</span>Optional subject and History Optional coverage</label>
          <select className="select" name="optional_subject" id="optional_subject" defaultValue={profile?.optional_subject ?? ""}>
            <option value="">Not provided yet</option>
            <option value="Not decided">Not decided</option>
            <option value="History">History</option>
            <option value="Geography">Geography</option>
            <option value="Political Science and International Relations">Political Science and International Relations</option>
            <option value="Public Administration">Public Administration</option>
            <option value="Sociology">Sociology</option>
            <option value="Anthropology">Anthropology</option>
            <option value="Economics">Economics</option>
            <option value="Philosophy">Philosophy</option>
            <option value="Other">Other</option>
          </select>
          <label className="form-check" htmlFor="include_history_optional">
            <input type="checkbox" id="include_history_optional" name="include_history_optional" defaultChecked={profile?.include_history_optional ?? false} />
            <span>Include a separate History Optional syllabus and PYQ view. This is off until you select it; you can change it later.</span>
          </label>
          <span className="form-help">If you select History as your optional, the History Optional topics are included even if this separate analysis toggle is off.</span>
        </div>
        <div className="form-field full">
          <label htmlFor="exam_scope"><span className="question-index">06</span>Official exam alert scope<span className="required">*</span></label>
          <select className="select" id="exam_scope" name="exam_scope" required defaultValue={profile?.exam_scope ?? ""}>
            <option value="" disabled>Choose which sources to watch</option>
            <option value="upsc">UPSC notices only</option>
            <option value="upsc_ssc">UPSC and SSC official listings</option>
            <option value="broad">UPSC, SSC and one RRB notice board</option>
          </select>
          <span className="form-help">The first release checks these official listing pages on a best-effort basis; it is not a complete government vacancy feed.</span>
        </div>
        <div className="form-field full">
          <label htmlFor="eligibility_context">Eligibility context for your own checks (optional)</label>
          <textarea className="textarea" id="eligibility_context" name="eligibility_context" maxLength={800} defaultValue={profile?.eligibility_context ?? ""} placeholder="For example: education status, broad age band, or constraints you want to remember when opening notices." />
          <span className="form-help">Do not enter sensitive identity numbers. This note is private to your account. The app does not decide or guarantee eligibility; always verify the official notice.</span>
        </div>
        <div className="form-field full">
          <span className="form-label">Notification preference</span>
          <div className="language-note">
            <strong>In-app alerts are available when you sign in.</strong> {emailConfigured ? "You may also opt in to one email for newly detected, explicitly dated official exam notices." : "External email is not configured; alerts remain in-app."}
          </div>
          <label className="form-check" htmlFor="email_alerts">
            <input type="checkbox" id="email_alerts" name="email_alerts" defaultChecked={profile?.email_alerts ?? false} disabled={!emailConfigured} />
            <span>Email me about new official exam notices. Email is optional and off until you opt in.</span>
          </label>
        </div>
      </div>
      <div className="form-footer">
        <p>{onboarding ? "Your preferences are not guessed. You can revise them in Preferences later." : "Saving preferences rebuilds future generated sessions; completed tasks, notes and review history are kept."}</p>
        <button type="submit" className="button button-primary" disabled={pending}><Save size={14} />{pending ? "Saving your plan…" : onboarding ? "Save preferences & build my week" : "Save preferences"}</button>
      </div>
      <div className="form-message-slot"><ActionMessage state={state} /></div>
    </form>
  );
}
