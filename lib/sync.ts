import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parsePIBFeed, getPibFeedUrl, selectRecentItems, type ParsedPIBItem } from "@/lib/news";
import { fetchExamNotices, type DetectedExamNotice } from "@/lib/exam-alerts";
import type { Profile } from "@/lib/types";
import { addDaysToDateKey, getISTDateKey } from "@/lib/dates";

export type SyncTrigger = "cron" | "manual";
export type SyncSummary = {
  status: "success" | "partial" | "failed";
  currentAffairsAdded: number;
  examAlertsAdded: number;
  checkedAt: string;
  messages: string[];
};

function errorText(error: unknown) {
  return (error instanceof Error ? error.message : "Source request failed").replace(/[\r\n]+/g, " ").slice(0, 220);
}

async function fetchPIBFeed(initialUrl: string) {
  let url = getPibFeedUrl(initialUrl);
  for (let hop = 0; hop <= 3; hop += 1) {
    const response = await fetch(url, {
      headers: { "user-agent": "UPSC-Study-Desk/0.1 (personal study tool; links to official releases)", accept: "application/rss+xml,application/xml,text/xml" },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
      redirect: "manual",
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) throw new Error("PIB RSS redirected without a Location header.");
    try { url = getPibFeedUrl(new URL(location, url).toString()); }
    catch { throw new Error("PIB RSS redirected outside the official host allowlist."); }
  }
  throw new Error("PIB RSS exceeded the safe redirect limit.");
}

async function fetchPIBItems(now = new Date()): Promise<ParsedPIBItem[]> {
  const response = await fetchPIBFeed(getPibFeedUrl());
  if (!response.ok) throw new Error(`PIB RSS returned HTTP ${response.status}.`);
  const xml = await response.text();
  if (xml.length > 3_000_000) throw new Error("PIB feed exceeded the 3 MB safety limit.");
  return selectRecentItems(parsePIBFeed(xml), now, 10).slice(0, 50);
}

function asCurrentAffair(item: ParsedPIBItem) {
  const { mapping } = item;
  return {
    source_url: item.source_url,
    source_name: "Press Information Bureau (PIB)",
    title: item.title,
    description: item.description,
    published_at: item.published_at,
    stage: mapping.stage,
    paper: mapping.paper,
    subject: mapping.subject,
    topic_id: mapping.topic_id,
    why_matters: mapping.why_matters,
    static_connection: mapping.static_connection,
    exam_relevance: mapping.exam_relevance,
    action: mapping.action,
    priority: mapping.priority,
    practice_question: mapping.practice_question,
  };
}

function asExamAlert(notice: DetectedExamNotice) {
  return {
    source_url: notice.source_url,
    source_page_url: notice.source_page_url,
    source_name: notice.source_name,
    exam_name: notice.exam_name,
    title: notice.title,
    notification_date: notice.notification_date,
    application_deadline: notice.application_deadline,
    exam_date: notice.exam_date,
    eligibility_summary: notice.eligibility_summary,
    relevance_rationale: notice.relevance_rationale,
    overlap: notice.overlap,
    detection_status: "potential",
    last_seen_at: notice.last_seen_at,
  };
}

async function writeSyncRun(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  sourceName: string,
  trigger: SyncTrigger,
  status: "success" | "partial" | "failed",
  itemsAdded: number,
  message: string,
) {
  const { error } = await admin.from("source_sync_runs").insert({
    source_name: sourceName,
    trigger_kind: trigger,
    status,
    items_added: itemsAdded,
    message: message.slice(0, 900),
  });
  if (error) console.error(`[sync:log:${sourceName}]`, error.message);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

async function sendNewAlertEmail(alerts: DetectedExamNotice[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.OWNER_EMAIL;
  if (!apiKey || !from || !to || alerts.length === 0) return false;

  const rows = alerts.map((alert) => {
    const noticeDate = alert.notification_date ? `Notice date on listing: ${alert.notification_date}` : "Notice date: not extracted; check the official notice.";
    const deadline = alert.application_deadline ? `Application deadline: ${alert.application_deadline}` : "Application deadline: not extracted; check the official notice.";
    return `<li><strong>${escapeHtml(alert.exam_name)}</strong>: ${escapeHtml(alert.title)}<br>${escapeHtml(noticeDate)} · ${escapeHtml(deadline)}<br><a href="${escapeHtml(alert.source_url)}">Open official notice</a></li>`;
  }).join("");
  const text = alerts.map((alert) => `${alert.exam_name}: ${alert.title}\n${alert.source_url}\nNotice date: ${alert.notification_date ?? "not extracted"}; deadline: ${alert.application_deadline ?? "not extracted"}`).join("\n\n");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `UPSC Study Desk: ${alerts.length} new official exam notice${alerts.length === 1 ? "" : "s"}`,
      text: `New official-source notice links were detected. Verify each detail in the official notice before acting.\n\n${text}\n\nThis alert is not an eligibility determination.`,
      html: `<main><h2>New official-source exam notice links</h2><p>These are potential notices detected from official listings. Verify dates and eligibility in the source before acting.</p><ul>${rows}</ul><p>This alert is not an eligibility determination.</p></main>`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}.`);
  return true;
}

function recentDatedNotices(notices: DetectedExamNotice[], today = getISTDateKey()) {
  const lower = addDaysToDateKey(today, -30);
  return notices.filter((notice) => notice.notification_date && notice.notification_date >= lower && notice.notification_date <= today && (!notice.application_deadline || notice.application_deadline >= today));
}

export async function runSourceSync(trigger: SyncTrigger, now = new Date()): Promise<SyncSummary> {
  const admin = createSupabaseAdminClient();
  const checkedAt = now.toISOString();
  const messages: string[] = [];
  let currentAffairsAdded = 0;
  let examAlertsAdded = 0;
  let sourceFailures = 0;

  const [{ data: profileData, error: profileError }, pibResult] = await Promise.all([
    admin.from("profiles").select("*").limit(1).maybeSingle(),
    fetchPIBItems(now).then((items) => ({ items, error: null as string | null })).catch((error) => ({ items: [] as ParsedPIBItem[], error: errorText(error) })),
  ]);
  const profile = !profileError ? profileData as Profile | null : null;
  if (profileError) {
    sourceFailures += 1;
    messages.push(`Profile preference lookup failed: ${errorText(profileError)}.`);
  }

  if (pibResult.error) {
    sourceFailures += 1;
    messages.push(`PIB RSS: ${pibResult.error}`);
    await writeSyncRun(admin, "PIB Press Releases RSS", trigger, "failed", 0, pibResult.error);
  } else if (pibResult.items.length === 0) {
    messages.push("PIB RSS: no syllabus-matched releases from the last 10 days were found; this is not a claim that no relevant news exists elsewhere.");
    await writeSyncRun(admin, "PIB Press Releases RSS", trigger, "success", 0, "No recent PIB items matched the configured syllabus rules.");
  } else {
    const rows = pibResult.items.map(asCurrentAffair);
    const { data, error } = await admin.from("current_affairs").upsert(rows, { onConflict: "source_url", ignoreDuplicates: true }).select("id");
    if (error) {
      sourceFailures += 1;
      messages.push(`PIB RSS database write failed: ${errorText(error)}.`);
      await writeSyncRun(admin, "PIB Press Releases RSS", trigger, "failed", 0, errorText(error));
    } else {
      currentAffairsAdded = data?.length ?? 0;
      messages.push(`PIB RSS: ${currentAffairsAdded} new matched release${currentAffairsAdded === 1 ? "" : "s"} saved from the last 10 days.`);
      await writeSyncRun(admin, "PIB Press Releases RSS", trigger, "success", currentAffairsAdded, `Inspected ${pibResult.items.length} syllabus-matched item(s); ${currentAffairsAdded} were new.`);
    }
  }

  try {
    const discovered = await fetchExamNotices(profile ?? undefined, now);
    if (discovered.failures.length) {
      sourceFailures += discovered.failures.length;
      messages.push(...discovered.failures.map((failure) => `${failure.source}: ${failure.message}`));
    }
    if (discovered.notices.length === 0) {
      messages.push("Exam alerts: no new candidate notification links were detected from the selected official listings.");
      await writeSyncRun(admin, "Official exam notice listings", trigger, discovered.failures.length ? "partial" : "success", 0,
        discovered.failures.map((failure) => `${failure.source}: ${failure.message}`).join("; ") || "No candidate links detected.");
    } else {
      const urls = discovered.notices.map((notice) => notice.source_url);
      const { data: existingRows, error: existingError } = await admin.from("exam_alerts").select("source_url").in("source_url", urls);
      if (existingError) throw new Error(`Could not check duplicate alerts: ${errorText(existingError)}`);
      const existing = new Set((existingRows ?? []).map((row) => row.source_url as string));
      const newNotices = discovered.notices.filter((notice) => !existing.has(notice.source_url));
      const { error } = await admin.from("exam_alerts").upsert(discovered.notices.map(asExamAlert), { onConflict: "source_url" });
      if (error) throw new Error(`Could not save official notice links: ${errorText(error)}`);
      examAlertsAdded = newNotices.length;
      messages.push(`Exam alerts: ${examAlertsAdded} new potential link${examAlertsAdded === 1 ? "" : "s"} saved; all dates and eligibility still require the official notice.`);
      await writeSyncRun(admin, "Official exam notice listings", trigger, discovered.failures.length ? "partial" : "success", examAlertsAdded,
        discovered.failures.map((failure) => `${failure.source}: ${failure.message}`).join("; ") || `Detected ${discovered.notices.length}; added ${examAlertsAdded}.`);

      if (trigger === "cron" && profile?.email_alerts && examAlertsAdded) {
        try {
          const dated = recentDatedNotices(newNotices, getISTDateKey(now));
          if (dated.length) {
            await sendNewAlertEmail(dated);
            messages.push(`Email: sent ${dated.length} newly detected notice(s) with an explicit recent listing date.`);
          }
        } catch (error) {
          sourceFailures += 1;
          messages.push(`Optional email delivery failed: ${errorText(error)}.`);
        }
      }
    }
  } catch (error) {
    sourceFailures += 1;
    const message = errorText(error);
    messages.push(`Exam alerts: ${message}`);
    await writeSyncRun(admin, "Official exam notice listings", trigger, "failed", 0, message);
  }

  const status = sourceFailures === 0 ? "success" : (currentAffairsAdded + examAlertsAdded > 0 ? "partial" : "failed");
  return { status, currentAffairsAdded, examAlertsAdded, checkedAt, messages };
}
