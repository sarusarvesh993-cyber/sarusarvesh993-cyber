import { XMLParser } from "fast-xml-parser";
import { load } from "cheerio";

export const DEFAULT_PIB_RSS_URL = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1";
export const PIB_RSS_INDEX_URL = "https://www.pib.gov.in/ViewRss.aspx?reg=1&lang=1";

export type NewsMapping = {
  stage: "Prelims" | "Mains" | "Both";
  paper: string;
  subject: string;
  topic_id: string;
  why_matters: string;
  static_connection: string;
  exam_relevance: string;
  action: "study" | "revise" | "monitor";
  priority: "core" | "important" | "lower priority";
  practice_question: string;
  matchedTerms: string[];
};

export type ParsedPIBItem = {
  title: string;
  description: string | null;
  source_url: string;
  published_at: string | null;
  mapping: NewsMapping;
};

type Rule = Omit<NewsMapping, "matchedTerms"> & { terms: string[]; weight: number };

// Rules intentionally classify only source text; they do not generate or add facts about an event.
const RULES: Rule[] = [
  {
    terms: ["supreme court", "high court", "governor", "constitution", "constitutional", "federalism", "federal", "parliament", "legislature", "judiciary", "ordinance", "election commission", "rights issue", "tribunal", "governance", "transparency", "accountability"],
    weight: 8,
    stage: "Both", paper: "GS-II · Polity and governance", subject: "Constitution and institutions", topic_id: "gs2.constitution",
    why_matters: "The title or feed summary matches a constitutional or institutional theme. Read the linked official release for the event facts, then map the relevant power, procedure and accountability question.",
    static_connection: "Constitutional design, federalism, separation of powers, rights and accountability. The exact doctrine depends on the source document; this mapping is a starting point, not a legal conclusion.",
    exam_relevance: "Both: the institutional concept can support Prelims revision; a sourced, balanced analysis is more useful for Mains GS-II.",
    action: "study", priority: "core",
    practice_question: "Which constitutional or governance principle is engaged, and how can its implementation be strengthened while preserving accountability?",
  },
  {
    terms: ["inflation", "reserve bank", "rbi", "repo rate", "monetary policy", "fiscal", "budget", "gross domestic product", "gdp", "employment", "unemployment", "gst", "banking", "financial inclusion", "poverty", "economic survey", "trade deficit", "manufacturing"],
    weight: 7,
    stage: "Both", paper: "GS-III · Economy", subject: "Economic development", topic_id: "gs3.economy",
    why_matters: "The source text matches an economic mechanism or policy area. Check the original figures and definitions before adding any number to notes.",
    static_connection: "Connect the reported development to growth, prices, public finance, employment, inclusion or monetary transmission—whichever is directly supported by the release.",
    exam_relevance: "Both: the underlying terms can be tested in Prelims; trade-offs, distribution and policy design are useful for Mains GS-III.",
    action: "study", priority: "important",
    practice_question: "Explain the mechanism behind the development and assess one likely benefit, one trade-off and one implementation concern using verified evidence.",
  },
  {
    terms: ["agriculture", "farmer", "farmers", "minimum support price", "msp", "food security", "food grain", "irrigation", "crop", "fertiliser", "fertilizer", "soil health", "procurement", "horticulture", "fisheries", "animal husbandry", "agri-tech"],
    weight: 7,
    stage: "Both", paper: "GS-III · Agriculture", subject: "Agriculture and food systems", topic_id: "gs3.agriculture",
    why_matters: "The item appears to concern an agriculture, farm-income or food-system issue. Verify who is covered and the stated policy details in the official source.",
    static_connection: "Link the event to cropping, irrigation, markets, storage, price support, nutrition or food security only where the source supports that connection.",
    exam_relevance: "Both: terminology and institutions may support Prelims; implementation, sustainability and distribution provide Mains angles.",
    action: "study", priority: "important",
    practice_question: "How can agricultural policy balance productivity, farmer incomes, resource sustainability and consumer access? Use the official source as evidence.",
  },
  {
    terms: ["climate change", "biodiversity", "wildlife", "conservation", "forest", "pollution", "emissions", "greenhouse", "wetland", "tiger", "elephant", "renewable energy", "solar energy", "wind energy", "carbon", "environment impact", "eia", "ecosystem", "species", "national park"],
    weight: 8,
    stage: "Both", paper: "GS-III · Environment and ecology", subject: "Environment", topic_id: "gs3.environment",
    why_matters: "The source text matches an environmental or ecological theme. Confirm the scientific or legal detail from the linked primary source before citing it.",
    static_connection: "Connect the development to ecology, biodiversity, pollution, conservation, climate processes or environmental governance as appropriate.",
    exam_relevance: "Both: definitions and ecological relationships support Prelims; governance, livelihoods and trade-offs support Mains GS-III.",
    action: "study", priority: "core",
    practice_question: "What ecological or climate mechanism is relevant, and how should policy balance conservation, livelihoods and implementation capacity?",
  },
  {
    terms: ["isro", "space mission", "satellite", "artificial intelligence", "\bai\b", "semiconductor", "quantum", "biotechnology", "genome", "cyber security", "cybersecurity", "digital public infrastructure", "deep tech", "research and development", "robotics", "drone", "nuclear energy"],
    weight: 6,
    stage: "Both", paper: "GS-III · Science and technology", subject: "Science and technology", topic_id: "gs3.science-tech",
    why_matters: "The title or description matches a science, technology or innovation keyword. Keep the note at the level of mechanism, application, governance and risk unless the syllabus requires more.",
    static_connection: "Ask what the technology does, its enabling science, public application, limitations, safety and regulatory implications.",
    exam_relevance: "Both: basic principles and applications may support Prelims; strategic, ethical and inclusion implications can support Mains GS-III.",
    action: "study", priority: "important",
    practice_question: "Assess the public value and governance risks of the technology described in the official release, distinguishing verified capability from announced intention.",
  },
  {
    terms: ["united nations", "un security council", "bilateral", "india and", "india-", "neighbourhood", "neighbouring country", "g20", "brics", "sco", "asean", "wto", "foreign affairs", "international", "diplomacy", "diaspora", "global south"],
    weight: 5,
    stage: "Mains", paper: "GS-II · International relations", subject: "India and the world", topic_id: "gs2.international",
    why_matters: "The source text matches an international-relations theme. Keep the note tied to India's stated interest and the source's actual outcome.",
    static_connection: "Map the actors, India's interest, institutional forum, cooperation/competition and any effect on domestic policy.",
    exam_relevance: "Mostly Mains GS-II; use Prelims notes only for stable facts or institutions explicitly supported by the source.",
    action: "monitor", priority: "important",
    practice_question: "How does the development affect India's interests, and what diplomatic or institutional options are available? Support the answer with the official source.",
  },
  {
    terms: ["public health", "healthcare", "health care", "nutrition", "education", "women and child", "tribal", "scheduled caste", "scheduled tribe", "social justice", "welfare scheme", "school education", "health mission", "maternal", "sanitation", "disability", "social sector"],
    weight: 6,
    stage: "Both", paper: "GS-II · Social justice", subject: "Social sector and inclusion", topic_id: "gs2.social-justice",
    why_matters: "The feed text matches a social-sector or inclusion theme. Check the scheme's stated target group, delivery mechanism and evidence in the official release.",
    static_connection: "Connect policy design to access, coverage, accountability, outcomes and the situation of the affected group.",
    exam_relevance: "Both: institutions and programme details may support Prelims; equity, implementation and outcome analysis support Mains GS-II.",
    action: "study", priority: "important",
    practice_question: "Assess whether the policy design addresses access and implementation barriers for its stated target group. What evidence would be needed to judge outcomes?",
  },
  {
    terms: ["disaster", "cyclone", "flood", "earthquake", "landslide", "heatwave", "heat wave", "drought", "early warning", "disaster management", "resilience"],
    weight: 6,
    stage: "Both", paper: "GS-III · Disaster management", subject: "Disaster risk and resilience", topic_id: "gs3.disaster",
    why_matters: "The source text matches a hazard, disaster-management or resilience theme. Verify the location, date and official advisory before using it.",
    static_connection: "Separate hazard from exposure and vulnerability; connect preparedness, response, mitigation and resilient infrastructure.",
    exam_relevance: "Both: hazard/process basics may support Prelims; governance, vulnerability and resilience support Mains GS-III.",
    action: "monitor", priority: "important",
    practice_question: "How can risk reduction address the hazard, exposure and vulnerability identified in the official source?",
  },
  {
    terms: ["internal security", "terrorism", "left wing extremism", "border security", "border management", "organized crime", "organised crime", "cyber attack", "insurgency", "naxal", "radicalisation"],
    weight: 7,
    stage: "Mains", paper: "GS-III · Internal security", subject: "Security", topic_id: "gs3.security",
    why_matters: "The title or description matches an internal-security theme. Do not infer operational details beyond what the official source states.",
    static_connection: "Map the threat, affected institution, legal safeguards, coordination need and citizen-security trade-off.",
    exam_relevance: "Mostly Mains GS-III; retain only stable institutional facts for Prelims.",
    action: "monitor", priority: "important",
    practice_question: "What security challenge is identified, and how can a response preserve legality, accountability and public trust?",
  },
  {
    terms: ["heritage", "archaeological", "monument", "museum", "intangible cultural", "classical language", "unesco world heritage", "manuscript", "cultural heritage"],
    weight: 5,
    stage: "Both", paper: "GS-I · Heritage and culture", subject: "Culture", topic_id: "gs1.culture",
    why_matters: "The item matches a heritage or culture theme. Distinguish the announcement from its legal, conservation or historical significance.",
    static_connection: "Connect heritage to art, architecture, literature, conservation institutions and community context where relevant.",
    exam_relevance: "Both: stable facts may support Prelims; conservation and cultural significance can support Mains GS-I.",
    action: "revise", priority: "lower priority",
    practice_question: "What is the significance of the cultural feature identified, and what conservation or interpretation issue follows from the source?",
  },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "#cdata",
  parseTagValue: false,
  trimValues: true,
});

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function rawText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record["#cdata"] === "string") return record["#cdata"] as string;
    if (typeof record["#text"] === "string") return record["#text"] as string;
  }
  return "";
}

export function cleanFeedText(value: string | null | undefined, limit = 700): string | null {
  if (!value) return null;
  const text = load(value).text().replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

export function mapNewsToSyllabus(title: string, description = ""): NewsMapping | null {
  const text = `${title} ${description}`.toLocaleLowerCase("en-IN");
  const matches = RULES.map((rule) => ({
    rule,
    terms: rule.terms.filter((term) => {
      if (term === "\\bai\\b") return /\bai\b/i.test(text);
      return text.includes(term);
    }),
  })).filter((entry) => entry.terms.length > 0)
    .sort((a, b) => b.rule.weight + b.terms.length - (a.rule.weight + a.terms.length));

  const best = matches[0];
  if (!best) return null;
  return {
    stage: best.rule.stage,
    paper: best.rule.paper,
    subject: best.rule.subject,
    topic_id: best.rule.topic_id,
    why_matters: best.rule.why_matters,
    static_connection: best.rule.static_connection,
    exam_relevance: best.rule.exam_relevance,
    action: best.rule.action,
    priority: best.rule.priority,
    practice_question: best.rule.practice_question,
    matchedTerms: best.terms,
  };
}

function isOfficialPIBUrl(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:"
      && ["pib.gov.in", "www.pib.gov.in"].includes(url.hostname.toLowerCase())
      && !url.username
      && !url.password
      && (!url.port || url.port === "443");
  } catch {
    return false;
  }
}

export function parsePIBFeed(xml: string): ParsedPIBItem[] {
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const rss = parsed.rss as Record<string, unknown> | undefined;
  const rssChannel = rss?.channel as Record<string, unknown> | undefined;
  const atomFeed = parsed.feed as Record<string, unknown> | undefined;
  const rssItems = toArray((rssChannel?.item ?? (parsed.channel as Record<string, unknown> | undefined)?.item) as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const atomItems = toArray(atomFeed?.entry as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const sourceItems = rssItems.length ? rssItems : atomItems;
  const output: ParsedPIBItem[] = [];
  const seen = new Set<string>();

  for (const item of sourceItems) {
    const title = cleanFeedText(rawText(item.title), 240);
    if (!title) continue;
    const description = cleanFeedText(rawText(item.description ?? item.summary ?? item["content:encoded"] ?? item.content), 900);
    const rawLink = typeof item.link === "string"
      ? item.link
      : item.link && typeof item.link === "object"
        ? String((item.link as Record<string, unknown>)["@_href"] ?? "")
        : "";
    const link = rawLink.trim();
    if (!link || !isOfficialPIBUrl(link) || seen.has(link)) continue;
    const mapping = mapNewsToSyllabus(title, description ?? "");
    if (!mapping) continue;
    const rawDate = rawText(item.pubDate ?? item.published ?? item.updated);
    const parsedDate = rawDate ? new Date(rawDate) : null;
    const publishedAt = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null;
    const lowered = `${title} ${description ?? ""}`.toLocaleLowerCase("en-IN");
    if (/photo gallery|media invitation|daily bulletin|good wishes|condolence|birthday greetings/.test(lowered)) continue;
    seen.add(link);
    output.push({ title, description, source_url: link, published_at: publishedAt, mapping });
  }
  return output;
}

export function selectRecentItems(items: ParsedPIBItem[], now = new Date(), days = 10) {
  const cutoff = now.getTime() - days * 86_400_000;
  return items
    .filter((item) => item.published_at && new Date(item.published_at).getTime() >= cutoff && new Date(item.published_at).getTime() <= now.getTime() + 86_400_000)
    .sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());
}

export function getPibFeedUrl(value = process.env.PIB_RSS_URL) {
  const raw = value?.trim() || DEFAULT_PIB_RSS_URL;
  if (!isOfficialPIBUrl(raw)) throw new Error("PIB_RSS_URL must be an HTTPS URL on pib.gov.in.");
  return new URL(raw).toString();
}
