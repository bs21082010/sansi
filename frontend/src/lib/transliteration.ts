const VOWEL_SIGNS: Record<string, string> = {
  "\u093E": "ā", "\u093F": "i", "\u0940": "ī", "\u0941": "u", "\u0942": "ū",
  "\u0943": "ṛ", "\u0947": "e", "\u0948": "ai", "\u094B": "o", "\u094C": "au",
  "\u0902": "ṃ", "\u0903": "ḥ",
}

const LETTERS: Record<string, string> = {
  अ: "a", आ: "ā", इ: "i", ई: "ī", उ: "u", ऊ: "ū",
  ऋ: "ṛ", ए: "e", ऐ: "ai", ओ: "o", औ: "au",
  क: "ka", ख: "kha", ग: "ga", घ: "gha", ङ: "ṅa",
  च: "ca", छ: "cha", ज: "ja", झ: "jha", ञ: "ña",
  ट: "ṭa", ठ: "ṭha", ड: "ḍa", ढ: "ḍha", ण: "ṇa",
  त: "ta", थ: "tha", द: "da", ध: "dha", न: "na",
  प: "pa", फ: "pha", ब: "ba", भ: "bha", म: "ma",
  य: "ya", र: "ra", ल: "la", व: "va", श: "śa",
  ष: "ṣa", स: "sa", ह: "ha",
}

const ALL: Record<string, string> = { ...LETTERS, ...VOWEL_SIGNS }

export function devanagariToIast(text: string): string {
  return text
    .split("")
    .map((ch) => ALL[ch] || ch)
    .join("")
}
