import test from "node:test";
import assert from "node:assert/strict";
import { addDaysToDateKey, formatDateIST, getISTDateKey, isDateKey } from "../lib/dates";
import { generateWeeklyPlan } from "../lib/study-plan";
import { scheduleNextReview } from "../lib/spaced-repetition";
import { mapNewsToSyllabus, parsePIBFeed, getPibFeedUrl, selectRecentItems } from "../lib/news";
import { allowedExamSources, EXAM_WATCH_SOURCES, parseExamNoticeListing } from "../lib/exam-alerts";
import { syllabusTopics, getSyllabusTopic } from "../lib/content/syllabus";
import { pyqs, pyqCoverage } from "../lib/content/pyqs";
import type { Profile } from "../lib/types";

const baseProfile: Profile = {
  user_id: "test-user",
  target_year: 2027,
  daily_minutes: 90,
  prep_level: "starting",
  preferred_language: "English",
  optional_subject: null,
  include_history_optional: false,
  exam_scope: "upsc",
  eligibility_context: null,
  email_alerts: false,
  onboarding_complete: true,
};

test("IST date keys roll over at midnight in Asia/Kolkata, not UTC", () => {
  assert.equal(getISTDateKey(new Date("2026-10-06T18:29:59.000Z")), "2026-10-06");
  assert.equal(getISTDateKey(new Date("2026-10-06T18:30:00.000Z")), "2026-10-07");
  assert.equal(formatDateIST("2026-10-07"), "7 Oct 2026");
  assert.equal(addDaysToDateKey("2028-02-28", 1), "2028-02-29");
  assert.equal(addDaysToDateKey("2028-02-29", 1), "2028-03-01");
  assert.equal(isDateKey("2026-02-29"), false);
  assert.equal(isDateKey("2028-02-29"), true);
});

test("weekly plan allocates the full selected time across seven IST date keys", () => {
  for (const prep_level of ["starting", "building", "revision"] as const) {
    for (const daily_minutes of [30, 90, 150, 240]) {
      const profile = { ...baseProfile, prep_level, daily_minutes };
      const tasks = generateWeeklyPlan(profile, "2026-10-07");
      assert.equal(tasks.length, daily_minutes >= 150 ? 28 : 22);
      assert.equal(new Set(tasks.map((task) => task.plan_key)).size, tasks.length);
      assert.equal(new Set(tasks.map((task) => task.task_date)).size, 7);
      assert.ok(tasks.every((task) => task.minutes >= 1 && task.minutes <= 720));
      for (let index = 0; index < 7; index += 1) {
        const date = addDaysToDateKey("2026-10-07", index);
        const dayTasks = tasks.filter((task) => task.task_date === date);
        assert.equal(dayTasks.reduce((sum, task) => sum + task.minutes, 0), daily_minutes);
      }
      assert.equal(tasks.filter((task) => task.type === "weekly_review").length, 1);
    }
  }
});

test("History Optional plan entries appear only after an explicit History choice", () => {
  const ordinary = generateWeeklyPlan(baseProfile, "2026-10-07");
  assert.equal(ordinary.some((task) => task.topic_id?.startsWith("historyopt.")), false);
  const selected = generateWeeklyPlan({ ...baseProfile, include_history_optional: true }, "2026-10-07");
  assert.equal(selected.some((task) => task.topic_id?.startsWith("historyopt.")), true);
  const historyOptional = generateWeeklyPlan({ ...baseProfile, optional_subject: "History" }, "2026-10-07");
  assert.equal(historyOptional.some((task) => task.topic_id?.startsWith("historyopt.")), true);
});

test("review intervals follow the documented inspectable heuristic", () => {
  const fresh = { interval_days: 0, ease_factor: 2.5, repetitions: 0 };
  const goodFirst = scheduleNextReview(fresh, 4, "2026-10-07");
  assert.equal(goodFirst.interval_days, 1);
  assert.equal(goodFirst.repetitions, 1);
  assert.equal(goodFirst.next_due_on, "2026-10-08");
  const goodSecond = scheduleNextReview(goodFirst, 4, "2026-10-08");
  assert.equal(goodSecond.interval_days, 6);
  assert.equal(goodSecond.repetitions, 2);
  const again = scheduleNextReview(goodSecond, 1, "2026-10-20");
  assert.equal(again.interval_days, 1);
  assert.equal(again.repetitions, 0);
  assert.equal(again.next_due_on, "2026-10-21");
  assert.throws(() => scheduleNextReview(fresh, 2 as 1, "2026-10-07"), /Rating must/);
});

test("news keyword mapping adds a syllabus prompt, not a new event fact", () => {
  const mapping = mapNewsToSyllabus("Wildlife conservation update", "A government release about tiger habitat and forest conservation.");
  assert.ok(mapping);
  assert.equal(mapping.topic_id, "gs3.environment");
  assert.match(mapping.why_matters, /matches/i);
  assert.ok(mapping.practice_question.length > 20);
  assert.equal(mapNewsToSyllabus("Routine office meeting", "No relevant syllabus terms."), null);
});

test("PIB parser keeps only bounded, official-host, syllabus-mapped feed entries", () => {
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel>
    <item><title><![CDATA[Wildlife conservation update]]></title><description><![CDATA[Government release on tiger habitat and forest conservation.]]></description><link>https://pib.gov.in/PressReleasePage.aspx?PRID=123456</link><pubDate>Tue, 06 Oct 2026 09:00:00 +0530</pubDate></item>
    <item><title>Wildlife conservation mirror</title><description>tiger habitat</description><link>https://news.example.org/press-release</link><pubDate>Tue, 06 Oct 2026 09:00:00 +0530</pubDate></item>
    <item><title>Unrelated office routine</title><description>No relevant terms.</description><link>https://pib.gov.in/PressReleasePage.aspx?PRID=123457</link><pubDate>Tue, 06 Oct 2026 09:00:00 +0530</pubDate></item>
  </channel></rss>`;
  const items = parsePIBFeed(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].source_url, "https://pib.gov.in/PressReleasePage.aspx?PRID=123456");
  assert.equal(items[0].mapping.topic_id, "gs3.environment");
  assert.ok(items[0].published_at);
  assert.equal(getPibFeedUrl("https://www.pib.gov.in/RssMain.aspx?ModId=6"), "https://www.pib.gov.in/RssMain.aspx?ModId=6");
  assert.throws(() => getPibFeedUrl("https://pib.gov.in.attacker.example/feed"), /HTTPS URL on pib.gov.in/);
  assert.throws(() => getPibFeedUrl("http://pib.gov.in/feed"), /HTTPS URL on pib.gov.in/);
  assert.throws(() => getPibFeedUrl("https://user:p@pib.gov.in/feed"), /HTTPS URL on pib.gov.in/);
});

test("current-affairs recency window drops old and future-dated items", () => {
  const now = new Date("2026-10-07T10:00:00.000Z");
  const sample = parsePIBFeed(`<rss><channel>
    <item><title>Climate change and biodiversity</title><description>ecology</description><link>https://pib.gov.in/one</link><pubDate>Fri, 02 Oct 2026 10:00:00 +0000</pubDate></item>
    <item><title>Environment and forest conservation</title><description>species</description><link>https://pib.gov.in/two</link><pubDate>Fri, 18 Sep 2026 10:00:00 +0000</pubDate></item>
    <item><title>Renewable energy and climate policy</title><description>solar energy</description><link>https://pib.gov.in/three</link><pubDate>Fri, 09 Oct 2026 10:00:00 +0000</pubDate></item>
  </channel></rss>`);
  assert.equal(selectRecentItems(sample, now, 10).length, 1);
  assert.equal(selectRecentItems(sample, now, 10)[0].source_url, "https://pib.gov.in/one");
});

test("exam-source scope is explicit and bounded to the selected official listings", () => {
  assert.deepEqual(allowedExamSources("upsc").map((source) => source.id), ["upsc"]);
  assert.deepEqual(allowedExamSources("upsc_ssc").map((source) => source.id), ["upsc", "ssc"]);
  assert.deepEqual(allowedExamSources("broad").map((source) => source.id), ["upsc", "ssc", "rrb"]);
  assert.ok(EXAM_WATCH_SOURCES.every((source) => source.indexUrl.startsWith("https://")));
});

test("notice parser extracts only official candidate links and leaves unknown dates blank", () => {
  const upsc = EXAM_WATCH_SOURCES.find((source) => source.id === "upsc")!;
  const html = `<table><tr><td><a href="/whats-new/cse-2026-notice">Civil Services Examination 2026 notification</a></td><td>Dated: 06/02/2026. Last date for submission of online applications: 20/02/2026. Preliminary examination: 24/05/2026.</td></tr>
    <tr><td><a href="https://attacker.example/CSE-2026-notification">Civil Services Examination 2026 notification</a></td><td>Last date to apply: 30/03/2026</td></tr>
    <tr><td><a href="/results/civil-services-examination-result">Civil Services Examination result</a></td><td>Published 03/04/2026</td></tr></table>`;
  const notices = parseExamNoticeListing(html, upsc, undefined, new Date("2026-02-10T00:00:00.000Z"));
  assert.equal(notices.length, 1);
  assert.equal(notices[0].source_url, "https://upsc.gov.in/whats-new/cse-2026-notice");
  assert.equal(notices[0].notification_date, "2026-02-06");
  assert.equal(notices[0].application_deadline, "2026-02-20");
  assert.equal(notices[0].exam_date, "2026-05-24");
  assert.match(notices[0].relevance_rationale, /verify|eligibility/i);
});

test("syllabus and PYQ starter data have stable ids and known syllabus mappings", () => {
  const topicIds = syllabusTopics.map((topic) => topic.id);
  assert.equal(new Set(topicIds).size, topicIds.length);
  assert.ok(pyqs.length > 0);
  assert.equal(new Set(pyqs.map((question) => question.id)).size, pyqs.length);
  for (const question of pyqs) {
    assert.ok(question.topicIds.every((topicId) => getSyllabusTopic(topicId)), `unknown topic in ${question.id}`);
    assert.ok(question.officialUrl.startsWith("https://upsc.gov.in/"));
    assert.ok(question.theme.length > 20);
  }
  assert.deepEqual(pyqCoverage.map((row) => row.paper).length, 4);
  assert.ok(pyqCoverage.every((row) => row.officialArchiveUrl.startsWith("https://upsc.gov.in/")));
  assert.ok(syllabusTopics.some((topic) => topic.optionalOnly && topic.paperLabel === "History Optional Paper I"));
  assert.ok(syllabusTopics.some((topic) => topic.strategyOnly && topic.priority === "deprioritize"));
});
