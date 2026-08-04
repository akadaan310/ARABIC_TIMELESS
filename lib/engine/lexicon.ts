/**
 * The lexicon — Layer 6's cheapest filter, and Layer 12's validator.
 *
 * Deliberately pluggable. The seed corpus below is a working set of common
 * Arabic words and triliteral roots, enough for the filter to do real work
 * on ordinary text. A larger corpus — or a Quranic one — is dropped in by
 * calling `setLexicon`, and nothing else in the engine changes.
 *
 * The engine never claims a word is impossible because the seed lexicon
 * lacks it. `has` returning false narrows a candidate set; it does not
 * declare a verdict about the language.
 */

import { stripMarks, fold } from "./text";

export interface Lexicon {
  name: string;
  has(word: string): boolean;
  hasRoot(root: string[]): boolean;
  readonly wordCount: number;
  readonly rootCount: number;
  words(): Iterable<string>;
}

// ---------------------------------------------------------------------------
// Seed corpus
// ---------------------------------------------------------------------------

const SEED_WORDS = `
كتب كتاب مكتب مكتبة كاتب مكتوب كتابة كتبت كتابات
درس مدرسة مدرس دراسة تدريس دارس مدروس
علم عالم معلوم تعليم معلم علوم عليم علماء
قرا قراءه قارئ قران مقروء
سمع سامع مسموع سماع
نظر منظر ناظر نظره انتظار منظور
حكم حاكم محكمه حكمه احكام حكيم
سلم سلام مسلم اسلام سليم تسليم
خلق خالق مخلوق خلاق
رحم رحمه رحيم رحمن مرحوم
ملك مملكه ملوك مالك مليك
قدر قادر مقدور قدره تقدير
جمع جامع مجموع جماعه اجتماع مجمع
عمل عامل معمول عمليه اعمال
فتح فاتح مفتاح فتوح افتتاح
نصر ناصر منصور نصير انتصار
شكر شاكر مشكور شكور
صبر صابر صبور
ذكر ذاكر مذكور ذكرى تذكير
حمد حامد محمود حميد احمد محمد
عبد عابد معبود عباده عبيد
سجد ساجد مسجد سجود سجده
ركع راكع ركوع
دعا دعاء داعي مدعو
هدى هادي مهدي هدايه
ضل ضال مضل ضلال
نور منير انوار
ظلم ظالم مظلوم ظلام ظلمه
حق حقيقه محقق
صدق صادق تصديق صديق
كذب كاذب تكذيب
وعد موعود ميعاد
وقت مواقيت توقيت
يوم ايام
ليل ليله ليالي
شمس قمر نجم نجوم
ارض سماء سموات
جبل جبال بحر بحار نهر انهار
شجر ورق ثمر ثمار
بيت بيوت
باب ابواب
طريق طرق
قلب قلوب
عين عيون
رجل رجال
نساء
ولد اولاد
اباء
امهات
اخ اخوه
نفس نفوس انفس
روح ارواح
عقل عقول
لسان السنه
كلمه كلمات كلام متكلم
حرف حروف
لغه لغات
معنى معاني
سؤال اسئله
جواب اجوبه
كبير صغير
طويل قصير
جديد قديم
حسن قبيح
خير شر
كثير قليل
اول اخر
واحد اثنان ثلاثه اربعه خمسه سته سبعه ثمانيه تسعه عشره
مدينه مدن
دار ديار
سبيل سبل
امر اوامر
اسم اسماء
حال احوال
شان
سبب اسباب
عمر
حياه حي
موت ميت
رزق رازق مرزوق
شكل اشكال
لون الوان
عرف عارف معروف معرفه
جهل جاهل مجهول جهاله
سال سائل مسؤول
قال قائل مقول قول
فعل فاعل مفعول
سعد سعيد سعاده
حزن حزين
فرح فرحان
غضب غاضب
حب حبيب محبوب محبه
بغض
عرب عربي عربيه
عجم اعجمي
`.trim().split(/\s+/);

const SEED_ROOTS = `
كتب درس علم قرا سمع نظر حكم سلم خلق رحم ملك قدر جمع عمل فتح نصر شكر صبر
ذكر حمد عبد سجد ركع دعو هدي ضلل نور ظلم حقق صدق كذب وعد وقت يوم ليل شمس
قمر نجم ارض سمو جبل بحر نهر شجر ورق ثمر بيت بوب طرق قلب عين رجل نسو ولد
ابو امم اخو نفس روح عقل لسن كلم حرف لغو عني سال جوب كبر صغر طول قصر جدد
قدم حسن قبح خير شرر كثر قلل اول اخر وحد ثني ثلث ربع خمس مدن دور سبل امر
سمي حول شان سبب عمر حيي موت رزق شكل لون عرف جهل قول فعل سعد حزن فرح غضب
حبب بغض عرب عجم فكر ذهب جعل وجد اخذ كون قوم مشي جري نصف بلغ رفع وضع طلب
حمل دفع رجع بدا نهي عرض قصد سلك مسك حفظ ترك بقي زاد نقص فرق وصل قطع
`.trim().split(/\s+/);

// ---------------------------------------------------------------------------

function normalizeEntry(w: string): string {
  return [...stripMarks(w)]
    .map((ch) => fold(ch) ?? "")
    .join("");
}

class SetLexicon implements Lexicon {
  readonly name: string;
  private readonly wordSet: Set<string>;
  private readonly rootSet: Set<string>;

  constructor(name: string, words: string[], roots: string[]) {
    this.name = name;
    this.wordSet = new Set(words.map(normalizeEntry).filter(Boolean));
    this.rootSet = new Set(roots.map(normalizeEntry).filter(Boolean));
  }

  has(word: string): boolean {
    return this.wordSet.has(normalizeEntry(word));
  }

  hasRoot(root: string[]): boolean {
    return this.rootSet.has(normalizeEntry(root.join("")));
  }

  get wordCount() { return this.wordSet.size; }
  get rootCount() { return this.rootSet.size; }
  words() { return this.wordSet.values(); }
}

export const SEED_LEXICON: Lexicon = new SetLexicon(
  "seed",
  SEED_WORDS,
  SEED_ROOTS,
);

let active: Lexicon = SEED_LEXICON;

export const getLexicon = (): Lexicon => active;

/** Swap the corpus. Everything downstream picks it up with no other change. */
export const setLexicon = (lex: Lexicon): void => { active = lex; };

/** Build a lexicon from raw text — the path a Quranic corpus will take. */
export function lexiconFromText(name: string, text: string, roots: string[] = []): Lexicon {
  const words = text.split(/\s+/).filter(Boolean);
  return new SetLexicon(name, words, roots);
}
