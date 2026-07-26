const DEVANAGARI_TO_IAST: Record<string, string> = {
  अ: "a", आ: "ā", इ: "i", ई: "ī", उ: "u", ऊ: "ū",
  ऋ: "ṛ", ए: "e", ऐ: "ai", ओ: "o", औ: "au",
  क: "ka", ख: "kha", ग: "ga", घ: "gha", ङ: "ṅa",
  च: "ca", छ: "cha", ज: "ja", झ: "jha", ञ: "ña",
  ट: "ṭa", ठ: "ṭha", ड: "ḍa", ढ: "ḍha", ण: "ṇa",
  त: "ta", थ: "tha", द: "da", ध: "dha", न: "na",
  प: "pa", फ: "pha", ब: "ba", भ: "bha", म: "ma",
  य: "ya", र: "ra", ल: "la", व: "va", श: "śa",
  ष: "ṣa", स: "sa", ह: "ha",
  ा: "ā", ि: "i", ी: "ī", ु: "u", ू: "ū",
  ृ: "ṛ", े: "e", ै: "ai", ो: "o", ौ: "au",
  ं: "ṃ", ः: "ḥ",
}

export function devanagariToIast(text: string): string {
  return text
    .split("")
    .map((ch) => DEVANAGARI_TO_IAST[ch] || ch)
    .join("")
}
