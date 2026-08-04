/**
 * The corpus of worked examples.
 *
 * `إفتح سمسم` is the hello-world: a phrase whose entire job is to *cause an
 * opening*. It is a password, which is to say a string evaluated for effect —
 * and the engine shows that its skeleton admits 120 readings, only one of
 * which opens anything.
 */

export interface Example {
  id: string;
  text: string;
  gloss: string;
  /** why this one is worth running */
  note: string;
  group: "hello" | "minimal" | "mysterious" | "composition";
}

export const EXAMPLES: Example[] = [
  {
    id: "sesame",
    text: "إفتح سمسم",
    gloss: "Open sesame",
    note: "The hello-world. A password is a string evaluated for effect, and this one carries 120 readings — only one opens the cave.",
    group: "hello",
  },

  // --- minimal ------------------------------------------------------------
  {
    id: "kataba",
    text: "كتب",
    gloss: "he wrote",
    note: "Three letters, fifteen readings, and weight alone cuts it to two.",
    group: "minimal",
  },
  {
    id: "iqra",
    text: "اقرأ",
    gloss: "Read!",
    note: "The first command. Reading is the operation the whole architecture describes, and here it is as a word.",
    group: "minimal",
  },
  {
    id: "maktaba",
    text: "مكتبة",
    gloss: "library",
    note: "A place, built by applying a pattern to a root. Watch abstraction recover the function from its output.",
    group: "minimal",
  },
  {
    id: "salam",
    text: "سلام",
    gloss: "peace",
    note: "One slot open, and its root carries both the greeting and the surrender.",
    group: "minimal",
  },

  // --- mysterious ---------------------------------------------------------
  {
    id: "alm",
    text: "الم",
    gloss: "alif · lām · mīm",
    note: "The opening letters of Sūrat al-Baqara, unexplained for fourteen centuries. The engine finds them fully determined — degree 1, arity 0. The most mysterious letters in the book are the ones the skeleton leaves nothing open in.",
    group: "mysterious",
  },
  {
    id: "nun",
    text: "ن",
    gloss: "nūn",
    note: "One letter, alone. Isolated, it leaves the tooth entirely and takes a shape only it has — so a single ن is unambiguous where a medial one would be five ways open.",
    group: "mysterious",
  },
  {
    id: "kahyaas",
    text: "كهيعص",
    gloss: "kāf · hāʾ · yāʾ · ʿayn · ṣād",
    note: "The opening of Sūrat Maryam. Five letters, one unbroken run, twenty readings — and no word in any lexicon to collapse them.",
    group: "mysterious",
  },
  {
    id: "taha",
    text: "طه",
    gloss: "ṭā · hā",
    note: "Two letters, two readings. The smallest genuine ambiguity the script can produce.",
    group: "mysterious",
  },
  {
    id: "nuun-word",
    text: "نون",
    gloss: "nūn (the letter, spelled)",
    note: "A palindrome — fixed under reversal, and so immune to transposition as a damage mode. It carries its own check.",
    group: "mysterious",
  },
  {
    id: "kun",
    text: "كن فيكون",
    gloss: "Be — and it is",
    note: "The creative command. كن is fully determined; فيكون is ten ways open. Certainty and possibility in one phrase.",
    group: "mysterious",
  },

  // --- compositions -------------------------------------------------------
  {
    id: "basmala",
    text: "بسم الله الرحمن الرحيم",
    gloss: "In the name of God, the Merciful, the Compassionate",
    note: "Four words. Run the joint degree and see how large the space is that a practised reader crosses without noticing.",
    group: "composition",
  },
  {
    id: "ilm",
    text: "العلم نور",
    gloss: "Knowledge is light",
    note: "A short sentence, and every layer has something to say about it.",
    group: "composition",
  },
  {
    id: "voweled",
    text: "كَتَبَ",
    gloss: "he wrote, with tashkīl",
    note: "Fully bound. The pulse channel wakes up only when the vowels are written.",
    group: "composition",
  },
];

export const HELLO_WORLD = EXAMPLES[0];

export const byGroup = (g: Example["group"]) => EXAMPLES.filter((e) => e.group === g);

export const GROUPS: { id: Example["group"]; label: string; ar: string }[] = [
  { id: "hello", label: "Hello world", ar: "البداية" },
  { id: "minimal", label: "Minimal", ar: "المفرد" },
  { id: "mysterious", label: "Mysterious", ar: "المقطّعات" },
  { id: "composition", label: "Compositions", ar: "التركيب" },
];
