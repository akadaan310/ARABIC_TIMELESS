/**
 * The included passages.
 *
 * Ancient poetry, classical verse, proverbs, and pieces built deliberately to
 * make one operation show its hand. Chosen so the operations have different
 * things to bite on: the famously determined and the famously open, dense
 * roots and scattered ones, symmetry and its absence.
 *
 * A note on coverage. The lexicon is derived from a classical corpus, so
 * pre-Islamic poetry resolves partially — its vocabulary is older and wider
 * than any single corpus. The engine reports what it could not resolve rather
 * than guessing, and the kernel operations (skeleton, weight, profile,
 * openness, symmetry) need no lexicon at all.
 */

export interface CorpusEntry {
  id: string;
  title: string;
  titleAr: string;
  source: string;
  era: string;
  text: string;
  /** what this passage is good for */
  note: string;
  /** operation ids this passage shows off */
  best?: string[];
}

export const CORPUS: CorpusEntry[] = [
  // --- constructed -------------------------------------------------------
  {
    id: "sesame",
    title: "Open sesame",
    titleAr: "إفتح سمسم",
    source: "the hello-world",
    era: "folk",
    text: "إفتح سمسم",
    note: "A password — a string uttered for its effect. Two words, 120 readings, one of which opens.",
    best: ["skeleton", "openness"],
  },
  {
    id: "oneroot",
    title: "One root, six words",
    titleAr: "جذر واحد",
    source: "constructed",
    era: "made for this",
    text: "كتب الكاتب كتابا مكتوبا في مكتبة الكتاب",
    note: "Every content word here is built on ك–ت–ب. Reduce it to roots and the whole line collapses to one word repeated — then re-pattern it and watch six new words come back out of the same three letters.",
    best: ["roots", "repattern"],
  },
  {
    id: "unmoved",
    title: "The unmoved alphabet",
    titleAr: "الحروف الثابتة",
    source: "constructed",
    era: "made for this",
    text: "لكم الملك وله المال",
    note: "Written entirely from ا ك ل م ه و — the six letters alone in their shape classes. Every word has degree 1: the skeleton determines this line absolutely, and no silent substitution can touch it. Dotless Arabic with zero ambiguity.",
    best: ["skeleton", "silent", "openness"],
  },
  {
    id: "teeth",
    title: "Nothing but teeth",
    titleAr: "الأسنان",
    source: "constructed",
    era: "made for this",
    text: "بين يديه نبين تبيين",
    note: "The opposite extreme — packed with the letters that all collapse onto one tooth. The openness map runs off the end here.",
    best: ["openness", "skeleton"],
  },

  // --- pre-Islamic -------------------------------------------------------
  {
    id: "imrualqays",
    title: "Imruʾ al-Qays",
    titleAr: "امرؤ القيس",
    source: "Muʿallaqa, opening",
    era: "pre-Islamic",
    text: "قفا نبك من ذكرى حبيب ومنزل بسقط اللوى بين الدخول فحومل",
    note: "The most famous opening in Arabic. Two imperatives, a memory, and a list of place names — which the lexicon will not know, and says so.",
    best: ["skeleton", "weightmap"],
  },
  {
    id: "antara",
    title: "ʿAntara ibn Shaddād",
    titleAr: "عنترة بن شداد",
    source: "Muʿallaqa, opening",
    era: "pre-Islamic",
    text: "هل غادر الشعراء من متردم أم هل عرفت الدار بعد توهم",
    note: "A poet asking whether anything is left to say. Dense in roots that are still live in modern Arabic.",
    best: ["roots", "repattern"],
  },
  {
    id: "tarafa",
    title: "Ṭarafa ibn al-ʿAbd",
    titleAr: "طرفة بن العبد",
    source: "Muʿallaqa",
    era: "pre-Islamic",
    text: "ستبدي لك الأيام ما كنت جاهلا ويأتيك بالأخبار من لم تزود",
    note: "The days will show you what you did not know. Ordinary vocabulary, high resolution — a good passage to try every operation on.",
    best: ["gloss", "repattern", "taqlib"],
  },
  {
    id: "khansa",
    title: "Al-Khansāʾ",
    titleAr: "الخنساء",
    source: "elegy for Ṣakhr",
    era: "pre-Islamic",
    text: "وإن صخرا لتأتم الهداة به كأنه علم في رأسه نار",
    note: "A mountain with a fire on its head, as an image for a dead brother. Note what the weight map does across the two halves.",
    best: ["weightmap", "articulation"],
  },

  // --- classical ---------------------------------------------------------
  {
    id: "mutanabbi",
    title: "Al-Mutanabbī",
    titleAr: "المتنبي",
    source: "on himself",
    era: "10th century",
    text: "الخيل والليل والبيداء تعرفني والسيف والرمح والقرطاس والقلم",
    note: "Almost entirely nouns, in two matched lists. The segment profile has an unusually strong rhythm here.",
    best: ["weightmap", "openness"],
  },
  {
    id: "mutanabbi2",
    title: "Al-Mutanabbī, on resolve",
    titleAr: "على قدر أهل العزم",
    source: "panegyric",
    era: "10th century",
    text: "على قدر أهل العزم تأتي العزائم وتأتي على قدر الكرام المكارم",
    note: "Built on repetition — قدر twice, تأتي twice, and two words from the same root closing each half. Taqlīb and re-pattern both have plenty to work with.",
    best: ["repattern", "taqlib", "roots"],
  },
  {
    id: "abutammam",
    title: "Abū Tammām",
    titleAr: "أبو تمام",
    source: "on the conquest of Amorium",
    era: "9th century",
    text: "السيف أصدق أنباء من الكتب في حده الحد بين الجد واللعب",
    note: "The sword is truer than books. Two words from ح–د–د sit next to each other, and جد and لعب close it on a near-rhyme.",
    best: ["roots", "sameSkeleton"],
  },
  {
    id: "maarri",
    title: "Al-Maʿarrī",
    titleAr: "أبو العلاء المعري",
    source: "Luzūmiyyāt",
    era: "11th century",
    text: "غير مجد في ملتي واعتقادي نوح باك ولا ترنم شاد",
    note: "A sceptic's line, and a hard one — several words sit outside the lexicon entirely, which makes it a good test of what the kernel can still say without help.",
    best: ["skeleton", "openness"],
  },
  {
    id: "ibnzaydun",
    title: "Ibn Zaydūn",
    titleAr: "ابن زيدون",
    source: "Nūniyya",
    era: "11th century, al-Andalus",
    text: "أضحى التنائي بديلا من تدانينا وناب عن طيب لقيانا تجافينا",
    note: "Distance stood in for our closeness. Three words here are built on roots that also appear in their own opposites.",
    best: ["taqlib", "roots"],
  },

  // --- proverbial --------------------------------------------------------
  {
    id: "ilm",
    title: "Knowledge is light",
    titleAr: "العلم نور",
    source: "proverb",
    era: "common",
    text: "العلم نور والجهل ظلام والكتاب خير جليس في الزمان",
    note: "Everyday proverbial Arabic. Short, familiar, and a fair sample of how modern vocabulary resolves against a classical lexicon.",
    best: ["gloss", "roots"],
  },
  {
    id: "waqt",
    title: "Time is a sword",
    titleAr: "الوقت كالسيف",
    source: "proverb",
    era: "common",
    text: "الوقت كالسيف إن لم تقطعه قطعك",
    note: "A conditional built on one root used twice, in two different persons. Reduce to roots and the sentence nearly disappears.",
    best: ["roots", "lemmas"],
  },
];

export const byId = (id: string) => CORPUS.find((c) => c.id === id);

export const ERAS = [
  "made for this",
  "folk",
  "pre-Islamic",
  "9th century",
  "10th century",
  "11th century",
  "11th century, al-Andalus",
  "common",
];
