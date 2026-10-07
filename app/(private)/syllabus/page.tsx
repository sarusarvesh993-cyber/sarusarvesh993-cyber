import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, History } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getProfile, getTopicProgress } from "@/lib/data";
import { syllabusTopics } from "@/lib/content/syllabus";
import { pyqs, pyqCoverage } from "@/lib/content/pyqs";
import { SyllabusBrowser } from "@/components/SyllabusBrowser";

export const metadata: Metadata = { title: "Syllabus & PYQs" };
type Props = { searchParams: Promise<{ topic?: string }> };

export default async function SyllabusPage({ searchParams }: Props) {
  const { supabase, user } = await requireOwner();
  const [profile, progress, params] = await Promise.all([
    getProfile(supabase, user),
    getTopicProgress(supabase, user.id),
    searchParams,
  ]);
  const includeHistory = Boolean(profile?.include_history_optional || profile?.optional_subject === "History");
  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow">Official structure · transparent sample</span><h1>Syllabus & PYQs</h1><p>Browse stage, paper and topic. Open a recommendation to see the rationale, the reviewed PYQ themes, source links and your topic progress.</p></div>
        <div className="page-heading-actions"><Link className="button button-secondary" href="/settings"><History size={14} /> {includeHistory ? "History Optional on" : "Choose optional coverage"}</Link></div>
      </div>
      <div className="syllabus-callouts">
        <div className="notice-box"><BookOpenText size={15} /><span><strong>Priority is analysis, not prediction.</strong> “Core”, “important”, “lower priority” and “deprioritize” explain suggested time allocation from syllabus centrality, foundation and the labelled PYQ sample. No topic is guaranteed to be absent.</span></div>
        <div className="notice-box blue-notice"><span><strong>Coverage:</strong> the official archive is linked throughout. This first build classifies a selected history sample only; unprocessed years are shown as a data gap, not as evidence that a paper does not exist.</span><Link className="text-link" href="/current-affairs">Connect to current affairs <ArrowRight size={12} /></Link></div>
      </div>
      <SyllabusBrowser topics={syllabusTopics} questions={pyqs} coverage={pyqCoverage} progress={progress} includeHistoryOptional={includeHistory} initialTopic={params.topic ?? ""} />
    </>
  );
}
