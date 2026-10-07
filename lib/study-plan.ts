import { addDaysToDateKey, weekdayIST } from "@/lib/dates";
import { getSyllabusTopic, syllabusTopics } from "@/lib/content/syllabus";
import type { Profile, StudyTaskType } from "@/lib/types";

export type PlannedTask = {
  plan_key: string;
  task_date: string;
  type: StudyTaskType;
  title: string;
  details: string;
  topic_id: string | null;
  minutes: number;
  status: "planned";
  source: "generated";
};

const CORE_ROTATION = [
  "gs1.modern",
  "gs2.constitution",
  "prelims.geography",
  "gs3.economy",
  "gs1.culture",
  "gs2.governance",
  "prelims.environment",
  "gs1.society",
  "gs3.agriculture",
  "gs2.international",
  "gs4.ethics",
  "prelims.polity",
  "gs1.world-history",
  "gs3.science-tech",
  "gs1.freedom",
  "gs3.disaster",
  "prelims.science",
  "gs1.post-independence",
];
const OPTIONAL_ROTATION = ["historyopt.ancient", "historyopt.early-medieval", "historyopt.modern", "historyopt.world"];

function splitMinutes(total: number, ratios: number[]) {
  const base = ratios.map((ratio) => Math.floor(total * ratio));
  let remainder = total - base.reduce((sum, value) => sum + value, 0);
  for (let index = 0; remainder > 0; index = (index + 1) % base.length) {
    base[index] += 1;
    remainder -= 1;
  }
  return base;
}

function chooseTopic(dayIndex: number, anchorDate: string, profile: Profile) {
  const unixDay = Math.floor(Date.parse(`${anchorDate}T00:00:00Z`) / 86_400_000);
  const rotationIndex = (unixDay + dayIndex) % CORE_ROTATION.length;
  const coreTopicId = CORE_ROTATION[rotationIndex];
  const includeOptional = profile.include_history_optional || profile.optional_subject === "History";
  const shouldUseOptional = includeOptional && dayIndex % 3 === 2;
  const topicId = shouldUseOptional
    ? OPTIONAL_ROTATION[Math.floor(dayIndex / 3) % OPTIONAL_ROTATION.length]
    : coreTopicId;
  return getSyllabusTopic(topicId) ?? syllabusTopics[0];
}

function makeTask(
  date: string,
  index: number,
  type: StudyTaskType,
  title: string,
  details: string,
  topicId: string | null,
  minutes: number,
): PlannedTask {
  const safeTopic = topicId ?? "general";
  return {
    plan_key: `${date}:${type}:${safeTopic}:${index}`,
    task_date: date,
    type,
    title,
    details,
    topic_id: topicId,
    minutes,
    status: "planned",
    source: "generated",
  };
}

export function generateWeeklyPlan(profile: Profile, anchorDate: string): PlannedTask[] {
  if (!profile.onboarding_complete || !profile.daily_minutes || profile.daily_minutes < 30) {
    throw new Error("Complete onboarding with at least 30 study minutes per day to generate a plan.");
  }
  const tasks: PlannedTask[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const date = addDaysToDateKey(anchorDate, dayIndex);
    const topic = chooseTopic(dayIndex, anchorDate, profile);
    const isWeeklyReview = dayIndex === 6;
    const minutes = profile.daily_minutes;
    const dayLabel = weekdayIST(date);

    if (isWeeklyReview) {
      const split = splitMinutes(minutes, [0.35, 0.3, 0.25, 0.1]);
      tasks.push(makeTask(date, 0, "weekly_review", "Weekly review and reset", "Review what moved forward this week, update topic confidence, and choose one bottleneck for next week.", null, split[0]));
      tasks.push(makeTask(date, 1, "recall", "Spaced-repetition review", "Answer due cards before revealing the back. Rate recall honestly so the next interval is useful.", topic.id, split[1]));
      tasks.push(makeTask(date, 2, "answer_practice", "One timed answer or mixed set", `Use a syllabus-linked prompt from ${topic.title}; outline first, then check evidence and structure.`, topic.id, split[2]));
      tasks.push(makeTask(date, 3, "error_log", "Error log and next-week plan", "Record one avoidable error, one concept gap and one adjustment. Do not add extra hours automatically.", null, split[3]));
      continue;
    }

    if (profile.prep_level === "starting") {
      const split = splitMinutes(minutes, minutes >= 150 ? [0.45, 0.2, 0.2, 0.15] : [0.55, 0.25, 0.2]);
      tasks.push(makeTask(date, 0, "study", `Build the foundation · ${topic.title}`, `Read one reliable source and make a short concept map. Focus: ${topic.summary}`, topic.id, split[0]));
      tasks.push(makeTask(date, 1, "recall", "Closed-book retrieval", "Close the source, recall the definition and three key ideas, then correct only the gaps.", topic.id, split[1]));
      if (minutes >= 150) {
        tasks.push(makeTask(date, 2, "pyq", "Use one PYQ as a diagnostic", "Open the official paper archive, attempt a question only if one is available for this topic, and analyse the demand.", topic.id, split[2]));
        tasks.push(makeTask(date, 3, "current_affairs", "Syllabus-linked news scan", "Review today's filtered official-source items. If none match, record that there is no useful item rather than forcing a link.", "prelims.current-affairs", split[3]));
      } else {
        tasks.push(makeTask(date, 2, "current_affairs", "Syllabus-linked news scan", "Review the filtered official-source items; skip routine items and keep a source link for anything you study.", "prelims.current-affairs", split[2]));
      }
    } else if (profile.prep_level === "building") {
      const split = splitMinutes(minutes, minutes >= 150 ? [0.35, 0.25, 0.2, 0.2] : [0.4, 0.3, 0.3]);
      tasks.push(makeTask(date, 0, "study", `Focused study · ${topic.title}`, `Study the syllabus scope, then explain the central idea in your own words. ${topic.summary}`, topic.id, split[0]));
      tasks.push(makeTask(date, 1, "pyq", "PYQ demand and answer plan", "Use an official question paper where mapped; identify directive, time period, concepts and evidence before writing.", topic.id, split[1]));
      if (minutes >= 150) {
        tasks.push(makeTask(date, 2, "recall", "Spaced active recall", "Attempt due cards first; add one concise card only if it tests a real gap.", topic.id, split[2]));
        tasks.push(makeTask(date, 3, "current_affairs", "Current-to-static connection", "Choose a relevant sourced item, map it to a syllabus topic, and note a static concept plus one question.", "prelims.current-affairs", split[3]));
      } else {
        tasks.push(makeTask(date, 2, "recall", "Active recall and current-affairs link", "Recall the topic first; if a relevant official news item exists, connect it to the same syllabus concept.", topic.id, split[2]));
      }
    } else {
      const split = splitMinutes(minutes, minutes >= 150 ? [0.3, 0.35, 0.2, 0.15] : [0.45, 0.35, 0.2]);
      tasks.push(makeTask(date, 0, "recall", `Retrieve and repair · ${topic.title}`, "Start closed-book. Revisit only the parts you could not retrieve accurately.", topic.id, split[0]));
      tasks.push(makeTask(date, 1, "answer_practice", "Timed PYQ or answer outline", "Use the official paper link where a mapped question exists. Practise demand, structure and evidence; do not predict the next paper.", topic.id, split[1]));
      if (minutes >= 150) {
        tasks.push(makeTask(date, 2, "error_log", "Review one error pattern", "Classify the miss: knowledge, interpretation, recall, timing or careless reading. Choose one remedy.", topic.id, split[2]));
        tasks.push(makeTask(date, 3, "current_affairs", "Current-affairs revision", "Revise one sourced item already mapped to this subject, or skip if nothing material is available.", "prelims.current-affairs", split[3]));
      } else {
        tasks.push(makeTask(date, 2, "error_log", "Error log and revision check", "Capture one error and one corrected explanation; end with a two-minute recall test.", topic.id, split[2]));
      }
    }

    // Keep the generated key stable and make the day explicit in the task details.
    tasks[tasks.length - 1].details = `${tasks[tasks.length - 1].details} (${dayLabel}).`;
  }

  return tasks;
}
