/**
 * Layer 13 — the pattern library.
 *
 * A pattern is a term with three holes. Templates are written with the
 * digits 1, 2, 3 standing for the first, second and third radical, because
 * digits never occur in Arabic text and so can never be confused with the
 * literal material of a template. This is the ف ع ل calculus with unambiguous
 * placeholders.
 *
 * Application is substitution. Abstraction is alignment — and alignment is
 * how the engine recovers both the pattern and the root from a bare word,
 * which is spec/13-pattern.md §13.2 made executable.
 */

export interface Pattern {
  id: string;
  /** consonantal template; 1 2 3 are the radicals */
  template: string;
  /** how the pattern is named, in the tradition */
  name: string;
  kind: "verb" | "noun" | "participle" | "masdar" | "plural";
  /** verb form number, where the pattern is one */
  form?: number;
  meaning: string;
}

export const PATTERNS: Pattern[] = [
  // --- the verb forms -----------------------------------------------------
  { id: "I",     template: "123",     name: "فَعَلَ",        kind: "verb", form: 1,  meaning: "base" },
  { id: "II",    template: "123",     name: "فَعَّلَ",       kind: "verb", form: 2,  meaning: "intensive / causative — doubles the second radical" },
  { id: "III",   template: "1ا23",    name: "فَاعَلَ",       kind: "verb", form: 3,  meaning: "associative — lengthens after the first radical" },
  { id: "IV",    template: "ا123",    name: "أَفْعَلَ",      kind: "verb", form: 4,  meaning: "causative" },
  { id: "V",     template: "ت123",    name: "تَفَعَّلَ",     kind: "verb", form: 5,  meaning: "reflexive of II" },
  { id: "VI",    template: "ت1ا23",   name: "تَفَاعَلَ",     kind: "verb", form: 6,  meaning: "reciprocal of III" },
  { id: "VII",   template: "ان123",   name: "اِنْفَعَلَ",    kind: "verb", form: 7,  meaning: "medio-passive" },
  { id: "VIII",  template: "ا1ت23",   name: "اِفْتَعَلَ",    kind: "verb", form: 8,  meaning: "reflexive / middle" },
  { id: "IX",    template: "ا123",    name: "اِفْعَلَّ",     kind: "verb", form: 9,  meaning: "colours and defects" },
  { id: "X",     template: "است123",  name: "اِسْتَفْعَلَ",  kind: "verb", form: 10, meaning: "requestative" },

  // --- participles and agents ---------------------------------------------
  { id: "agent",     template: "1ا23",   name: "فَاعِل",    kind: "participle", meaning: "agent — the one who does" },
  { id: "patient",   template: "م12و3",  name: "مَفْعُول",  kind: "participle", meaning: "patient — the thing done" },
  { id: "agentII",   template: "م123",   name: "مُفَعِّل",  kind: "participle", meaning: "agent of Form II" },
  { id: "patientII", template: "م123",   name: "مُفَعَّل",  kind: "participle", meaning: "patient of Form II" },
  { id: "agentX",    template: "مست123", name: "مُسْتَفْعِل", kind: "participle", meaning: "agent of Form X" },

  // --- nouns of place, instrument, result ----------------------------------
  { id: "place",      template: "م123",   name: "مَفْعَل",   kind: "noun", meaning: "place where the act happens" },
  { id: "placeFem",   template: "م123ه",  name: "مَفْعَلَة", kind: "noun", meaning: "place, feminine" },
  { id: "instrument", template: "م12ا3",  name: "مِفْعَال",  kind: "noun", meaning: "instrument" },
  { id: "result",     template: "12ا3",   name: "فِعَال",    kind: "noun", meaning: "instrument or result" },
  { id: "quality",    template: "12ي3",   name: "فَعِيل",    kind: "noun", meaning: "quality, intensive adjective" },
  { id: "doerHabit",  template: "12ا3",   name: "فَعَّال",   kind: "noun", meaning: "habitual doer, profession" },
  { id: "abstract",   template: "12و3",   name: "فُعُول",    kind: "noun", meaning: "abstract or verbal noun" },
  { id: "unit",       template: "123ه",   name: "فَعْلَة",   kind: "noun", meaning: "a single instance of the act" },

  // --- verbal nouns --------------------------------------------------------
  { id: "masdarII",   template: "ت12ي3",  name: "تَفْعِيل",     kind: "masdar", meaning: "verbal noun of II" },
  { id: "masdarIII",  template: "م1ا23ه", name: "مُفَاعَلَة",   kind: "masdar", meaning: "verbal noun of III" },
  { id: "masdarIV",   template: "ا12ا3",  name: "إِفْعَال",     kind: "masdar", meaning: "verbal noun of IV" },
  { id: "masdarVII",  template: "ان12ا3", name: "اِنْفِعَال",   kind: "masdar", meaning: "verbal noun of VII" },
  { id: "masdarVIII", template: "ا1ت2ا3", name: "اِفْتِعَال",   kind: "masdar", meaning: "verbal noun of VIII" },
  { id: "masdarX",    template: "است12ا3", name: "اِسْتِفْعَال", kind: "masdar", meaning: "verbal noun of X" },

  // --- broken plurals ------------------------------------------------------
  { id: "pluralA",  template: "ا12ا3",  name: "أَفْعَال",   kind: "plural", meaning: "broken plural" },
  { id: "pluralB",  template: "12و3",   name: "فُعُول",     kind: "plural", meaning: "broken plural" },
  { id: "pluralC",  template: "1وا23",  name: "فَوَاعِل",   kind: "plural", meaning: "broken plural" },
  { id: "pluralD",  template: "م1ا2ي3", name: "مَفَاعِيل",  kind: "plural", meaning: "broken plural of مفعول" },
  { id: "pluralE",  template: "123ان",  name: "فِعْلَان",   kind: "plural", meaning: "broken plural" },
  { id: "pluralF",  template: "12ائ3",  name: "فَعَائِل",   kind: "plural", meaning: "broken plural" },
];

export const PATTERN_BY_ID: Record<string, Pattern> = Object.fromEntries(
  PATTERNS.map((p) => [p.id, p]),
);

const RADICAL_SLOTS = ["1", "2", "3"];

/** apply(pattern, root) — substitution. spec/13-pattern.md §13.2. */
export function applyPattern(pattern: Pattern, root: string[]): string {
  if (root.length < 3) return "";
  return [...pattern.template]
    .map((ch) => {
      const slot = RADICAL_SLOTS.indexOf(ch);
      return slot >= 0 ? root[slot] : ch;
    })
    .join("");
}

export interface Alignment {
  pattern: Pattern;
  root: string[];
}

/**
 * abstract(word) — recover every (pattern, root) pair that could have
 * produced this letter string.
 *
 * This is reverse-engineering a function from one of its outputs. It returns
 * every alignment rather than one, because a bare consonantal string is
 * genuinely ambiguous between patterns — Form I and Form II share a skeleton
 * entirely, and فَاعَلَ and فَاعِل share one too.
 */
export function abstractWord(letters: string[]): Alignment[] {
  const out: Alignment[] = [];
  const word = letters.join("");

  for (const pattern of PATTERNS) {
    const root = alignOne(pattern.template, word);
    if (root) out.push({ pattern, root });
  }
  return out;
}

/**
 * Align a template against a word. Returns the three radicals if the literal
 * material matches exactly and every slot is filled, otherwise null.
 */
function alignOne(template: string, word: string): string[] | null {
  const t = [...template];
  const w = [...word];
  if (t.length !== w.length) return null;

  const root: string[] = ["", "", ""];
  for (let i = 0; i < t.length; i++) {
    const slot = RADICAL_SLOTS.indexOf(t[i]);
    if (slot >= 0) {
      root[slot] = w[i];
    } else if (t[i] !== w[i]) {
      return null;
    }
  }
  return root.every((r) => r !== "") ? root : null;
}

/** Every distinct root a word could be built on. */
export function candidateRoots(letters: string[]): string[][] {
  const seen = new Set<string>();
  const out: string[][] = [];
  for (const { root } of abstractWord(letters)) {
    const key = root.join("");
    if (!seen.has(key)) {
      seen.add(key);
      out.push(root);
    }
  }
  return out;
}

/** The fibre over a root — every word the library can build on it. */
export function fibre(root: string[]): { pattern: Pattern; word: string }[] {
  return PATTERNS.map((pattern) => ({ pattern, word: applyPattern(pattern, root) }))
    .filter((x) => x.word.length > 0);
}
