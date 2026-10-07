import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isOwnerEmail } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Private sign in" };
export const dynamic = "force-dynamic";

type LoginPageProps = { searchParams: Promise<{ reason?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user && isOwnerEmail(data.user.email)) redirect("/dashboard");
  const params = await searchParams;
  return (
    <main className="login-page">
      <div className="login-aside">
        <div className="brand-lockup">
          <div className="brand-mark"><span>SD</span></div>
          <div><strong>UPSC Study Desk</strong><span>Private preparation workspace</span></div>
        </div>
        <div className="login-aside-copy">
          <span className="eyebrow eyebrow-light">YOUR NEXT STEP, MADE CLEAR</span>
          <h1>Study the syllabus.<br /><em>Think beyond it.</em></h1>
          <p>A calm workspace for a personal CSE plan, source-linked current affairs, revision and topic-wise PYQ analysis.</p>
          <div className="login-quote"><span>“</span><p>Small, deliberate sessions. Honest source trails. No false certainty.</p></div>
        </div>
        <div className="login-aside-bottom"><span>PRIVATE BY DESIGN</span><span>01 / 01 · OWNER ACCESS</span></div>
      </div>
      <div className="login-main">
        <div className="login-card">
          <span className="eyebrow">OWNER ACCESS ONLY</span>
          <h2>Welcome back</h2>
          <p>Sign in with the account provisioned in Supabase Auth. New account registration is intentionally not exposed here.</p>
          {params.reason === "owner" && <div className="form-alert form-alert-error">This application is restricted to the configured owner email.</div>}
          <LoginForm />
          <div className="login-security"><span className="security-icon">✦</span><span>Private notes and progress are stored in your authenticated account, not in this browser&apos;s local storage.</span></div>
        </div>
        <div className="login-main-foot"><span>Source-led · Personalized · Private</span><span>UPSC CSE · Personal use</span></div>
      </div>
    </main>
  );
}
