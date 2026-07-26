import re

SANDHI_RULES: list[tuple[re.Pattern, str]] = [
    (re.compile(r"अ([अािी])"), r"आ\1"),
    (re.compile(r"इ([इी])"), r"ई\1"),
    (re.compile(r"उ([उू])"), r"ऊ\1"),
    (re.compile(r"अ([एै])"), r"ऐ\1"),
    (re.compile(r"आ([एै])"), r"ऐ\1"),
    (re.compile(r"अ([ओौ])"), r"आव्\1"),
    (re.compile(r"आ([ओौ])"), r"आव्\1"),
    (re.compile(r"([अािीउू])([अािीउू])"), r"\1य्\2"),
    (re.compile(r"([एै])([अािीउू])"), r"\1य्\2"),
    (re.compile(r"([ओौ])([अािीउू])"), r"\1व्\2"),
    (re.compile(r"ः([कखपफशषस])"), r":\1"),
    (re.compile(r"ः([तथचछटठ])"), r"स्\1"),
]

HINDI_STOPWORDS = {
    "का", "की", "के", "को", "से", "में", "पर", "है", "हैं",
    "था", "थी", "थे", "हूँ", "हो", "है", "एक", "और", "कि",
    "यह", "वह", "इस", "उस", "ये", "वे", "तो", "भी", "ने",
    "कर", "सकता", "सकते", "सकती",
}

HINDI_SUFFIXES = [
    "ों", "ें", "एँ", "ाएँ", "ियाँ", "कर", "ते", "ती", "ता",
    "ना", "नी", "ने", "या", "ी", "े", "ि",
]


class MorphologicalAnalyzer:
    def split_sandhi(self, text: str) -> list[str]:
        parts = [text]
        for pattern, replacement in SANDHI_RULES:
            new_parts = []
            for part in parts:
                split = pattern.split(part)
                new_parts.extend(split)
            parts = [p for p in new_parts if p]
        return parts if len(parts) > 1 else [text]

    def stem_hindi(self, word: str) -> str:
        if word in HINDI_STOPWORDS:
            return word

        for suffix in HINDI_SUFFIXES:
            if word.endswith(suffix) and len(word) > len(suffix) + 1:
                return word[: -len(suffix)]
        return word

    def analyze(self, text: str, language: str = "sa") -> dict:
        if language == "sa":
            tokens = self.split_sandhi(text)
            return {
                "language": "sa",
                "tokens": tokens,
                "analysis": "sandhi_split",
            }
        elif language == "hi":
            words = text.split()
            stems = [self.stem_hindi(w) for w in words]
            return {
                "language": "hi",
                "tokens": words,
                "stems": stems,
                "analysis": "stemming",
            }
        return {"language": language, "tokens": text.split(), "analysis": "none"}


analyzer = MorphologicalAnalyzer()
