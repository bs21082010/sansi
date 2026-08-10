import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") || "";
const GH_MODEL = Deno.env.get("GH_MODEL") || "gpt-4o-mini";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") || "nvidia/nemotron-3-super-120b-a12b:free";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function callAI(messages: { role: string; content: string }[], temperature: number, provider?: string): Promise<string> {
  const useOpenRouter = provider === "openrouter" ? true : provider === "github" ? false : !!OPENROUTER_API_KEY;
  if (useOpenRouter) {
    const ai = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + OPENROUTER_API_KEY, "HTTP-Referer": "https://sansai-eight.vercel.app", "X-Title": "Sansi Sanskrit Tutor" },
      body: JSON.stringify({ model: OPENROUTER_MODEL, messages, temperature, max_tokens: 1024 }),
    });
    if (!ai.ok) throw new Error("OpenRouter error: " + ai.status);
    const res = await ai.json();
    return res?.choices?.[0]?.message?.content || "";
  }
  if (!GITHUB_TOKEN) throw new Error("AI service not configured");
  const ai = await fetch("https://models.inference.ai.azure.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GITHUB_TOKEN },
    body: JSON.stringify({ model: GH_MODEL, messages, temperature, max_tokens: 1024 }),
  });
  if (!ai.ok) throw new Error("AI service error: " + ai.status);
  const res = await ai.json();
  return res?.choices?.[0]?.message?.content || "";
}

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Authorization,Content-Type" };

function json(d: unknown, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }); }
function err(m: string, s = 400) { return json({ detail: m }, s); }

const ROLE_HIERARCHY: Record<string, number> = { student: 0, contributor: 1, moderator: 2, admin: 3 };

async function getUser(id: string) {
  const { data, error: e } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (e || !data) return null;
  return data;
}

async function requireUser(req: Request): Promise<string> {
  const a = req.headers.get("Authorization");
  if (!a?.startsWith("Bearer ")) throw new Error("Missing auth");
  const { data: { user }, error: e } = await supabase.auth.getUser(a.slice(7));
  if (e || !user) throw new Error("Invalid or expired token");
  return user.id;
}

async function requireRole(req: Request, min: string) {
  const uid = await requireUser(req);
  const p = await getUser(uid);
  if (!p || (ROLE_HIERARCHY[p.role] ?? -1) < (ROLE_HIERARCHY[min] ?? 0)) throw new Error("Requires role '" + min + "' or higher");
  return uid;
}

async function parseBody<T>(r: Request): Promise<T> {
  const ct = r.headers.get("content-type") || "";
  if (ct.includes("application/json")) { const t = await r.text(); return JSON.parse(t); }
  const f = await r.formData(); return Object.fromEntries(f) as T;
}

const DICT: Record<string, { meaning: string; iast: string; pos: string; info?: string }> = {
  "नमस्ते": { meaning: "Hello / Greetings", iast: "namaste", pos: "interjection" },
  "राम": { meaning: "Rama (the hero of Ramayana)", iast: "rāma", pos: "noun", info: "masculine a-stem noun" },
  "रामः": { meaning: "Rama (nominative singular)", iast: "rāmaḥ", pos: "noun", info: "masculine a-stem, nominative singular" },
  "रामम्": { meaning: "Rama (accusative singular)", iast: "rāmam", pos: "noun", info: "masculine a-stem, accusative singular" },
  "रामेण": { meaning: "by/with Rama (instrumental singular)", iast: "rāmeṇa", pos: "noun", info: "masculine a-stem, instrumental singular" },
  "रामाय": { meaning: "to/for Rama (dative singular)", iast: "rāmāya", pos: "noun", info: "masculine a-stem, dative singular" },
  "रामात्": { meaning: "from Rama (ablative singular)", iast: "rāmāt", pos: "noun", info: "masculine a-stem, ablative singular" },
  "रामस्य": { meaning: "of Rama (genitive singular)", iast: "rāmasya", pos: "noun", info: "masculine a-stem, genitive singular" },
  "रामे": { meaning: "in/on Rama (locative singular)", iast: "rāme", pos: "noun", info: "masculine a-stem, locative singular" },
  "रामौ": { meaning: "two Ramas (nominative dual)", iast: "rāmau", pos: "noun", info: "masculine a-stem, nominative dual" },
  "रामाः": { meaning: "Ramas (nominative plural)", iast: "rāmāḥ", pos: "noun", info: "masculine a-stem, nominative plural" },
  "वन": { meaning: "forest", iast: "vana", pos: "noun", info: "neuter a-stem noun" },
  "वनम्": { meaning: "forest (nom/acc singular)", iast: "vanam", pos: "noun", info: "neuter a-stem" },
  "वने": { meaning: "in the forest / two forests", iast: "vane", pos: "noun", info: "neuter a-stem, locative singular or nominative dual" },
  "वनानि": { meaning: "forests (nominative plural)", iast: "vanāni", pos: "noun", info: "neuter a-stem, nominative plural" },
  "पुस्तक": { meaning: "book", iast: "pustaka", pos: "noun", info: "neuter a-stem" },
  "पुस्तकम्": { meaning: "book (nom/acc singular)", iast: "pustakam", pos: "noun", info: "neuter a-stem" },
  "गुरु": { meaning: "teacher", iast: "guru", pos: "noun", info: "masculine u-stem" },
  "गुरुः": { meaning: "teacher (nominative singular)", iast: "guruḥ", pos: "noun", info: "masculine u-stem, nominative singular" },
  "गुरवे": { meaning: "to/for the teacher", iast: "gurave", pos: "noun", info: "masculine u-stem, dative singular" },
  "मित्र": { meaning: "friend", iast: "mitra", pos: "noun", info: "masculine a-stem" },
  "मित्रम्": { meaning: "friend (nom/acc singular)", iast: "mitram", pos: "noun", info: "neuter a-stem" },
  "जल": { meaning: "water", iast: "jala", pos: "noun", info: "neuter a-stem" },
  "जलम्": { meaning: "water (nom/acc singular)", iast: "jalam", pos: "noun" },
  "फल": { meaning: "fruit", iast: "phala", pos: "noun", info: "neuter a-stem" },
  "फलम्": { meaning: "fruit (nom/acc singular)", iast: "phalam", pos: "noun" },
  "ग्राम": { meaning: "village", iast: "grāma", pos: "noun", info: "masculine a-stem" },
  "ग्रामः": { meaning: "village (nominative singular)", iast: "grāmaḥ", pos: "noun" },
  "ग्रामम्": { meaning: "to the village (accusative singular)", iast: "grāmam", pos: "noun" },
  "नगर": { meaning: "city", iast: "nagara", pos: "noun", info: "neuter a-stem" },
  "नगरम्": { meaning: "city (nom/acc singular)", iast: "nagaram", pos: "noun" },
  "विद्यालय": { meaning: "school", iast: "vidyālaya", pos: "noun" },
  "विद्यालयः": { meaning: "school (nominative singular)", iast: "vidyālayaḥ", pos: "noun" },
  "देव": { meaning: "god / deity", iast: "deva", pos: "noun" },
  "देवः": { meaning: "god (nominative singular)", iast: "devaḥ", pos: "noun" },
  "देवम्": { meaning: "god (accusative singular)", iast: "devam", pos: "noun" },
  "देवी": { meaning: "goddess (nominative singular)", iast: "devī", pos: "noun", info: "feminine ī-stem" },
  "बालक": { meaning: "boy / child", iast: "bālaka", pos: "noun" },
  "बालकः": { meaning: "boy (nominative singular)", iast: "bālakaḥ", pos: "noun" },
  "बालिका": { meaning: "girl (nominative singular)", iast: "bālikā", pos: "noun" },
  "पिता": { meaning: "father (nominative singular)", iast: "pitā", pos: "noun", info: "irregular r-stem" },
  "पितुः": { meaning: "of the father", iast: "pituḥ", pos: "noun" },
  "माता": { meaning: "mother (nominative singular)", iast: "mātā", pos: "noun", info: "irregular r-stem" },
  "मातुः": { meaning: "of the mother", iast: "mātuḥ", pos: "noun" },
  "पुत्र": { meaning: "son", iast: "putra", pos: "noun" },
  "पुत्रः": { meaning: "son (nominative singular)", iast: "putraḥ", pos: "noun" },
  "पुत्री": { meaning: "daughter (nominative singular)", iast: "putrī", pos: "noun" },
  "अहम्": { meaning: "I", iast: "aham", pos: "pronoun" },
  "त्वम्": { meaning: "you (singular)", iast: "tvam", pos: "pronoun" },
  "सः": { meaning: "he / that (masculine nom sg)", iast: "saḥ", pos: "pronoun" },
  "सा": { meaning: "she / that (feminine nom sg)", iast: "sā", pos: "pronoun" },
  "तत्": { meaning: "it / that (neuter nom/acc sg)", iast: "tat", pos: "pronoun" },
  "ते": { meaning: "they (masculine nom pl) / your", iast: "te", pos: "pronoun" },
  "ताः": { meaning: "they (feminine nom pl)", iast: "tāḥ", pos: "pronoun" },
  "तानि": { meaning: "they (neuter nom pl)", iast: "tāni", pos: "pronoun" },
  "किम्": { meaning: "what?", iast: "kim", pos: "interrogative" },
  "कः": { meaning: "who? (masculine)", iast: "kaḥ", pos: "interrogative" },
  "का": { meaning: "who? (feminine)", iast: "kā", pos: "interrogative" },
  "कुत्र": { meaning: "where?", iast: "kutra", pos: "adverb" },
  "कदा": { meaning: "when?", iast: "kadā", pos: "adverb" },
  "कथम्": { meaning: "how?", iast: "katham", pos: "adverb" },
  "किमर्थम्": { meaning: "why?", iast: "kimartham", pos: "adverb" },
  "च": { meaning: "and", iast: "ca", pos: "conjunction" },
  "वा": { meaning: "or", iast: "vā", pos: "conjunction" },
  "चेत्": { meaning: "if", iast: "cet", pos: "conjunction" },
  "हि": { meaning: "indeed / because", iast: "hi", pos: "particle" },
  "न": { meaning: "not / no", iast: "na", pos: "particle" },
  "अत्र": { meaning: "here", iast: "atra", pos: "adverb" },
  "तत्र": { meaning: "there", iast: "tatra", pos: "adverb" },
  "सर्वत्र": { meaning: "everywhere", iast: "sarvatra", pos: "adverb" },
  "अद्य": { meaning: "today", iast: "adya", pos: "adverb" },
  "श्वः": { meaning: "tomorrow", iast: "śvaḥ", pos: "adverb" },
  "ह्यः": { meaning: "yesterday", iast: "hyaḥ", pos: "adverb" },
  "सदा": { meaning: "always", iast: "sadā", pos: "adverb" },
  "कदाचित्": { meaning: "sometimes / ever", iast: "kadācit", pos: "adverb" },
  "एक": { meaning: "one", iast: "eka", pos: "numeral" },
  "द्वि": { meaning: "two", iast: "dvi", pos: "numeral" },
  "त्रि": { meaning: "three", iast: "tri", pos: "numeral" },
  "चत्वार": { meaning: "four", iast: "catvāra", pos: "numeral" },
  "पञ्च": { meaning: "five", iast: "pañca", pos: "numeral" },
  "षट्": { meaning: "six", iast: "ṣaṭ", pos: "numeral" },
  "सप्त": { meaning: "seven", iast: "sapta", pos: "numeral" },
  "अष्ट": { meaning: "eight", iast: "aṣṭa", pos: "numeral" },
  "नव": { meaning: "nine", iast: "nava", pos: "numeral" },
  "दश": { meaning: "ten", iast: "daśa", pos: "numeral" },
};

const VERBS: Record<string, { meaning: string; iast: string; root: string; root_iast: string; tense: string; person: string; number: string; pada: string }> = {
  "गच्छामि": { meaning: "I go", iast: "gacchāmi", root: "गम्", root_iast: "gam", tense: "present", person: "1st", number: "singular", pada: "parasmaipada" },
  "गच्छसि": { meaning: "you go (sg)", iast: "gacchasi", root: "गम्", root_iast: "gam", tense: "present", person: "2nd", number: "singular", pada: "parasmaipada" },
  "गच्छति": { meaning: "he/she/it goes", iast: "gacchati", root: "गम्", root_iast: "gam", tense: "present", person: "3rd", number: "singular", pada: "parasmaipada" },
  "गच्छावः": { meaning: "we two go", iast: "gacchāvaḥ", root: "गम्", root_iast: "gam", tense: "present", person: "1st", number: "dual", pada: "parasmaipada" },
  "गच्छथः": { meaning: "you two go", iast: "gacchathaḥ", root: "गम्", root_iast: "gam", tense: "present", person: "2nd", number: "dual", pada: "parasmaipada" },
  "गच्छतः": { meaning: "they two go", iast: "gacchataḥ", root: "गम्", root_iast: "gam", tense: "present", person: "3rd", number: "dual", pada: "parasmaipada" },
  "गच्छामः": { meaning: "we go", iast: "gacchāmaḥ", root: "गम्", root_iast: "gam", tense: "present", person: "1st", number: "plural", pada: "parasmaipada" },
  "गच्छथ": { meaning: "you (pl) go", iast: "gacchatha", root: "गम्", root_iast: "gam", tense: "present", person: "2nd", number: "plural", pada: "parasmaipada" },
  "गच्छन्ति": { meaning: "they go", iast: "gacchanti", root: "गम्", root_iast: "gam", tense: "present", person: "3rd", number: "plural", pada: "parasmaipada" },
  "आगच्छामि": { meaning: "I come", iast: "āgacchāmi", root: "आगम्", root_iast: "āgam", tense: "present", person: "1st", number: "singular", pada: "parasmaipada" },
  "आगच्छति": { meaning: "he/she/it comes", iast: "āgacchati", root: "आगम्", root_iast: "āgam", tense: "present", person: "3rd", number: "singular", pada: "parasmaipada" },
  "भवामि": { meaning: "I am / become", iast: "bhavāmi", root: "भू", root_iast: "bhū", tense: "present", person: "1st", number: "singular", pada: "parasmaipada" },
  "भवसि": { meaning: "you are", iast: "bhavasi", root: "भू", root_iast: "bhū", tense: "present", person: "2nd", number: "singular", pada: "parasmaipada" },
  "भवति": { meaning: "he/she/it is / becomes", iast: "bhavati", root: "भू", root_iast: "bhū", tense: "present", person: "3rd", number: "singular", pada: "parasmaipada" },
  "भवन्ति": { meaning: "they are", iast: "bhavanti", root: "भू", root_iast: "bhū", tense: "present", person: "3rd", number: "plural", pada: "parasmaipada" },
  "पठामि": { meaning: "I read / study", iast: "paṭhāmi", root: "पठ्", root_iast: "paṭh", tense: "present", person: "1st", number: "singular", pada: "parasmaipada" },
  "पठसि": { meaning: "you read", iast: "paṭhasi", root: "पठ्", root_iast: "paṭh", tense: "present", person: "2nd", number: "singular", pada: "parasmaipada" },
  "पठति": { meaning: "he/she/it reads", iast: "paṭhati", root: "पठ्", root_iast: "paṭh", tense: "present", person: "3rd", number: "singular", pada: "parasmaipada" },
  "पठन्ति": { meaning: "they read", iast: "paṭhanti", root: "पठ्", root_iast: "paṭh", tense: "present", person: "3rd", number: "plural", pada: "parasmaipada" },
  "लिखामि": { meaning: "I write", iast: "likhāmi", root: "लिख्", root_iast: "likh", tense: "present", person: "1st", number: "singular", pada: "parasmaipada" },
  "लिखसि": { meaning: "you write", iast: "likhasi", root: "लिख्", root_iast: "likh", tense: "present", person: "2nd", number: "singular", pada: "parasmaipada" },
  "लिखति": { meaning: "he/she/it writes", iast: "likhati", root: "लिख्", root_iast: "likh", tense: "present", person: "3rd", number: "singular", pada: "parasmaipada" },
  "पश्यामि": { meaning: "I see", iast: "paśyāmi", root: "दृश्", root_iast: "dṛś", tense: "present", person: "1st", number: "singular", pada: "parasmaipada" },
  "पश्यसि": { meaning: "you see", iast: "paśyasi", root: "दृश्", root_iast: "dṛś", tense: "present", person: "2nd", number: "singular", pada: "parasmaipada" },
  "पश्यति": { meaning: "he/she/it sees", iast: "paśyati", root: "दृश्", root_iast: "dṛś", tense: "present", person: "3rd", number: "singular", pada: "parasmaipada" },
  "पश्यन्ति": { meaning: "they see", iast: "paśyanti", root: "दृश्", root_iast: "dṛś", tense: "present", person: "3rd", number: "plural", pada: "parasmaipada" },
  "शृणोमि": { meaning: "I hear", iast: "śṛṇomi", root: "श्रु", root_iast: "śru", tense: "present", person: "1st", number: "singular", pada: "parasmaipada" },
  "शृणोति": { meaning: "he/she/it hears", iast: "śṛṇoti", root: "श्रु", root_iast: "śru", tense: "present", person: "3rd", number: "singular", pada: "parasmaipada" },
  "करोमि": { meaning: "I do / make", iast: "karomi", root: "कृ", root_iast: "kṛ", tense: "present", person: "1st", number: "singular", pada: "parasmaipada" },
  "करोषि": { meaning: "you do", iast: "karoṣi", root: "कृ", root_iast: "kṛ", tense: "present", person: "2nd", number: "singular", pada: "parasmaipada" },
  "करोति": { meaning: "he/she/it does", iast: "karoti", root: "कृ", root_iast: "kṛ", tense: "present", person: "3rd", number: "singular", pada: "parasmaipada" },
  "कुर्वन्ति": { meaning: "they do", iast: "kurvanti", root: "कृ", root_iast: "kṛ", tense: "present", person: "3rd", number: "plural", pada: "parasmaipada" },
  "वदामि": { meaning: "I speak / say", iast: "vadāmi", root: "वद्", root_iast: "vad", tense: "present", person: "1st", number: "singular", pada: "parasmaipada" },
  "वदति": { meaning: "he/she/it speaks", iast: "vadati", root: "वद्", root_iast: "vad", tense: "present", person: "3rd", number: "singular", pada: "parasmaipada" },
  "तिष्ठामि": { meaning: "I stand / stay", iast: "tiṣṭhāmi", root: "स्था", root_iast: "sthā", tense: "present", person: "1st", number: "singular", pada: "parasmaipada" },
  "तिष्ठति": { meaning: "he/she/it stands", iast: "tiṣṭhati", root: "स्था", root_iast: "sthā", tense: "present", person: "3rd", number: "singular", pada: "parasmaipada" },
  "गच्छ": { meaning: "go! (imperative sg)", iast: "gaccha", root: "गम्", root_iast: "gam", tense: "imperative", person: "2nd", number: "singular", pada: "parasmaipada" },
  "गच्छत": { meaning: "go! (imperative pl)", iast: "gacchata", root: "गम्", root_iast: "gam", tense: "imperative", person: "2nd", number: "plural", pada: "parasmaipada" },
  "अगच्छम्": { meaning: "I went (imperfect)", iast: "agaccham", root: "गम्", root_iast: "gam", tense: "imperfect", person: "1st", number: "singular", pada: "parasmaipada" },
  "अगच्छत्": { meaning: "he/she/it went (imperfect)", iast: "agacchat", root: "गम्", root_iast: "gam", tense: "imperfect", person: "3rd", number: "singular", pada: "parasmaipada" },
  "अस्ति": { meaning: "there is / he/she/it is", iast: "asti", root: "अस्", root_iast: "as", tense: "present", person: "3rd", number: "singular", pada: "parasmaipada" },
  "सन्ति": { meaning: "they are", iast: "santi", root: "अस्", root_iast: "as", tense: "present", person: "3rd", number: "plural", pada: "parasmaipada" },
  "अस्मि": { meaning: "I am", iast: "asmi", root: "अस्", root_iast: "as", tense: "present", person: "1st", number: "singular", pada: "parasmaipada" },
  "असि": { meaning: "you are (sg)", iast: "asi", root: "अस्", root_iast: "as", tense: "present", person: "2nd", number: "singular", pada: "parasmaipada" },
  "स्मः": { meaning: "we are", iast: "smaḥ", root: "अस्", root_iast: "as", tense: "present", person: "1st", number: "plural", pada: "parasmaipada" },
  "स्थ": { meaning: "you (pl) are", iast: "stha", root: "अस्", root_iast: "as", tense: "present", person: "2nd", number: "plural", pada: "parasmaipada" },
};

const POSTPOSITIONS: Record<string, { meaning: string }> = {
  "उपरि": { meaning: "above / on top of" },
  "अधः": { meaning: "below / under" },
  "पुरतः": { meaning: "in front of" },
  "पश्चात्": { meaning: "behind / after" },
  "समीपे": { meaning: "near" },
  "अन्तः": { meaning: "inside" },
  "बहिः": { meaning: "outside" },
  "अभितः": { meaning: "around / on both sides" },
  "सह": { meaning: "with" },
  "विना": { meaning: "without" },
  "प्रति": { meaning: "towards / per" },
  "उद्दिश्य": { meaning: "regarding / about" },
};

const SANDHI_RULES: { name: string; description: string; example: string }[] = [
  { name: "a + a → ā", description: "अ + अ = आ (similar vowels merge into long)", example: "राम + अर्थ → रामार्थ" },
  { name: "a + i → e", description: "अ + इ = ए (vowel combination)", example: "राम + इच्छा → रामेच्छा" },
  { name: "a + u → o", description: "अ + उ = ओ", example: "राम + उक्त → रामोक्त" },
  { name: "a + e → ai", description: "अ + ए = ऐ", example: "राम + एक → रामैक" },
  { name: "a + o → au", description: "अ + ओ = औ", example: "राम + ओजस् → रामौजस्" },
  { name: "visarga → s", description: "visarga before a hard consonant becomes s", example: "रामः + च → रामश्च" },
  { name: "visarga → r", description: "visarga before a vowel becomes r", example: "रामः + आगच्छति → राम आगच्छति" },
  { name: "visarga drops", description: "visarga drops before a soft consonant", example: "गुरुः + याति → गुरुर्याति" },
];

const EXERCISES: { question: string; options: string[]; answer: number; explanation: string }[] = [
  { question: "What case is 'रामम्' in?", options: ["Nominative", "Accusative", "Genitive", "Locative"], answer: 1, explanation: "'रामम्' is the accusative singular form of 'राम', used for the direct object." },
  { question: "What does 'गच्छति' mean?", options: ["I go", "You go", "He/she/it goes", "They go"], answer: 2, explanation: "'गच्छति' is 3rd person singular present tense of √गम् (to go)." },
  { question: "What is the root of 'पठति'?", options: ["पठ्", "पाठ्", "पठति", "पाठति"], answer: 0, explanation: "The root (धातु) is 'पठ्' meaning 'to read/study'." },
  { question: "'रामः फलम् खादति' — who is eating?", options: ["The fruit", "Rama", "The forest", "The book"], answer: 1, explanation: "रामः is the subject (nominative), so Rama is eating the fruit." },
  { question: "What does 'अहम्' mean?", options: ["You", "He", "I", "We"], answer: 2, explanation: "'अहम्' is the first person singular pronoun meaning 'I'." },
  { question: "Which number is 'गच्छावः'?", options: ["Singular", "Dual", "Plural", "None"], answer: 1, explanation: "The ending '-आवः' indicates first person dual — 'we two go'." },
  { question: "What sandhi is 'रामेच्छा' from?", options: ["a + i → e", "a + u → o", "a + a → ā", "visarga → s"], answer: 0, explanation: "राम (a) + इच्छा (i) → रामेच्छा (e), this is a + i → e sandhi." },
  { question: "'त्वम्' refers to what person?", options: ["1st person", "2nd person", "3rd person", "It is not a person"], answer: 1, explanation: "'त्वम्' is the 2nd person singular pronoun, meaning 'you'." },
];

const GREETINGS: { pattern: RegExp; response: string }[] = [
  { pattern: /^(नमस्ते|नमस्कार|hello|hi|hey)/i, response: "नमस्ते! I am your Sanskrit tutor. You can ask me about word meanings, grammar, verb conjugations, or sentence structure." },
  { pattern: /^(धन्यवाद|thanks|thank you)/i, response: "You're welcome! Feel free to ask more questions about Sanskrit." },
];

function analyzeWord(word: string): { found: boolean; info: string } {
  const w = word.replace(/[।॥,\.\?\!]/g, "");
  if (VERBS[w]) {
    const v = VERBS[w];
    return { found: true, info: `"${w}" (${v.iast}) — ${v.meaning}\nRoot: √${v.root} (${v.root_iast})\nTense: ${v.tense}, Person: ${v.person}, Number: ${v.number}\nPadapatha: ${v.pada}` };
  }
  if (DICT[w]) {
    const d = DICT[w];
    let m = `"${w}" (${d.iast}) — ${d.meaning}\nPart of speech: ${d.pos}`;
    if (d.info) m += `\nGrammatical info: ${d.info}`;
    return { found: true, info: m };
  }
  return { found: false, info: "" };
}

function tibuildReply(message: string, language: string, difficulty: string): { reply: string; citations: string[]; difficulty: string; suggested_exercise: { question: string; options: string[]; answer: number; explanation: string } | null; mode: string } {
  const lang = language || "sa";
  const diff = difficulty || "beginner";
  const msg = message.trim();

  for (const g of GREETINGS) {
    if (g.pattern.test(msg)) {
      return { reply: g.response, citations: [], difficulty: diff, suggested_exercise: null, mode: "tutor" };
    }
  }

  // Identify known words in the message
  const words = msg.split(/[\s]+/);
  const foundVerbs: string[] = [];
  const foundNouns: string[] = [];
  const unknownWords: string[] = [];

  for (const word of words) {
    const clean = word.replace(/[।॥,\.\?\!]/g, "");
    if (!clean) continue;
    if (VERBS[clean]) {
      foundVerbs.push(clean);
    } else if (DICT[clean]) {
      foundNouns.push(clean);
    } else {
      unknownWords.push(clean);
    }
  }

  // Whole-sentence analysis
  const sentencePattern = /^([\u0900-\u097F]+)\s+([\u0900-\u097F]+)\s+([\u0900-\u097F]+)$/;
  const sentenceMatch = msg.match(sentencePattern);

  if (sentenceMatch && foundVerbs.length > 0) {
    // Sentence with subject + object + verb
    const parts: string[] = [];
    for (const w of words) {
      const clean = w.replace(/[।॥,\.\?\!]/g, "");
      if (!clean) continue;
      const analysis = analyzeWord(clean);
      if (analysis.found) parts.push(analysis.info);
    }
    return {
      reply: `I found a Sanskrit sentence! Here's my analysis:\n\n${parts.join("\n\n")}\n\n📖 Word order: Sanskrit typically follows Subject-Object-Verb (SOV). The verb agrees with the subject in person and number. Would you like me to explain any specific grammar point?`,
      citations: [],
      difficulty: diff,
      suggested_exercise: diff === "beginner" ? EXERCISES[Math.floor(Math.random() * 3)] : null,
      mode: "tutor"
    };
  }

  if (foundVerbs.length > 0) {
    let reply = "🔍 Verb Analysis:\n\n";
    for (const vw of foundVerbs) {
      const a = analyzeWord(vw);
      reply += a.info + "\n\n";
    }
    if (foundNouns.length > 0) {
      reply += "📖 Related nouns in the sentence:\n\n";
      for (const nw of foundNouns) {
        const a = analyzeWord(nw);
        reply += a.info + "\n\n";
      }
    }
    if (diff === "advanced" && foundVerbs.length >= 2) {
      reply += "💡 Tip: When multiple verbs appear, check if they share the same subject or if it's a complex sentence with conjunctions like 'च' (and).";
    }
    return { reply, citations: [], difficulty: diff, suggested_exercise: diff !== "advanced" ? EXERCISES[Math.min(foundVerbs.length, EXERCISES.length - 1)] : null, mode: "tutor" };
  }

  if (foundNouns.length > 0) {
    let reply = "📖 Word Analysis:\n\n";
    for (const nw of foundNouns) {
      const a = analyzeWord(nw);
      reply += a.info + "\n\n";
    }
    if (unknownWords.length > 0) {
      reply += `⚠️ Words I couldn't find: ${unknownWords.join(", ")}\n\nSanskrit dictionaries grow as I learn! You can add new words to the corpus.`;
    }
    return { reply, citations: [], difficulty: diff, suggested_exercise: diff === "beginner" ? EXERCISES[Math.floor(Math.random() * 4)] : null, mode: "tutor" };
  }

  // Specific questions
  const sandhiQ = msg.match(/(sandhi|सन्धि|सन्ध)/i);
  if (sandhiQ) {
    let reply = "🔤 Sandhi (Euphonic Combination) Rules:\n\n";
    for (const r of SANDHI_RULES) {
      reply += `• ${r.name}: ${r.description}\n Example: ${r.example}\n\n`;
    }
    reply += "Sandhi rules apply at word boundaries in continuous speech and writing.";
    return { reply, citations: [], difficulty: "intermediate", suggested_exercise: EXERCISES[6], mode: "tutor" };
  }

  const caseQ = msg.match(/(case|vibhakti|विभक्ति|कारक)/i);
  if (caseQ) {
    return {
      reply: "📚 Sanskrit has 8 cases (विभक्तयः):\n\n1. Nominative (कर्ता) — subject\n2. Accusative (कर्म) — direct object\n3. Instrumental (करण) — by/with\n4. Dative (सम्प्रदान) — to/for\n5. Ablative (अपादान) — from\n6. Genitive (सम्बन्ध) — of\n7. Locative (अधिकरण) — in/on/at\n8. Vocative (सम्बोधन) — address\n\nExample with राम:\nरामः (nom), रामम् (acc), रामेण (instr), रामाय (dat), रामात् (abl), रामस्य (gen), रामे (loc), हे राम (voc)",
      citations: [],
      difficulty: "beginner",
      suggested_exercise: EXERCISES[0],
      mode: "tutor"
    };
  }

  if (unknownWords.length === words.length) {
    let reply = `I don't recognize those words yet. Here are some things I can help with:\n\n`;
    reply += "• Look up a Sanskrit word's meaning and grammar\n";
    reply += "• Analyze verb conjugations (e.g., 'गच्छति')\n";
    reply += "• Identify noun cases (e.g., 'रामस्य' — genitive)\n";
    reply += "• Explain sandhi rules\n";
    reply += "• Explain vibhakti (case system)\n";
    reply += "• Quiz you with exercises\n\n";
    reply += "Try typing a word like 'रामः' or 'गच्छति'!";
    return { reply, citations: [], difficulty: diff, suggested_exercise: EXERCISES[Math.floor(Math.random() * EXERCISES.length)], mode: "tutor" };
  }

  return { reply: `I found ${foundNouns.length + foundVerbs.length} known words. Type a Sanskrit word or sentence for analysis.`, citations: [], difficulty: diff, suggested_exercise: null, mode: "tutor" };
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/[^\/]+\/?/, "");
  const method = req.method;
  const params = Object.fromEntries(url.searchParams);

  try {
    if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

    if (path === "health" && method === "GET") return json({ status: "healthy", timestamp: new Date().toISOString(), checks: { database: "ok", ai_service: OPENROUTER_API_KEY || GITHUB_TOKEN ? "ok" : "not configured", providers: { openrouter: OPENROUTER_API_KEY ? "ok" : "not configured", github_models: GITHUB_TOKEN ? "ok" : "not configured" } }, uptime_seconds: 0 });

    if (path === "setup/demo" && method === "POST") {
      const { data: ex } = await supabase.from("profiles").select("id").eq("username", "demo").maybeSingle();
      if (ex) return json({ message: "Demo user already exists" });
      const { data: u, error: ue } = await supabase.auth.admin.createUser({ email: "demo@sansi.app", password: "demo123", email_confirm: true, user_metadata: { username: "demo", display_name: "Demo User" } });
      if (ue || !u.user) return err(ue?.message || "Failed");
      await supabase.from("profiles").upsert({ id: u.user.id, username: "demo", display_name: "Demo User", role: "student" });
      return json({ message: "Demo user created", id: u.user.id }, 201);
    }

    if (path.startsWith("auth/")) {
      const sp = path.replace("auth/", "");
      if (sp === "register" && method === "POST") {
        const { email, password, username, display_name } = await parseBody(req);
        const { data: u, error: ue } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username, display_name: display_name || username } });
        if (ue || !u.user) return err(ue?.message || "Failed", 400);
        await supabase.from("profiles").upsert({ id: u.user.id, username: username || email.split("@")[0], display_name: display_name || username || email.split("@")[0], role: "student" });
        const { data: si } = await supabase.auth.signInWithPassword({ email, password });
        if (si?.session) return json({ access_token: si.session.access_token, token_type: "bearer", user: { id: u.user.id, email: u.user.email, username: username || email.split("@")[0], display_name: display_name || username || "", role: "student" } }, 201);
        return json({ user: { id: u.user.id, email: u.user.email, username: username || email.split("@")[0], display_name: display_name || username || "", role: "student" } }, 201);
      }
      if (sp === "login" && method === "POST") {
        const { email, password } = await parseBody(req);
        const { data, error: ie } = await supabase.auth.signInWithPassword({ email, password });
        if (ie || !data.session) return err("Invalid credentials", 401);
        const { data: pr } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
        return json({ access_token: data.session.access_token, token_type: "bearer", user: { id: data.user.id, email: data.user.email, username: pr?.username || email.split("@")[0], display_name: pr?.display_name || "", role: pr?.role || "student", bio: pr?.bio || "", avatar_url: pr?.avatar_url || "", is_tutor: pr?.is_tutor || false, is_mentor: pr?.is_mentor || false, score_points: pr?.score_points || 0 } });
      }
      if (sp === "me" && method === "GET") {
        const uid = await requireUser(req);
        const pr = await getUser(uid);
        return json({ id: uid, username: pr?.username || "", display_name: pr?.display_name || "", role: pr?.role || "student", bio: pr?.bio || "", avatar_url: pr?.avatar_url || "", is_tutor: pr?.is_tutor || false, is_mentor: pr?.is_mentor || false, score_points: pr?.score_points || 0, created_at: pr?.created_at || "" });
      }
    }

    if (path === "corpus" || path.startsWith("corpus/")) {
      const sp = path.replace(/^corpus\/?/, "");
      if (sp === "" && method === "GET") {
        let q = supabase.from("corpus_texts").select("*", { count: "exact" });
        if (params.language) q = q.eq("language", params.language);
        if (params.search) q = q.or("title.ilike.%" + params.search + "%,content.ilike.%" + params.search + "%");
        const page = parseInt(params.page || "1"), size = parseInt(params.size || "20");
        const { data, count } = await q.range((page - 1) * size, page * size - 1).order("created_at", { ascending: false });
        return json({ items: data || [], total: count || 0, page, size });
      }
      if (sp === "" && method === "POST") {
        await requireRole(req, "contributor");
        const body = await parseBody(req);
        const uid = await requireUser(req);
        const { data, error: ce } = await supabase.from("corpus_texts").insert({ ...body, uploaded_by: uid }).select().single();
        if (ce || !data) return err(ce?.message || "Failed");
        return json(data, 201);
      }
      const tid = sp.match(/^([^\/]+)$/);
      if (tid && method === "GET") {
        const { data } = await supabase.from("corpus_texts").select("*").eq("id", tid[1]).single();
        if (!data) return err("Not found", 404);
        return json(data);
      }
      const ann = sp.match(/^([^\/]+)\/annotations(?:\/([^\/]+))?$/);
      if (ann) {
        const [_, t, a] = ann;
        if (!a && method === "GET") {
          let q = supabase.from("annotations").select("*").eq("text_id", t);
          if (params.annotation_type) q = q.eq("layer", params.annotation_type);
          const { data } = await q.order("created_at");
          return json(data || []);
        }
        if (!a && method === "POST") {
          await requireRole(req, "contributor");
          const body = await parseBody(req);
          const uid = await requireUser(req);
          const { data, error: ae } = await supabase.from("annotations").insert({ ...body, text_id: t, user_id: uid }).select().single();
          if (ae || !data) return err(ae?.message || "Failed");
          const { error: se } = await supabase.rpc("increment_user_score", { uid, points: 5 }).maybeSingle();
          return json(data, 201);
        }
        if (a === "upvote" && method === "POST") {
          const { error: ue } = await supabase.rpc("increment_annotation_upvotes", { ann_id: t });
          if (ue) return err(ue.message);
          return json({ upvotes: 1 });
        }
      }
      const annd = sp.match(/^([^\/]+)\/annotations\/([^\/]+)$/);
      if (annd && method === "DELETE") {
        await requireRole(req, "moderator");
        const { error: de } = await supabase.from("annotations").delete().eq("id", annd[2]).eq("text_id", annd[1]);
        if (de) return err(de.message);
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }
    }

    if (path === "courses" || path.startsWith("courses/")) {
      const sp = path.replace(/^courses\/?/, "");
      if (sp === "" && method === "GET") {
        let q = supabase.from("courses").select("*");
        if (params.language) q = q.eq("language", params.language);
        if (params.level) q = q.eq("level", params.level);
        const { data } = await q.order("created_at", { ascending: false });
        return json(data || []);
      }
      if (sp === "" && method === "POST") {
        await requireRole(req, "contributor");
        const body = await parseBody(req);
        const uid = await requireUser(req);
        const { data, error: ce } = await supabase.from("courses").insert({ ...body, created_by: uid }).select().single();
        if (ce || !data) return err(ce?.message || "Failed");
        return json(data, 201);
      }
      const cid = sp.match(/^([^\/]+)$/);
      if (cid && method === "GET") {
        const { data } = await supabase.from("courses").select("*").eq("id", cid[1]).single();
        if (!data) return err("Not found", 404);
        return json(data);
      }
      const lsn = sp.match(/^([^\/]+)\/lessons$/);
      if (lsn && method === "GET") {
        const { data } = await supabase.from("lessons").select("*").eq("course_id", lsn[1]).order("order").order("created_at");
        return json(data || []);
      }
      if (sp === "lessons" && method === "POST") {
        await requireRole(req, "contributor");
        const body = await parseBody(req);
        const { data, error: le } = await supabase.from("lessons").insert(body).select().single();
        if (le || !data) return err(le?.message || "Failed");
        return json(data, 201);
      }
      const ver = sp.match(/^([^\/]+)\/versions$/);
      if (ver && method === "POST") {
        await requireRole(req, "contributor");
        const { data, error: ve } = await supabase.from("course_versions").insert({ course_id: ver[1] }).select().single();
        if (ve || !data) return err(ve?.message || "Failed");
        return json({ version: data.version, id: data.id }, 201);
      }
    }

    if (path.startsWith("learning/")) {
      const sp = path.replace("learning/", "");
      const fks = sp.match(/^lessons\/([^\/]+)\/forks$/);
      if (fks && method === "GET") {
        const { data } = await supabase.from("lesson_forks").select("*").eq("original_lesson_id", fks[1]).order("created_at");
        return json(data || []);
      }
      const fk = sp.match(/^lessons\/([^\/]+)\/fork$/);
      if (fk && method === "POST") {
        await requireRole(req, "contributor");
        const body = await parseBody(req);
        const uid = await requireUser(req);
        const { data: orig } = await supabase.from("lessons").select("*").eq("id", fk[1]).single();
        if (!orig) return err("Lesson not found", 404);
        const { data, error: fe } = await supabase.from("lesson_forks").insert({ original_lesson_id: fk[1], forked_by: uid, title: body.title || orig.title, content: body.content || orig.content, version: 1 }).select().single();
        if (fe || !data) return err(fe?.message || "Failed");
        return json(data, 201);
      }
      const fc = sp.match(/^courses\/([^\/]+)\/flashcards$/);
      if (fc && method === "GET") {
        const { data } = await supabase.from("flashcards").select("*").eq("course_id", fc[1]).order("created_at");
        return json(data || []);
      }
      if (sp === "flashcards" && method === "POST") {
        await requireRole(req, "contributor");
        const body = await parseBody(req);
        const uid = await requireUser(req);
        const { data, error: fe } = await supabase.from("flashcards").insert({ ...body, created_by: uid }).select().single();
        if (fe || !data) return err(fe?.message || "Failed");
        return json(data, 201);
      }
      if (sp === "tests" && method === "POST") {
        await requireRole(req, "contributor");
        const body = await parseBody(req);
        const uid = await requireUser(req);
        const { data, error: te } = await supabase.from("practice_tests").insert({ ...body, created_by: uid }).select().single();
        if (te || !data) return err(te?.message || "Failed");
        return json(data, 201);
      }
      const tid = sp.match(/^tests\/([^\/]+)$/);
      if (tid && method === "GET") {
        const { data } = await supabase.from("practice_tests").select("*").eq("id", tid[1]).single();
        if (!data) return err("Not found", 404);
        return json(data);
      }
      const ta = sp.match(/^tests\/([^\/]+)\/attempt$/);
      if (ta && method === "POST") {
        const uid = await requireUser(req);
        const { answers } = await parseBody(req);
        const { data: test } = await supabase.from("practice_tests").select("*").eq("id", ta[1]).single();
        if (!test) return err("Test not found", 404);
        const qs = typeof test.questions === "string" ? JSON.parse(test.questions) : test.questions;
        let correct = 0;
        for (const q of qs) { if (answers[q.id] === q.answer) correct++; }
        const score = Math.round((correct / qs.length) * 100);
        const passed = score >= (test.passing_score || 60);
        const { data, error: ae } = await supabase.from("test_attempts").insert({ test_id: ta[1], user_id: uid, score, passed, answers: JSON.stringify(answers) }).select().single();
        if (ae || !data) return err(ae?.message || "Failed");
        await supabase.rpc("increment_user_score", { uid, points: 20 }).maybeSingle();
        return json({ id: data.id, test_id: ta[1], user_id: uid, score, passed, completed_at: data.completed_at }, 201);
      }
    }

    if (path.startsWith("community/")) {
      const sp = path.replace("community/", "");
      if (sp === "posts" && method === "GET") {
        let q = supabase.from("community_posts").select("*", { count: "exact" });
        if (params.post_type) q = q.eq("post_type", params.post_type);
        const page = parseInt(params.page || "1"), size = parseInt(params.size || "20");
        const { data, count } = await q.range((page - 1) * size, page * size - 1).order("votes", { ascending: false });
        return json({ items: data || [], total: count || 0, page, size });
      }
      if (sp === "posts" && method === "POST") {
        await requireRole(req, "contributor");
        const body = await parseBody(req);
        const uid = await requireUser(req);
        const { data, error: pe } = await supabase.from("community_posts").insert({ ...body, author_id: uid }).select().single();
        if (pe || !data) return err(pe?.message || "Failed");
        await supabase.rpc("increment_user_score", { uid, points: 10 }).maybeSingle();
        return json(data, 201);
      }
      const pv = sp.match(/^posts\/([^\/]+)\/vote$/);
      if (pv && method === "POST") {
        await requireUser(req);
        const delta = parseInt(params.delta || "1");
        const { data: post } = await supabase.from("community_posts").select("votes").eq("id", pv[1]).single();
        if (!post) return err("Not found", 404);
        const nv = (post.votes || 0) + (delta > 0 ? 1 : -1);
        await supabase.from("community_posts").update({ votes: Math.max(0, nv) }).eq("id", pv[1]);
        return json({ votes: Math.max(0, nv) });
      }
      if (sp === "comments" && method === "POST") {
        await requireRole(req, "contributor");
        const body = await parseBody(req);
        const uid = await requireUser(req);
        const { data, error: ce } = await supabase.from("comments").insert({ ...body, author_id: uid }).select().single();
        if (ce || !data) return err(ce?.message || "Failed");
        await supabase.rpc("increment_user_score", { uid, points: 5 }).maybeSingle();
        return json(data, 201);
      }
      const cm = sp.match(/^comments\/([^\/]+)\/([^\/]+)$/);
      if (cm && method === "GET") {
        const { data } = await supabase.from("comments").select("*").eq("parent_type", cm[1]).eq("parent_id", cm[2]).order("created_at");
        return json(data || []);
      }
      if (sp === "mentors" && method === "GET") {
        let q = supabase.from("mentors").select("*,profiles!inner(username,display_name,avatar_url)");
        if (params.language) q = q.contains("languages", [params.language]);
        if (params.specialization) q = q.contains("specializations", [params.specialization]);
        const { data } = await q.order("rating", { ascending: false });
        return json((data || []).map((m: any) => ({ id: m.id, user_id: m.user_id, username: m.profiles?.username, display_name: m.profiles?.display_name, headline: m.headline, bio: m.bio, languages: m.languages, specializations: m.specializations, total_sessions: m.total_sessions, rating: m.rating, thanks_count: m.thanks_count, badge: m.badge })));
      }
      if (sp === "mentors/register" && method === "POST") {
        await requireRole(req, "contributor");
        const uid = await requireUser(req);
        const { data, error: me } = await supabase.from("mentors").upsert({ user_id: uid, headline: params.headline || "", bio: params.bio || "", languages: params.languages ? params.languages.split(",") : [], specializations: params.specializations ? params.specializations.split(",") : [] }).select().single();
        if (me) return err(me.message);
        await supabase.from("profiles").update({ is_mentor: true }).eq("id", uid);
        return json({ registered: true, mentor_id: data?.id }, 201);
      }
      if (sp === "sessions" && method === "GET") {
        const uid = await requireUser(req);
        const { data } = await supabase.from("mentorship_sessions").select("*").or("learner_id.eq." + uid + ",mentor_id.eq." + uid).order("created_at", { ascending: false });
        if (params.status) return json((data || []).filter((s: any) => s.status === params.status));
        return json(data || []);
      }
      if (sp === "sessions" && method === "POST") {
        const uid = await requireUser(req);
        const { data, error: se } = await supabase.from("mentorship_sessions").insert({ learner_id: uid, mentor_id: params.mentor_id, session_type: params.session_type || "chat", scheduled_at: params.scheduled_at, duration_minutes: parseInt(params.duration_minutes || "30") }).select().single();
        if (se || !data) return err(se?.message || "Failed");
        return json({ session_id: data.id, status: data.status }, 201);
      }
      if (sp === "thanks" && method === "POST") {
        const uid = await requireUser(req);
        const { data, error: te } = await supabase.from("thanks").insert({ giver_id: uid, session_id: params.session_id, mentor_id: params.mentor_id, rating: parseFloat(params.rating || "5"), message: params.message || "" }).select().single();
        if (te || !data) return err(te?.message || "Failed");
        return json({ thanks: true, rating: data.rating }, 201);
      }
      if (sp === "streaks" && method === "GET") {
        const uid = await requireUser(req);
        const { data } = await supabase.from("streaks").select("*").eq("user_id", uid).single();
        return json(data || { current_streak: 0, longest_streak: 0, streak_freeze: false, last_activity: null });
      }
      if (sp === "streaks/tick" && method === "POST") {
        const uid = await requireUser(req);
        const { data: ex } = await supabase.from("streaks").select("*").eq("user_id", uid).single();
        const today = new Date().toISOString().split("T")[0];
        if (ex) {
          const last = ex.last_activity?.split("T")[0];
          if (last !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
            const streak = last === yesterday ? (ex.current_streak || 0) + 1 : 1;
            await supabase.from("streaks").update({ current_streak: streak, longest_streak: Math.max(streak, ex.longest_streak || 0), last_activity: new Date().toISOString() }).eq("user_id", uid);
            return json({ current_streak: streak });
          }
          return json({ current_streak: ex.current_streak });
        }
        await supabase.from("streaks").insert({ user_id: uid, current_streak: 1, longest_streak: 1, last_activity: new Date().toISOString() });
        return json({ current_streak: 1 });
      }
      if (sp === "mentor-requests" && method === "GET") {
        const uid = await requireUser(req);
        const { data } = await supabase.from("mentor_requests").select("*").or("learner_id.eq." + uid + ",mentor_id.eq." + uid).order("created_at", { ascending: false });
        if (params.status) return json((data || []).filter((r: any) => r.status === params.status));
        return json(data || []);
      }
      if (sp === "mentor-requests" && method === "POST") {
        const uid = await requireUser(req);
        const { data, error: re } = await supabase.from("mentor_requests").insert({ learner_id: uid, mentor_id: params.mentor_id, question: params.question, context: params.context || "" }).select().single();
        if (re || !data) return err(re?.message || "Failed");
        return json({ request_id: data.id, status: data.status }, 201);
      }
      if (sp === "reports" && method === "GET") {
        await requireRole(req, "moderator");
        let q = supabase.from("reports").select("*");
        if (params.status) q = q.eq("status", params.status);
        const { data } = await q.order("created_at", { ascending: false });
        return json(data || []);
      }
      if (sp === "reports" && method === "POST") {
        const uid = await requireUser(req);
        const { data, error: re } = await supabase.from("reports").insert({ reporter_id: uid, target_type: params.target_type, target_id: params.target_id, reason: params.reason }).select().single();
        if (re || !data) return err(re?.message || "Failed");
        return json({ report_id: data.id, status: data.status }, 201);
      }
      const rv = sp.match(/^reports\/([^\/]+)\/review$/);
      if (rv && method === "PATCH") {
        await requireRole(req, "moderator");
        const { data, error: ue } = await supabase.from("reports").update({ status: params.action || "resolved" }).eq("id", rv[1]).select().single();
        if (ue) return err(ue.message);
        return json({ status: data?.status || params.action });
      }
      if (sp === "badge-rules" && method === "GET") {
        const { data } = await supabase.from("badge_rules").select("*").order("name");
        return json(data || []);
      }
      if (sp === "badge-rules" && method === "POST") {
        await requireRole(req, "admin");
        const { data, error: be } = await supabase.from("badge_rules").insert({ name: params.name, description: params.description, icon: params.icon || "award", category: params.category || "general", condition_type: params.condition_type || "points", condition_threshold: parseInt(params.condition_threshold || "100"), is_auto: true }).select().single();
        if (be || !data) return err(be?.message || "Failed");
        return json(data, 201);
      }
      if (sp === "badges/check-auto" && method === "POST") {
        const uid = await requireUser(req);
        const { data: rules } = await supabase.from("badge_rules").select("*").eq("is_auto", true);
        const { data: scores } = await supabase.from("user_scores").select("*").eq("user_id", uid).single();
        const { data: existing } = await supabase.from("user_badges").select("name").eq("user_id", uid);
        const awarded: string[] = [];
        const existingNames = new Set((existing || []).map((b: any) => b.name));
        for (const rule of (rules || [])) {
          if (existingNames.has(rule.name)) continue;
          let earned = false;
          if (rule.condition_type === "points") earned = (scores?.total_points || 0) >= rule.condition_threshold;
          if (rule.condition_type === "uploads") earned = (scores?.texts_uploaded || 0) >= rule.condition_threshold;
          if (rule.condition_type === "annotations") earned = (scores?.annotations_made || 0) >= rule.condition_threshold;
          if (earned) {
            await supabase.from("user_badges").insert({ user_id: uid, name: rule.name, description: rule.description, icon: rule.icon || "award" });
            awarded.push(rule.name);
          }
        }
        return json({ awarded });
      }
      if (sp === "challenges" && method === "GET") {
        let q = supabase.from("challenges").select("*");
        if (params.active_only === "true") q = q.eq("is_active", true);
        if (params.seasonal === "true") q = q.eq("is_seasonal", true);
        const { data } = await q.order("created_at", { ascending: false });
        return json(data || []);
      }
      if (sp === "challenges" && method === "POST") {
        await requireRole(req, "admin");
        const body = await parseBody(req);
        const { data, error: ce } = await supabase.from("challenges").insert(body).select().single();
        if (ce || !data) return err(ce?.message || "Failed");
        return json(data, 201);
      }
      const cj = sp.match(/^challenges\/([^\/]+)\/join$/);
      if (cj && method === "POST") {
        const uid = await requireUser(req);
        const { data: ex } = await supabase.from("challenge_participants").select("id").eq("challenge_id", cj[1]).eq("user_id", uid).maybeSingle();
        if (ex) return json({ joined: true });
        const { error: je } = await supabase.from("challenge_participants").insert({ challenge_id: cj[1], user_id: uid, progress: 0 });
        if (je) return err(je.message);
        return json({ joined: true });
      }
      const cp = sp.match(/^challenges\/([^\/]+)\/progress$/);
      if (cp && method === "POST") {
        const uid = await requireUser(req);
        const delta = parseInt(params.delta || "1");
        const { data: p } = await supabase.from("challenge_participants").select("*").eq("challenge_id", cp[1]).eq("user_id", uid).single();
        if (!p) return err("Not joined", 404);
        const { data: ch } = await supabase.from("challenges").select("*").eq("id", cp[1]).single();
        const newProgress = Math.min((p.progress || 0) + delta, ch?.goal || 100);
        await supabase.from("challenge_participants").update({ progress: newProgress }).eq("id", p.id);
        if (newProgress >= (ch?.goal || 100) && (p.progress || 0) < (ch?.goal || 100)) {
          await supabase.rpc("increment_user_score", { uid, points: ch?.points_reward || 0 }).maybeSingle();
          if (ch?.badge_reward) {
            await supabase.from("user_badges").upsert({ user_id: uid, name: ch.badge_reward, description: "Completed challenge: " + ch.title, icon: "award" }).maybeSingle();
          }
        }
        return json({ progress: newProgress, goal: ch?.goal || 100, completed: newProgress >= (ch?.goal || 100) });
      }
      if (sp === "events" && method === "GET") {
        let q = supabase.from("events").select("*");
        if (params.active_only === "true") q = q.eq("is_active", true);
        const { data } = await q.order("starts_at", { ascending: true });
        return json(data || []);
      }
    }

    if (path === "tutor" || path.startsWith("tutor/")) {
      const sp = path.replace(/^tutor\/?/, "");
      if (sp === "chat" && method === "POST") {
        const body = await parseBody(req);
        if (!OPENROUTER_API_KEY && !GITHUB_TOKEN) return err("AI service not configured", 503);
        const lang = body.language || "sa";
        const diff = body.difficulty || "beginner";
        const system = `You are a ${lang} language tutor. Answer concisely for a ${diff} learner. Return valid JSON only: {"reply":"...","difficulty":"...","suggested_exercise":null}`;
        try {
          const txt = await callAI([{ role: "system", content: system }, { role: "user", content: body.message || "" }], 0.7, body.provider);
          try { const j = JSON.parse(txt.replace(/```json\s*|```\s*/g, "").trim()); return json({ reply: j.reply || txt, citations: [], difficulty: j.difficulty || diff, suggested_exercise: j.suggested_exercise || null, mode: "tutor", provider: body.provider || (OPENROUTER_API_KEY ? "openrouter" : "github") }); }
          catch { return json({ reply: txt, citations: [], difficulty: diff, suggested_exercise: null, mode: "tutor", provider: body.provider || (OPENROUTER_API_KEY ? "openrouter" : "github") }); }
        } catch (e) { return err(e instanceof Error ? e.message : "AI service error", 502); }
      }
      if (sp === "translate" && method === "POST") {
        const body = await parseBody(req);
        if (!OPENROUTER_API_KEY && !GITHUB_TOKEN) return err("AI service not configured", 503);
        const src = body.source || params.source || "sa";
        const tgt = body.target || params.target || "en";
        const prompt = `Translate this ${src} text to ${tgt}. Return ONLY valid JSON: {"translated_text":"...","word_count":N}`;
        try {
          const txt = await callAI([{ role: "system", content: prompt }, { role: "user", content: body.text || params.text || "" }], 0.3, body.provider);
          try { const j = JSON.parse(txt.replace(/```json\s*|```\s*/g, "").trim()); return json({ translated_text: j.translated_text || txt, word_count: j.word_count || 0, source: src, target: tgt, provider: body.provider || (OPENROUTER_API_KEY ? "openrouter" : "github") }); }
          catch { return json({ translated_text: txt, word_count: 0, source: src, target: tgt, provider: body.provider || (OPENROUTER_API_KEY ? "openrouter" : "github") }); }
        } catch (e) { return err(e instanceof Error ? e.message : "AI service error", 502); }
      }
    }

    if (path.startsWith("admin/")) {
      const sp = path.replace("admin/", "");
      if (sp === "users" && method === "GET") {
        await requireRole(req, "admin");
        const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        return json(data || []);
      }
      const ur = sp.match(/^users\/([^\/]+)\/role$/);
      if (ur && method === "PATCH") {
        await requireRole(req, "admin");
        const { error: ue } = await supabase.from("profiles").update({ role: params.role }).eq("id", ur[1]);
        if (ue) return err(ue.message);
        return json({ message: "Role updated" });
      }
      if (sp === "badges/assign" && method === "POST") {
        await requireRole(req, "admin");
        const { data, error: be } = await supabase.from("user_badges").insert({ user_id: params.user_id, name: params.name, description: params.description || "", icon: params.icon || "award" }).select().single();
        if (be || !data) return err(be?.message || "Failed");
        return json({ id: data.id, name: data.name });
      }
    }

    if (path === "leaderboard/contributors" && method === "GET") {
      const limit = parseInt(params.limit || "20");
      const { data } = await supabase.from("user_scores").select("*,profiles!inner(username,display_name,avatar_url)").order("total_points", { ascending: false }).limit(limit);
      return json((data || []).map((s: any, i: number) => ({ rank: i + 1, user_id: s.user_id, username: s.profiles?.username, display_name: s.profiles?.display_name, avatar_url: s.profiles?.avatar_url, score: { total_points: s.total_points, texts_uploaded: s.texts_uploaded, annotations_made: s.annotations_made, lessons_completed: s.lessons_completed } })));
    }

    if (path === "leaderboard/mentors" && method === "GET") {
      const limit = parseInt(params.limit || "20");
      const { data } = await supabase.from("mentors").select("*,profiles!inner(username,display_name,avatar_url)").order("thanks_count", { ascending: false }).limit(limit);
      return json((data || []).map((m: any, i: number) => ({ rank: i + 1, user_id: m.user_id, headline: m.headline, rating: m.rating, thanks_count: m.thanks_count, total_sessions: m.total_sessions, badge: m.badge })));
    }

    if (path.startsWith("seed/")) {
      const sp = path.replace("seed/", "");
      if (sp === "corpus" && method === "POST") {
        const texts = [
          { title: "भगवद्गीता प्रथमः अध्यायः", content: "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः। मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय॥", language: "sa", source: "भगवद्गीता", tags: ["epic", "philosophy"] },
          { title: "रामायणम् बालकाण्डः", content: "तपःस्वाध्यायनिरतं तपस्वी वाग्विदां वरम्। नारदं परिपप्रच्छ वाल्मीकिर्मुनिपुङ्गवम्॥", language: "sa", source: "रामायणम्", tags: ["epic", "itihasa"] },
          { title: "अभिज्ञानशाकुन्तलम्", content: "अर्थमर्थं प्रति मया भवता च परिग्रहः। मनसोऽभिमतः कश्चिदस्ति साधारणो जनः॥", language: "sa", source: "कालिदासः", tags: ["drama", "classical"] },
          { title: "हितोपदेशः मित्रलाभः", content: "उपकारप्रधानानि वचनानि सहस्रशः। तेषां फलमवाप्नोति यः करोति न संशयः॥", language: "sa", source: "हितोपदेशः", tags: ["fable", "moral"] },
          { title: "पञ्चतन्त्रम् कथामुखम्", content: "यस्य नास्ति स्वयं प्रज्ञा शास्त्रं तस्य करोति किम्। लोचनाभ्यां विहीनस्य दर्पणः किं करिष्यति॥", language: "sa", source: "पञ्चतन्त्रम्", tags: ["fable", "wisdom"] },
          { title: "कठोपनिषत्", content: "श्रेयश्च प्रेयश्च मनुष्यमेतः तौ सम्परीत्य विविनक्ति धीरः। श्रेयो हि धीरोऽभिप्रेयसो वृणीते प्रेयो मन्दो योगक्षेमाद्वृणीते॥", language: "sa", source: "यजुर्वेदः", tags: ["upanishad", "philosophy"] },
          { title: "योगसूत्रम् पातञ्जलिः", content: "योगश्चित्तवृत्तिनिरोधः। तदा द्रष्टुः स्वरूपेऽवस्थानम्। वृत्तिसारूप्यमितरत्र॥", language: "sa", source: "पातञ्जलिः", tags: ["yoga", "philosophy"] },
          { title: "न्यायसूत्रम् गौतमः", content: "प्रमाणप्रमेयसंशयप्रयोजनदृष्टान्तसिद्धान्तावयवतर्कनिर्णयवादजल्पवितण्डाहेत्वाभासच्छलजातिनिग्रहस्थानानां तत्त्वज्ञानान्निःश्रेयसाधिगमः॥", language: "sa", source: "गौतमः", tags: ["philosophy", "logic"] },
          { title: "गोदान (प्रथम अध्याय)", content: "गाँव के बाहर नीम के पेड़ के नीचे दो आदमी बैठे थे। एक था होरी, दूसरा था उसका पड़ोसी खेती की बातें हो रही थीं। होरी ने कहा- \"इस बार तो बड़ी मुसीबत आ गई है भाई।\"", language: "hi", source: "मुंशी प्रेमचंद", tags: ["novel", "modern"] },
          { title: "मधुशाला", content: "टूटते तारों के नीचे हम, अपने दिल का दर्द लिए। आज फिर तन्हाई में बैठे, याद तुम्हारी आई॥", language: "hi", source: "हरिवंश राय बच्चन", tags: ["poetry", "modern"] },
          { title: "निर्मला (उपन्यास)", content: "निर्मला पढ़ना चाहती थी, परन्तु पिता की आर्थिक स्थिति अच्छी न थी। उसकी माँ का कहना था कि लड़कियों को बहुत पढ़ाना ठीक नहीं।", language: "hi", source: "मुंशी प्रेमचंद", tags: ["novel", "social"] },
          { title: "कफ़न (कहानी)", content: "झोंपड़े के दरवाजे पर घीप का लोंदा लिए माँगू और उसका बेटा घीसू बैठे थे। आग जल रही थी और आलू भूने जा रहे थे।", language: "hi", source: "मुंशी प्रेमचंद", tags: ["story", "social"] },
          { title: "चिदम्बरा (कविता संग्रह)", content: "बहुत दिनों बाद आज फिर, याद आया वह गाँव। जहाँ बचपन बीता था, वह सावन और भादों का मौसम॥", language: "hi", source: "सुमित्रानंदन पंत", tags: ["poetry", "nature"] },
          { title: "यामा (कविता संग्रह)", content: "यह जो जीवन है, यह एक पहेली है। कोई सुलझाए तो सुलझे, नहीं तो उलझी रहे। यह जीवन की राहें, कितनी अजब-ग़ज़ब हैं॥", language: "hi", source: "महादेवी वर्मा", tags: ["poetry", "philosophy"] },
          { title: "रश्मिरथी (कविता)", content: "हे मेरे देश के वीर सपूतो, तुम्हें मेरा नमन है। जो शहीद हुए हो देश पर, तुम सच्चे अमर हो॥", language: "hi", source: "रामधारी सिंह दिनकर", tags: ["poetry", "patriotic"] },
        ];
        const { data, error: se } = await supabase.from("corpus_texts").insert(texts).select();
        if (se) return err(se.message);
        await supabase.from("user_scores").upsert({ user_id: "00000000-0000-0000-0000-000000000001", total_points: 75, texts_uploaded: 15 });
        return json({ seeded: true, total: data?.length || 0 }, 201);
      }
    }

    if (path.startsWith("developer/")) {
      const sp = path.replace("developer/", "");
      if (sp === "apps" && method === "GET") {
        const uid = await requireUser(req);
        const { data } = await supabase.from("developer_apps").select("*").eq("user_id", uid).order("created_at", { ascending: false });
        return json(data || []);
      }
      if (sp === "apps" && method === "POST") {
        const uid = await requireUser(req);
        const body = await parseBody(req);
        const apiKey = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
        const prefix = apiKey.substring(0, 8);
        const tier = params.tier || "free";
        const { data: tiers } = await supabase.from("rate_tiers").select("*").eq("name", tier).single();
        const { data, error: ae } = await supabase.from("developer_apps").insert({ user_id: uid, name: body.name, description: body.description || "", api_key: apiKey, api_key_prefix: prefix, rate_plan: tier, requests_per_hour: tiers?.requests_per_hour || 100, is_active: true }).select().single();
        if (ae || !data) return err(ae?.message || "Failed");
        return json({ id: data.id, user_id: uid, name: data.name, description: data.description, api_key: apiKey, api_key_prefix: prefix, rate_plan: tier, requests_per_hour: tiers?.requests_per_hour || 100, is_active: true, created_at: data.created_at }, 201);
      }
      const aid = sp.match(/^apps\/([^\/]+)$/);
      if (aid && method === "DELETE") {
        const uid = await requireUser(req);
        const { error: de } = await supabase.from("developer_apps").update({ is_active: false }).eq("id", aid[1]).eq("user_id", uid);
        if (de) return err(de.message);
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }
      const upg = sp.match(/^apps\/([^\/]+)\/upgrade$/);
      if (upg && method === "POST") {
        await requireUser(req);
        const tier = params.tier || "free";
        const { data: tiers } = await supabase.from("rate_tiers").select("*").eq("name", tier).single();
        if (!tiers) return err("Tier not found", 404);
        const { data, error: ue } = await supabase.from("developer_apps").update({ rate_plan: tier, requests_per_hour: tiers.requests_per_hour }).eq("id", upg[1]).select().single();
        if (ue || !data) return err(ue?.message || "Failed");
        return json({ tier: data.rate_plan, requests_per_hour: data.requests_per_hour, price: tiers.price || 0 });
      }
      if (sp === "tiers" && method === "GET") {
        const { data } = await supabase.from("rate_tiers").select("*").order("requests_per_hour");
        return json(data || []);
      }
      if (sp === "usage" && method === "GET") {
        const uid = await requireUser(req);
        const { data: apps } = await supabase.from("developer_apps").select("*").eq("user_id", uid);
        const appsUsage = (apps || []).map((a: any) => ({ app_name: a.name, api_key_prefix: a.api_key_prefix, tier: a.rate_plan, requests_per_hour: a.requests_per_hour, total_requests: 0 }));
        return json({ total_requests: 0, apps: appsUsage });
      }
      if (sp === "endpoints" && method === "GET") {
        const { data } = await supabase.from("api_endpoints").select("*").eq("is_active", true).order("category").order("path");
        return json(data || []);
      }
      if (sp === "endpoints" && method === "POST") {
        await requireRole(req, "admin");
        const { data, error: ee } = await supabase.from("api_endpoints").insert({ path: params.path, method: params.method, description: params.description, category: params.category || "general", min_plan: params.min_plan || "free" }).select().single();
        if (ee || !data) return err(ee?.message || "Failed");
        return json(data, 201);
      }
    }

    return err("Not found", 404);
  } catch (e) {
    const m = e instanceof Error ? e.message : "Internal server error";
    if (m.includes("Missing auth") || m.includes("Invalid auth") || m.includes("expired token")) return err(m, 401);
    if (m.includes("Requires role")) return err(m, 403);
    return err(m, 500);
  }
});
