export type Lesson = {
  id: string;
  topicId: string;
  title: string;
  stage: string;
  readingTime: string;
  definition: string;
  background: string[];
  keyIdeas: string[];
  examples: string[];
  related: { label: string; href: string }[];
  prelimsTraps: string[];
  mainsAngles: string[];
  revisionNote: string;
  practiceQuestions: string[];
  sources: { label: string; url: string }[];
};

const upscSyllabus = { label: "UPSC CSE 2026 official examination notice and syllabus", url: "https://www.upsc.gov.in/sites/default/files/Notif-CSP-2026-Engl-060226Rev.pdf" };
const upscArchive = { label: "UPSC official previous question paper archive", url: "https://upsc.gov.in/examinations/previous-question-papers" };
const ncert = { label: "NCERT official textbook portal (use as a starting point; verify edition and chapter)", url: "https://ncert.nic.in/textbook.php" };

export const lessons: Lesson[] = [
  {
    id: "harappan-evidence",
    topicId: "prelims.history",
    title: "Harappan urbanism: move from evidence to inference",
    stage: "Prelims GS-I · Mains GS-I · History Optional",
    readingTime: "7 min",
    definition: "The Harappan (Indus) Civilisation was a Bronze Age urban tradition in South Asia. For exam purposes, study it through material evidence—settlement layouts, artefacts, production and exchange—rather than treating uncertain interpretations as settled fact.",
    background: [
      "Its mature urban phase is commonly placed around 2600–1900 BCE; periodisation and regional trajectories vary across archaeological frameworks.",
      "The civilisation covered a large and diverse landscape. Major settlements, smaller sites and regional cultures did not all have identical plans or material assemblages.",
      "The script remains undeciphered, so claims about political structure, religious meaning or named rulers must be carefully qualified.",
    ],
    keyIdeas: [
      "Urban organisation: streets, drainage, wells, platforms, craft areas and public works are evidence of planning and coordinated labour; they do not by themselves prove one specific form of government.",
      "Economy: craft specialisation and long-distance exchange are inferred from materials, production traces and distribution patterns.",
      "Water and environment: local water management varied by ecology. Dholavira is a useful case for reservoirs and water infrastructure.",
      "Source criticism: separate an excavated observation (for example, a reservoir) from a broader inference (how authority or social organisation worked).",
    ],
    examples: [
      "A site-identification question can test a distinctive feature such as a settlement's water system; revise the location and the feature together.",
      "A Mains or Optional answer on Harappan art should distinguish what an artefact shows from interpretations about aesthetics, ritual or belief.",
    ],
    related: [
      { label: "Prelims history syllabus", href: "/syllabus?topic=prelims.history" },
      { label: "Harappan PYQ themes", href: "/syllabus?topic=prelims.history" },
      { label: "Active recall cards", href: "/study-plan" },
    ],
    prelimsTraps: [
      "Do not treat an undeciphered sign sequence as a known translated text.",
      "Avoid absolute statements about a uniform civilisation, a single political system or the complete absence/presence of a practice unless the evidence supports that wording.",
      "Do not confuse the modern name of a site with its ancient name; use the geographical clue and excavated feature.",
    ],
    mainsAngles: [
      "Organise an answer by evidence type: settlement, water, craft, trade and art.",
      "Show regional variation and the limits of archaeological inference instead of presenting a single-cause narrative.",
      "Use one or two named examples, then explain what they demonstrate and what they cannot establish.",
    ],
    revisionNote: "From memory: name three classes of Harappan evidence; give one example of water management; state one inference and one limitation.",
    practiceQuestions: [
      "How can archaeological evidence help reconstruct Harappan urban life, and where must the historian remain cautious?",
      "A site is associated with reservoirs and water channels. What can that evidence tell us about settlement planning, and what can it not prove by itself?",
    ],
    sources: [upscSyllabus, upscArchive, ncert, { label: "Archaeological Survey of India", url: "https://asi.nic.in/" }],
  },
  {
    id: "vedic-transition",
    topicId: "gs1.ancient",
    title: "Rig Vedic to Later Vedic: compare change without a false cliff-edge",
    stage: "Mains GS-I · Prelims GS-I · History Optional",
    readingTime: "8 min",
    definition: "The Vedic period is studied through Vedic textual traditions and related historical interpretation. The Rig Vedic and Later Vedic labels are analytical period groupings used to compare changes in social, economic and political life.",
    background: [
      "Different texts were composed and transmitted over time; their geography, genre and purpose matter when using them as historical evidence.",
      "A useful comparison tracks changes in settlement, subsistence, political authority, ritual and social organisation rather than memorising a single rigid timeline.",
      "Period labels describe broad tendencies. They do not mean that every community changed at the same time or in the same way.",
    ],
    keyIdeas: [
      "Use a comparison table: evidence/source, economy, settlement, polity, social relations and religious practice.",
      "Separate textual ideals or prescriptions from lived social practice; a text is not a census of the whole subcontinent.",
      "Connect changes in agriculture and settlement to shifts in political organisation as a hypothesis supported by evidence, not an automatic one-step cause.",
    ],
    examples: [
      "The 2024 GS-I paper asked for a comparison of social and economic change from Rig Vedic to Later Vedic contexts; the Optional sample also linked this transition to state institutions and taxation.",
      "A strong answer uses a small number of dimensions and explains continuity alongside change.",
    ],
    related: [
      { label: "Mains GS-I ancient history", href: "/syllabus?topic=gs1.ancient" },
      { label: "2024 Vedic transition PYQ", href: "/syllabus?topic=gs1.ancient" },
      { label: "History Optional syllabus", href: "/syllabus?topic=historyopt.ancient" },
    ],
    prelimsTraps: [
      "Do not treat every Vedic text as a contemporaneous description of the same region.",
      "Beware of statements that turn broad tendencies into universal rules (for example, 'all' occupations or communities changed uniformly).",
    ],
    mainsAngles: [
      "Use a before/after table, but add a sentence on regional, chronological and source limitations.",
      "Explain how economic and political changes may interact; avoid claiming a single factor mechanically caused all social change.",
    ],
    revisionNote: "Recall five comparison headings, then give one continuity and one change under each using qualified language.",
    practiceQuestions: [
      "Compare selected social and economic changes between Rig Vedic and Later Vedic contexts. How should the sources qualify the comparison?",
      "How can changes in settlement and political authority be studied through Vedic textual evidence?",
    ],
    sources: [upscSyllabus, upscArchive, ncert],
  },
  {
    id: "ashokan-dhamma",
    topicId: "historyopt.ancient",
    title: "Ashoka's Dhamma: public ethic, inscriptions and interpretation",
    stage: "Mains GS-I · History Optional · Prelims GS-I",
    readingTime: "8 min",
    definition: "Ashoka's Dhamma is the ethical and administrative language articulated in his edicts. It is safest to study it from the inscriptions and to distinguish it from a simple synonym for one religious doctrine.",
    background: [
      "The Mauryan Empire was a major early imperial formation. Ashoka's inscriptions are among the key primary sources for examining royal communication and governance.",
      "Edicts were placed in different locations and addressed audiences through public proclamations; their language and content are therefore important historical evidence.",
      "Interpretations of Dhamma consider moral conduct, social harmony and state communication. A strong answer recognises the debate rather than assuming a single uncontested purpose.",
    ],
    keyIdeas: [
      "Use inscriptional evidence first: identify what a particular edict actually says before generalising about policy.",
      "Distinguish personal religious affiliation, ethical instruction and imperial governance; these may intersect without being identical.",
      "Consider audience, location, language and medium as part of the source, not merely background details.",
    ],
    examples: [
      "The History Optional 2022 sample included a prompt that framed Dhamma as both moral/social policy and a possible extension of state authority.",
      "A Mains answer can present both interpretations, cite the nature of edicts and arrive at a qualified judgement.",
    ],
    related: [
      { label: "History Optional: ancient India", href: "/syllabus?topic=historyopt.ancient" },
      { label: "PYQ coverage", href: "/syllabus?topic=historyopt.ancient" },
    ],
    prelimsTraps: [
      "Do not equate Dhamma automatically with conversion policy or with every teaching of Buddhism.",
      "Do not extrapolate the message of one inscription to every region and audience without checking the source context.",
    ],
    mainsAngles: [
      "Introduce the primary-source basis, outline the ethical elements, evaluate the governance interpretation and conclude with nuance.",
      "Use the distinction between evidence and inference explicitly; it demonstrates historical method as well as content knowledge.",
    ],
    revisionNote: "One-sentence definition; three source-aware ideas; one debate; one inscription-based example.",
    practiceQuestions: [
      "Assess the relationship between Ashoka's Dhamma and state authority, using inscriptional evidence and acknowledging interpretive limits.",
      "Why should Dhamma not be reduced to a simple synonym for one religious doctrine?",
    ],
    sources: [upscSyllabus, upscArchive, ncert, { label: "Archaeological Survey of India", url: "https://asi.nic.in/" }],
  },
  {
    id: "chola-architecture",
    topicId: "gs1.culture",
    title: "Chola art and architecture: answer through features and context",
    stage: "Mains GS-I · Prelims GS-I · History Optional",
    readingTime: "7 min",
    definition: "Chola architecture is a major South Indian temple-building tradition associated with royal and local patronage, evolving temple institutions and distinctive Dravida forms.",
    background: [
      "Study buildings as products of technology, patronage, ritual, political authority and regional artistic practice—not only as lists of monuments.",
      "The relationship between a temple and society can be explored through inscriptions, endowments, craft, land and performance, while keeping the evidence for each claim clear.",
      "Architectural styles develop over time and across regions; avoid treating a dynasty as a single unchanging style.",
    ],
    keyIdeas: [
      "Describe a feature, name a representative example, then explain its significance. A list without interpretation is weak analysis.",
      "Connect temple construction to patronage and institutions; distinguish royal initiative from the wider networks that sustained a temple.",
      "Use comparisons carefully: chronology, scale, material and function can all matter.",
    ],
    examples: [
      "The 2022 GS-I sample compared Gupta and Chola contributions to heritage and culture; the 2024 GS-I sample revisited Chola art and architecture.",
      "A useful revision card asks for three architectural features, two examples and one social/institutional connection.",
    ],
    related: [
      { label: "Indian heritage and culture syllabus", href: "/syllabus?topic=gs1.culture" },
      { label: "Chola PYQ themes", href: "/syllabus?topic=gs1.culture" },
    ],
    prelimsTraps: [
      "Avoid mixing features from different temple traditions or periods when a question asks for a specific style.",
      "Do not infer a monument's full social function from its visual form alone; use inscriptions and historical context where available.",
    ],
    mainsAngles: [
      "A compact answer can use: context → architectural features → representative examples → cultural/social significance.",
      "For a 'comment' question, address the claim directly and qualify it with evidence rather than writing a generic dynasty note.",
    ],
    revisionNote: "From memory: three features, two examples, one patronage link, and one qualification about regional variation.",
    practiceQuestions: [
      "How did Chola-era temple building contribute to South Indian art and architecture? Use representative examples and explain the role of patronage.",
      "What can temple architecture reveal about society, and what additional evidence is needed to support that interpretation?",
    ],
    sources: [upscSyllabus, upscArchive, ncert, { label: "Archaeological Survey of India", url: "https://asi.nic.in/" }],
  },
  {
    id: "colonial-economy",
    topicId: "gs1.modern",
    title: "Colonial economic change: separate mechanisms from slogans",
    stage: "Mains GS-I · History Optional · GS-III links",
    readingTime: "9 min",
    definition: "Deindustrialisation describes a decline or restructuring of manufacturing and craft activity. In colonial India, it is analysed alongside trade policy, changing markets, revenue demands, technology, transport and regional variation.",
    background: [
      "Colonial economic change unfolded over time and differed by sector and region. Avoid assuming that one mechanism explains every local outcome.",
      "The 2022 GS-I sample asked about colonial famine causes; the 2024 GS-I sample linked the English Industrial Revolution to Indian handicrafts and cottage industries.",
      "Use historical scholarship and the question's framing: a prompt may ask about a factor's contribution, not invite a single-cause claim.",
    ],
    keyIdeas: [
      "Mechanisms to examine include shifts in trade, competition from machine-made goods, colonial fiscal and procurement arrangements, changing patronage and transport links.",
      "Famine analysis should distinguish hazard or harvest failure from entitlement, purchasing power, relief, distribution and administrative policy.",
      "Use evidence and qualification: sectoral and regional differences matter, and long-run causation is debated.",
    ],
    examples: [
      "A strong answer on handicrafts can separate technological change in Britain from colonial policy and market structure in India.",
      "A famine answer can move from immediate trigger to household access to food and the wider institutional response.",
    ],
    related: [
      { label: "Modern Indian history syllabus", href: "/syllabus?topic=gs1.modern" },
      { label: "History Optional Paper II", href: "/syllabus?topic=historyopt.modern" },
      { label: "PYQ themes", href: "/syllabus?topic=gs1.modern" },
    ],
    prelimsTraps: [
      "Beware of one-factor explanations and absolute claims about every region, artisan group or famine.",
      "Do not confuse correlation in a period with proof that one policy alone caused the outcome.",
    ],
    mainsAngles: [
      "Define the process, identify distinct mechanisms, use regional/sectoral examples and conclude with a measured judgement.",
      "For famine, separate food production from access and public response; for deindustrialisation, distinguish industrial change from trade and colonial institutions.",
    ],
    revisionNote: "Use two columns: mechanism / evidence. End with one caveat about variation or causation.",
    practiceQuestions: [
      "Evaluate the role of British industrialisation in the decline and restructuring of Indian handicrafts, alongside other relevant factors.",
      "Why can colonial famines not be explained by food-grain scarcity alone? Build an answer around access, institutions and policy.",
    ],
    sources: [upscSyllabus, upscArchive, ncert],
  },
  {
    id: "quit-india",
    topicId: "gs1.freedom",
    title: "Quit India: context, mobilisation and consequences",
    stage: "Mains GS-I · Prelims GS-I · History Optional",
    readingTime: "7 min",
    definition: "The Quit India movement was a major 1942 phase of the Indian national movement demanding an end to British rule. Its causes, forms of participation and consequences should be studied as a connected sequence.",
    background: [
      "Place the movement in the context of the Second World War, the Cripps Mission and disagreement over India's political status and wartime participation.",
      "The 2024 GS-I paper asked about the events leading to the movement and its results, so chronology and consequences both matter.",
      "Leadership arrests, local initiatives and regional variation shaped how the movement unfolded; a single national narrative can obscure this diversity.",
    ],
    keyIdeas: [
      "Separate antecedents, the demand and call, the colonial response, forms of participation and longer-term significance.",
      "Distinguish immediate effects from broader contributions to the decline of colonial legitimacy; do not claim that one event alone produced independence.",
      "Use chronology to keep wartime context, negotiations and popular mobilisation in the right order.",
    ],
    examples: [
      "An answer can mention the Cripps Mission as a context, then analyse the movement's decentralised and regionally varied forms.",
      "Where exact local examples are used, verify their name, place and date before the exam; this module does not reproduce a detailed events list.",
    ],
    related: [
      { label: "Freedom struggle syllabus", href: "/syllabus?topic=gs1.freedom" },
      { label: "2024 GS-I PYQ theme", href: "/syllabus?topic=gs1.freedom" },
      { label: "Modern Indian history", href: "/syllabus?topic=gs1.modern" },
    ],
    prelimsTraps: [
      "Keep the timeline and the sequence of proposals/movements straight; do not merge it with earlier civil-disobedience phases.",
      "Avoid claiming uniform participation or a single outcome across all regions.",
    ],
    mainsAngles: [
      "Use: wartime setting → failed negotiations → demand and mobilisation → repression and local responses → significance with limits.",
      "For a 'results' prompt, distinguish short-run organisational effects from long-run political consequences.",
    ],
    revisionNote: "Close the notes and say: three antecedents, two forms of response, two consequences, one qualification.",
    practiceQuestions: [
      "What circumstances led to the Quit India movement, and how should its immediate and longer-term results be distinguished?",
      "How did regional variation shape the forms of participation in the 1942 movement?",
    ],
    sources: [upscSyllabus, upscArchive, ncert],
  },
  {
    id: "federalism-basics",
    topicId: "gs2.federalism",
    title: "Federalism and separation of powers: a reusable GS-II frame",
    stage: "Mains GS-II · Prelims GS-I",
    readingTime: "8 min",
    definition: "Federalism distributes public authority across more than one level of government under a constitutional framework. Separation of powers allocates and checks governmental functions; in practice, institutions also interact and share responsibilities.",
    background: [
      "Start from the constitutional text and institutional design, then consider conventions, statutory processes and judicial interpretation where relevant.",
      "A current event involving a constitutional office is not self-explanatory: identify the relevant actor, power, procedure, time limit if legally established, and available remedy.",
      "The balance between autonomy and coordination is an analytical question; avoid treating federalism as either complete centralisation or complete separation.",
    ],
    keyIdeas: [
      "Map the issue: Union, state and local actors; constitutional provision; decision or omission; accountability mechanism; consequences for citizens.",
      "Separate legal rule, institutional practice and normative recommendation. Label each clearly in an answer.",
      "Use cooperative, competitive and fiscal dimensions where they genuinely fit; do not force every event into every category.",
    ],
    examples: [
      "For a constitutional dispute, first read the official order or judgment, then map the doctrine and the issue of institutional balance.",
      "A Prelims trap often turns on the exact wording of a constitutional power, the actor who exercises it or a procedural condition.",
    ],
    related: [
      { label: "GS-II Constitution", href: "/syllabus?topic=gs2.constitution" },
      { label: "Governance", href: "/syllabus?topic=gs2.governance" },
      { label: "Current affairs", href: "/current-affairs" },
    ],
    prelimsTraps: [
      "Do not infer a constitutional rule from a news headline or from an unverified paraphrase of a judgment.",
      "Distinguish the Union executive, Governor, legislature and judiciary; their powers are not interchangeable.",
    ],
    mainsAngles: [
      "State the constitutional principle, apply it to the institution and facts, assess checks and consequences, then give a feasible reform or conclusion.",
      "If the source is a court judgment, present the holding accurately before offering analysis; cite the judgment itself, not commentary alone.",
    ],
    revisionNote: "Draw a four-box map: institution → source of power → check/remedy → citizen-facing consequence.",
    practiceQuestions: [
      "How can constitutional design balance institutional independence with accountability? Illustrate with a current, verified example of your choice.",
      "Explain how federal cooperation and constitutional checks can shape the implementation of public policy.",
    ],
    sources: [upscSyllabus, { label: "Legislative Department: Constitution of India", url: "https://legislative.gov.in/constitution-of-india/" }],
  },
  {
    id: "active-recall",
    topicId: "strategy.peripheral-trivia",
    title: "Revision that makes retrieval visible",
    stage: "All stages",
    readingTime: "5 min",
    definition: "Active recall means trying to retrieve an idea from memory before looking at notes. Spaced repetition schedules later retrieval attempts so that revision is distributed rather than concentrated in one sitting.",
    background: [
      "A reread can feel fluent without showing whether you can produce the idea unaided. A short closed-book prompt makes gaps observable.",
      "This app's review cards use a simple, transparent SM-2-style interval rule; it is a planning aid, not a scientifically optimal schedule for every learner.",
      "Your own difficulty ratings adjust the next review date. The system stores your card text, rating and due date in your private account database.",
    ],
    keyIdeas: [
      "Before revealing an answer, write or say what you remember; then compare and correct one or two gaps.",
      "Rate honestly: 'Again' if recall failed, 'Hard' if effortful, 'Good' if accurate, 'Easy' if fluent.",
      "Keep cards atomic: one concept, comparison, cause chain or example per card.",
    ],
    examples: [
      "Prompt: 'Explain one reason Harappan town planning cannot by itself prove a single political structure.'",
      "Prompt: 'Give three dimensions for comparing Rig Vedic and Later Vedic contexts, then state one source limitation.'",
    ],
    related: [
      { label: "Today's study plan", href: "/study-plan" },
      { label: "Create a note", href: "/notes" },
      { label: "Progress overview", href: "/progress" },
    ],
    prelimsTraps: ["Do not turn every card into a list of obscure facts; practise distinctions, definitions and common confusions."],
    mainsAngles: ["After retrieval, add one sentence that turns the fact into an argument, example or qualification."],
    revisionNote: "The card is the question; answer before reveal. If your answer is incomplete, edit the card or add a concise note.",
    practiceQuestions: [
      "Create one question that tests a concept rather than recognition, then answer it without notes.",
      "Which part of a recent answer did you retrieve accurately, and what should the next card test?",
    ],
    sources: [upscSyllabus, { label: "UPSC official question paper archive for practice", url: upscArchive.url }],
  },
];

export function getLesson(id: string) {
  return lessons.find((lesson) => lesson.id === id);
}
