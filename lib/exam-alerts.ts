import { load } from "cheerio";
import type { ExamScope, Profile } from "@/lib/types";
import { getISTDateKey, isDateKey } from "@/lib/dates";

export type ExamWatchSource = {
  id: "upsc" | "ssc" | "rrb";
  name: string;
  indexUrl: string;
  allowedHosts: string[];
};

export type DetectedExamNotice = {
  source_url: string;
  source_page_url: string;
  source_name: string;
  exam_name: string;
  title: string;
  notification_date: string | null;
  application_deadline: string | null;
  exam_date: string | null;
  eligibility_summary: string | null;
  relevance_rationale: string;
  overlap: string[];
  last_seen_at: string;
};

export const EXAM_WATCH_SOURCES: ExamWatchSource[] = [
  {
    id: "upsc",
    name: "Union Public Service Commission (UPSC)",
    indexUrl: "https://upsc.gov.in/whats-new",
    allowedHosts: ["upsc.gov.in", "www.upsc.gov.in"],
  },
  {
    id: "ssc",
    name: "Staff Selection Commission (SSC)",
    indexUrl: "https://ssc.gov.in/",
    allowedHosts: ["ssc.gov.in", "www.ssc.gov.in"],
  },
  {
    id: "rrb",
    name: "Railway Recruitment Board (RRB) · Chandigarh notice board",
    indexUrl: "https://www.rrbcdg.gov.in/",
    allowedHosts: ["rrbcdg.gov.in", "www.rrbcdg.gov.in"],
  },
];

const NOTICE_SIGNAL = /notification|advertisement|exam(?:ination)? calendar|recruitment|civil services|indian forest service|central armed police|combined graduate|combined higher secondary|combined hindi translator|stenographer|multi[ -]?tasking|selection post|centralised employment notice|centralized employment notice|cen\s*\d|examination notice|corrigendum/i;
const RESULT_NOISE = /answer key|cut.?off|result|marks list|panel|admit card|e.?call letter|city intimation|application status|syllabus correction/i;

function officialUrl(raw: string, source: ExamWatchSource) {
  try {
    const url = new URL(raw, source.indexUrl);
    return url.protocol === "https:"
      && source.allowedHosts.includes(url.hostname.toLowerCase())
      && !url.username
      && !url.password
      && (!url.port || url.port === "443")
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function cleanText(value: string, max = 380) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function parseDateToken(token: string): string | null {
  const value = token.trim().replace(/[,]/g, "");
  let match = value.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const date = `${match[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return isDateKey(date) ? date : null;
  }
  match = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (match) return isDateKey(`${match[1]}-${match[2]}-${match[3]}`) ? `${match[1]}-${match[2]}-${match[3]}` : null;

  const monthMatch = value.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(20\d{2})\b/i)
    ?? value.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i);
  if (!monthMatch) return null;
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const monthName = (monthMatch[1].match(/^[A-Za-z]+$/) ? monthMatch[1] : monthMatch[2]).toLowerCase();
  const day = Number(monthMatch[1].match(/^\d/) ? monthMatch[1] : monthMatch[2]);
  const year = Number(monthMatch[3]);
  const month = months.indexOf(monthName) + 1;
  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return isDateKey(date) ? date : null;
}

function dateAfterLabel(text: string, labels: RegExp) {
  const match = labels.exec(text);
  if (!match) return null;
  const tail = text.slice(match.index + match[0].length, match.index + match[0].length + 160);
  const tokens = tail.match(/\b(?:\d{1,2}[./-]\d{1,2}[./-]20\d{2}|20\d{2}-\d{2}-\d{2}|(?:\d{1,2}(?:st|nd|rd|th)?\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?\s+20\d{2}|\d{1,2}[./-](?:January|February|March|April|May|June|July|August|September|October|November|December)[./-]20\d{2})\b/i);
  return tokens ? parseDateToken(tokens[0]) : null;
}

function publishedDate(text: string) {
  return dateAfterLabel(text, /(?:dated|published|uploaded|date\s*[:\-])\s*/i);
}

function applicationDeadline(text: string) {
  return dateAfterLabel(text, /(?:last date(?: and time)?(?: for (?:submission of )?(?:online )?applications?)?|closing date(?: for (?:submission of )?applications?)?|application deadline|last date to apply)\s*[:\-]?\s*/i);
}

function examDate(text: string) {
  return dateAfterLabel(text, /(?:date of (?:commencement of )?examination|examination date|exam date|preliminary examination|mains examination|tentative schedule of (?:the )?examination)\s*[:\-]?\s*/i);
}

function eligibilityText(text: string) {
  const match = /(?:educational qualification|essential qualification|age limit|eligibility criteria|eligibility)[\s\S]{0,280}/i.exec(text);
  return match ? cleanText(match[0], 260) : null;
}

function inferExamName(source: ExamWatchSource, text: string) {
  if (source.id === "upsc") {
    if (/indian forest service|ifos/i.test(text)) return "Indian Forest Service examination (UPSC)";
    if (/central armed police|capf/i.test(text)) return "Central Armed Police Forces examination (UPSC)";
    if (/civil services|\bcse\b/i.test(text)) return "Civil Services Examination (UPSC)";
    if (/exam(?:ination)? calendar/i.test(text)) return "UPSC examination calendar (check relevant exam entry)";
    return "UPSC examination notice (check the official notice for the exact exam)";
  }
  if (source.id === "ssc") {
    if (/combined graduate|\bcgl\b/i.test(text)) return "Combined Graduate Level examination (SSC)";
    if (/combined higher secondary|\bchsl\b/i.test(text)) return "Combined Higher Secondary Level examination (SSC)";
    if (/central police|\bcpo\b/i.test(text)) return "Sub-Inspector examination (SSC)";
    if (/stenographer/i.test(text)) return "Stenographer examination (SSC)";
    if (/multi[ -]?tasking|\bmts\b/i.test(text)) return "Multi-Tasking Staff examination (SSC)";
    if (/combined hindi translator/i.test(text)) return "Combined Hindi Translators examination (SSC)";
    return "SSC examination notice (check the official notice for the exact exam)";
  }
  const cen = text.match(/\bCEN\s*\d{1,2}\/20\d{2}\b/i)?.[0];
  return cen ? `Railway recruitment notice · ${cen}` : "Railway Recruitment Board notice (check the official notice for the exact recruitment)";
}

function rationale(source: ExamWatchSource, text: string, profile?: Pick<Profile, "eligibility_context">) {
  const eligibilityNote = profile?.eligibility_context?.trim()
    ? " Your user-provided eligibility context is stored as a checklist only; this first version does not compare it to notice rules or decide eligibility."
    : " Eligibility is not inferred; check the official notice against your circumstances.";
  if (source.id === "upsc" && /civil services|\bcse\b/i.test(text)) {
    return `Direct exam relevance for a UPSC CSE aspirant. The CSE syllabus overlaps with this preparation, but application eligibility, attempt limits and current rules must be verified in the official notice.${eligibilityNote}`;
  }
  if (source.id === "upsc") {
    return `Potentially relevant UPSC recruitment. Syllabus overlap and career fit depend on the specific examination; compare the official notification with your goals.${eligibilityNote}`;
  }
  if (source.id === "ssc") {
    return `Possible alternative government-exam route. Some general studies, reasoning and aptitude preparation may overlap, but the test pattern and role-specific eligibility differ; assess career fit before diverting study time.${eligibilityNote}`;
  }
  return `Possible government recruitment alert. Direct UPSC syllabus overlap may be limited; use the official notice to judge career fit and eligibility before allocating preparation time.${eligibilityNote}`;
}

export function parseExamNoticeListing(html: string, source: ExamWatchSource, profile?: Pick<Profile, "eligibility_context">, now = new Date()): DetectedExamNotice[] {
  const $ = load(html);
  const found = new Map<string, DetectedExamNotice>();
  const nowIso = now.toISOString();

  $("a[href]").each((_index, element) => {
    const anchor = $(element);
    const href = officialUrl(anchor.attr("href") ?? "", source);
    if (!href) return;
    const directText = cleanText(anchor.text() || anchor.attr("title") || "", 220);
    const parent = anchor.closest("tr, li, article, .views-row, .item, .news-item, p");
    const context = cleanText(`${directText} ${parent.text() || anchor.parent().text() || ""}`, 620);
    const candidateText = `${directText} ${context}`;
    if (!candidateText || !NOTICE_SIGNAL.test(candidateText) || RESULT_NOISE.test(directText)) return;
    // Do not treat a generic recruitment navigation link as a dated notification.
    if (!/notification|advertisement|exam(?:ination)? calendar|recruitment|civil services|indian forest service|central armed police|combined graduate|combined higher secondary|combined hindi translator|stenographer|multi[ -]?tasking|selection post|centralised employment notice|centralized employment notice|cen\s*\d|examination notice|corrigendum/i.test(directText)) return;
    if (found.has(href)) return;

    const detectedDate = publishedDate(context);
    const deadline = applicationDeadline(context);
    const date = examDate(context);
    const name = inferExamName(source, candidateText);
    const overlap = source.id === "upsc"
      ? ["UPSC official recruitment", "GS/CSAT or public-service context (exam-specific)" ]
      : source.id === "ssc"
        ? ["General Studies overlap may exist", "Reasoning/aptitude overlap may exist", "Distinct role and exam pattern"]
        : ["Possible general-knowledge overlap", "Career fit is user-dependent", "Distinct recruitment/technical eligibility"];

    found.set(href, {
      source_url: href,
      source_page_url: source.indexUrl,
      source_name: source.name,
      exam_name: name,
      title: directText || cleanText(context, 220),
      notification_date: detectedDate,
      application_deadline: deadline,
      exam_date: date,
      eligibility_summary: eligibilityText(context),
      relevance_rationale: rationale(source, candidateText, profile),
      overlap,
      last_seen_at: nowIso,
    });
  });

  // A calendar link is useful even when it does not name a single exam.
  return [...found.values()].slice(0, 40);
}

export function allowedExamSources(scope: ExamScope | null | undefined) {
  if (scope === "broad") return EXAM_WATCH_SOURCES;
  if (scope === "upsc_ssc") return EXAM_WATCH_SOURCES.filter((source) => source.id !== "rrb");
  return EXAM_WATCH_SOURCES.filter((source) => source.id === "upsc");
}

export async function fetchExamNotices(profile?: Profile, now = new Date()) {
  const sources = allowedExamSources(profile?.exam_scope);
  const notices: DetectedExamNotice[] = [];
  const failures: { source: string; message: string }[] = [];

  for (const source of sources) {
    try {
      let requestUrl = source.indexUrl;
      let response: Response | null = null;
      for (let hop = 0; hop <= 3; hop += 1) {
        response = await fetch(requestUrl, {
          headers: { "user-agent": "UPSC-Study-Desk/0.1 (personal study tool; source-linking only)", accept: "text/html,application/xhtml+xml" },
          signal: AbortSignal.timeout(12_000),
          cache: "no-store",
          redirect: "manual",
        });
        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        const location = response.headers.get("location");
        const redirected = location ? officialUrl(location, source) : null;
        if (!redirected) throw new Error("Official listing redirected outside its host allowlist.");
        requestUrl = redirected;
      }
      if (!response) throw new Error("Official listing returned no response.");
      const finalUrl = officialUrl(response.url || requestUrl, source);
      if ([301, 302, 303, 307, 308].includes(response.status)) throw new Error("Official listing exceeded the safe redirect limit.");
      if (!response.ok || !finalUrl) throw new Error(`Official listing returned HTTP ${response.status} or an invalid final URL.`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error("Official listing did not return HTML.");
      const body = await response.text();
      if (body.length > 4_000_000) throw new Error("Official listing exceeded the 4 MB safety limit.");
      notices.push(...parseExamNoticeListing(body, source, profile, now));
    } catch (error) {
      failures.push({ source: source.name, message: error instanceof Error ? error.message.slice(0, 200) : "Unknown source error" });
    }
  }

  const unique = new Map<string, DetectedExamNotice>();
  for (const notice of notices) unique.set(notice.source_url, notice);
  return { notices: [...unique.values()], failures, checked_at: now.toISOString(), checked_day_ist: getISTDateKey(now) };
}
