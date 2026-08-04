/**
 * The included passages.
 *
 * Ten compositions to explore, chosen so the operations have different things
 * to bite on: classical and modern, verse and prose, the famously determined
 * and the famously open.
 */

export interface CorpusEntry {
  id: string;
  title: string;
  titleAr: string;
  source: string;
  text: string;
  /** what this passage is good for */
  note: string;
}

export const CORPUS: CorpusEntry[] = [
  {
    id: "sesame",
    title: "Open sesame",
    titleAr: "إفتح سمسم",
    source: "the hello-world",
    text: "إفتح سمسم",
    note: "A password — a string uttered for its effect. Two words, 120 readings, one of which opens.",
  },
  {
    id: "fatiha",
    title: "Al-Fātiḥa",
    titleAr: "الفاتحة",
    source: "Qurʾān 1:1–7",
    text: `بسم الله الرحمن الرحيم
الحمد لله رب العالمين
الرحمن الرحيم
مالك يوم الدين
إياك نعبد وإياك نستعين
اهدنا الصراط المستقيم
صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين`,
    note: "The opening. Fully covered by the lexicon, so every operation has data to work with.",
  },
  {
    id: "ikhlas",
    title: "Al-Ikhlāṣ",
    titleAr: "الإخلاص",
    source: "Qurʾān 112",
    text: `قل هو الله أحد
الله الصمد
لم يلد ولم يولد
ولم يكن له كفوا أحد`,
    note: "Four short lines built on very few roots — the re-patterning operation shows its hand clearly here.",
  },
  {
    id: "muqattaat",
    title: "The disjoined letters",
    titleAr: "المقطّعات",
    source: "Qurʾān, sura openings",
    text: "الم المص الر المر كهيعص طه طسم طس يس ص حم ق ن",
    note: "Fourteen openings nobody has explained. The engine finds several of them fully determined — zero ambiguity, arity nought.",
  },
  {
    id: "nur",
    title: "The Light Verse",
    titleAr: "آية النور",
    source: "Qurʾān 24:35",
    text: "الله نور السماوات والأرض مثل نوره كمشكاة فيها مصباح المصباح في زجاجة الزجاجة كأنها كوكب دري يوقد من شجرة مباركة زيتونة لا شرقية ولا غربية",
    note: "Dense with imagery and with repeated roots — the root reduction turns it into something startling.",
  },
  {
    id: "kahf",
    title: "The sleepers",
    titleAr: "أهل الكهف",
    source: "Qurʾān 18:9–10",
    text: `أم حسبت أن أصحاب الكهف والرقيم كانوا من آياتنا عجبا
إذ أوى الفتية إلى الكهف فقالوا ربنا آتنا من لدنك رحمة وهيئ لنا من أمرنا رشدا`,
    note: "The sura of time. Read it, then travel its own text backward to the manuscript state.",
  },
  {
    id: "naml",
    title: "Before your glance returns",
    titleAr: "قبل أن يرتد إليك طرفك",
    source: "Qurʾān 27:40",
    text: "قال الذي عنده علم من الكتاب أنا آتيك به قبل أن يرتد إليك طرفك",
    note: "Knowledge of the Book, and a thing arriving faster than a glance. The passage the teleport operation is named after.",
  },
  {
    id: "ilm",
    title: "Knowledge is light",
    titleAr: "العلم نور",
    source: "proverb",
    text: "العلم نور والجهل ظلام والكتاب خير جليس في الزمان",
    note: "Modern proverbial Arabic. Watch the lexicon resolve its classical core and report the rest as uncovered.",
  },
  {
    id: "mutanabbi",
    title: "Al-Mutanabbī",
    titleAr: "المتنبي",
    source: "classical verse",
    text: "الخيل والليل والبيداء تعرفني والسيف والرمح والقرطاس والقلم",
    note: "A single line of verse, built almost entirely of nouns. Its weight and its rhythm are both worth looking at.",
  },
  {
    id: "khalil",
    title: "The circles",
    titleAr: "دوائر العروض",
    source: "on al-Khalīl",
    text: "الخليل بن أحمد الفراهيدي وضع علم العروض ورتب الحروف على مخارجها وجمع الكلام في دوائر",
    note: "Prose about the man whose combinatorics this whole architecture rests on.",
  },
];

export const byId = (id: string) => CORPUS.find((c) => c.id === id);
