import Link from "next/link";
import { ShieldCheck, Database, LockKeyhole, CalendarClock } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const configured = isSupabaseConfigured();
  return (
    <main className="setup-page">
      <section className="setup-card">
        <div className="brand-lockup brand-lockup-dark">
          <div className="brand-mark"><span>SD</span></div>
          <div><strong>UPSC Study Desk</strong><span>Private preparation workspace</span></div>
        </div>
        <div className="setup-orbit" aria-hidden="true"><span>UPSC<br />CSE</span></div>
        <p className="eyebrow">PRIVATE INSTANCE</p>
        <h1>{configured ? "Your private desk is ready for sign-in." : "Secure setup comes before study data."}</h1>
        <p className="setup-copy">
          {configured
            ? "Use the owner account created in Supabase Auth. Only the email configured as OWNER_EMAIL is accepted by this application."
            : "This build does not contain demo notes, sample progress or a public account. Connect a private Supabase project and set server-only environment variables before using it."}
        </p>
        <div className="setup-checks">
          <div><ShieldCheck size={18} /><span>Owner-email gate on every private page and action</span></div>
          <div><Database size={18} /><span>Per-user database policies for notes, tasks and review cards</span></div>
          <div><LockKeyhole size={18} /><span>Secrets remain on the server; none are bundled in the browser</span></div>
          <div><CalendarClock size={18} /><span>Daily source check targets about 04:00 IST; hosting may delay it</span></div>
        </div>
        <div className="setup-foot">
          <span className={`status-dot ${configured ? "status-dot-good" : ""}`} />
          <span>{configured ? "Server environment detected" : "Supabase environment not detected"}</span>
          {configured && <Link className="button button-primary button-small" href="/login">Go to sign in</Link>}
        </div>
        {!configured && (
          <p className="setup-note">Run the PowerShell deployment script after creating your private Supabase project, then finish the one-time Auth and Vercel protection checks described in the README.</p>
        )}
      </section>
      <footer className="setup-footer">No exam outcome is guaranteed. Study priorities are analysis, not UPSC predictions.</footer>
    </main>
  );
}
