import re
from dataclasses import dataclass, asdict

# ── Sanskrit Noun Declension Tables ──

DECLENSIONS = {
    "देव": {  # masc -a stem
        "एकवचनम्": {"प्रथमा": "देवः", "द्वितीया": "देवम्", "तृतीया": "देवेन",
                     "चतुर्थी": "देवाय", "पञ्चमी": "देवात्", "षष्ठी": "देवस्य",
                     "सप्तमी": "देवे", "सम्बोधन": "देव"},
        "द्विवचनम्": {"प्रथमा": "देवौ", "द्वितीया": "देवौ", "तृतीया": "देवाभ्याम्",
                      "चतुर्थी": "देवाभ्याम्", "पञ्चमी": "देवाभ्याम्", "षष्ठी": "देवयोः",
                      "सप्तमी": "देवयोः", "सम्बोधन": "देवौ"},
        "बहुवचनम्": {"प्रथमा": "देवाः", "द्वितीया": "देवान्", "तृतीया": "देवैः",
                      "चतुर्थी": "देवेभ्यः", "पञ्चमी": "देवेभ्यः", "षष्ठी": "देवानाम्",
                      "सप्तमी": "देवेषु", "सम्बोधन": "देवाः"},
    },
    "फल": {  # neut -a stem
        "एकवचनम्": {"प्रथमा": "फलम्", "द्वितीया": "फलम्", "तृतीया": "फलेन",
                     "चतुर्थी": "फलाय", "पञ्चमी": "फलात्", "षष्ठी": "फलस्य",
                     "सप्तमी": "फले", "सम्बोधन": "फल"},
        "द्विवचनम्": {"प्रथमा": "फले", "द्वितीया": "फले", "तृतीया": "फलाभ्याम्",
                      "चतुर्थी": "फलाभ्याम्", "पञ्चमी": "फलाभ्याम्", "षष्ठी": "फलयोः",
                      "सप्तमी": "फलयोः", "सम्बोधन": "फले"},
        "बहुवचनम्": {"प्रथमा": "फलानि", "द्वितीया": "फलानि", "तृतीया": "फलैः",
                      "चतुर्थी": "फलेभ्यः", "पञ्चमी": "फलेभ्यः", "षष्ठी": "फलानाम्",
                      "सप्तमी": "फलेषु", "सम्बोधन": "फलानि"},
    },
    "राम": {  # masc proper noun
        "एकवचनम्": {"प्रथमा": "रामः", "द्वितीया": "रामम्", "तृतीया": "रामेण",
                     "चतुर्थी": "रामाय", "पञ्चमी": "रामात्", "षष्ठी": "रामस्य",
                     "सप्तमी": "रामे", "सम्बोधन": "राम"},
    },
}

# ── Verb Roots and Conjugation ──

VERB_ROOTS: dict[str, dict] = {
    "गम्": {"meaning": "to go", "class": 1, "padha": "parasmaipada", "present_3s": "गच्छति"},
    "पठ्": {"meaning": "to read", "class": 1, "padha": "parasmaipada", "present_3s": "पठति"},
    "भू": {"meaning": "to be", "class": 1, "padha": "parasmaipada", "present_3s": "भवति"},
    "कृ": {"meaning": "to do", "class": 8, "padha": "parasmaipada", "present_3s": "करोति"},
    "दृश्": {"meaning": "to see", "class": 1, "padha": "parasmaipada", "present_3s": "पश्यति"},
    "वद्": {"meaning": "to speak", "class": 1, "padha": "parasmaipada", "present_3s": "वदति"},
    "लिख्": {"meaning": "to write", "class": 6, "padha": "parasmaipada", "present_3s": "लिखति"},
    "खाद्": {"meaning": "to eat", "class": 1, "padha": "parasmaipada", "present_3s": "खादति"},
    "पा": {"meaning": "to drink", "class": 1, "padha": "parasmaipada", "present_3s": "पिबति"},
    "दा": {"meaning": "to give", "class": 3, "padha": "parasmaipada", "present_3s": "ददाति"},
}

CASE_NAMES = {
    "प्रथमा": "Nominative", "द्वितीया": "Accusative",
    "तृतीया": "Instrumental", "चतुर्थी": "Dative",
    "पञ्चमी": "Ablative", "षष्ठी": "Genitive",
    "सप्तमी": "Locative", "सम्बोधन": "Vocative",
}

NUMBER_NAMES = {"एकवचनम्": "Singular", "द्विवचनम्": "Dual", "बहुवचनम्": "Plural"}


@dataclass
class ParseResult:
    word: str
    possible_stems: list[str]
    pos: str
    root: str | None = None
    meaning: str | None = None
    declension: dict | None = None
    case: str | None = None
    number: str | None = None
    verb_info: dict | None = None


class SanskritParser:
    def parse(self, word: str) -> ParseResult:
        if word in ["।", "॥", " ", ""]:
            return ParseResult(word=word, possible_stems=[], pos="punctuation")

        for stem, decl in DECLENSIONS.items():
            for num, cases in decl.items():
                for case_name, form in cases.items():
                    if form == word:
                        return ParseResult(
                            word=word,
                            possible_stems=[stem],
                            pos="noun",
                            declension={
                                "stem": stem,
                                "case": case_name,
                                "case_en": CASE_NAMES.get(case_name, ""),
                                "number": num,
                                "number_en": NUMBER_NAMES.get(num, ""),
                                "full_table": decl,
                            },
                            case=case_name,
                            number=num,
                        )

        for root, info in VERB_ROOTS.items():
            for tense_form in ["present_3s", "present_1s", "present_2s", "past_3s", "future_3s"]:
                form = info.get(tense_form, "")
                if form == word:
                    return ParseResult(
                        word=word,
                        possible_stems=[root],
                        pos="verb",
                        root=root,
                        meaning=info["meaning"],
                        verb_info={
                            "root": root,
                            "meaning": info["meaning"],
                            "class": info["class"],
                            "padha": info["padha"],
                            "tense_form": tense_form,
                        },
                    )

        return ParseResult(
            word=word,
            possible_stems=[word],
            pos="unknown",
        )

    def analyze_sentence(self, sentence: str) -> list[dict]:
        words = re.findall(r"[\u0900-\u097F]+|[a-zA-Z]+|[.,!?;:।॥]", sentence)
        results = []
        for w in words:
            result = self.parse(w)
            results.append(asdict(result))
        return results

    def list_verb_roots(self) -> list[dict]:
        return [
            {"root": root, "meaning": info["meaning"],
             "class": info["class"], "padha": info["padha"],
             "present_3s": info["present_3s"]}
            for root, info in VERB_ROOTS.items()
        ]

    def get_declension(self, stem: str) -> dict | None:
        return DECLENSIONS.get(stem)


# ── Translation Pairs ──

TRANSLATION_PAIRS: list[dict] = [
    {"source": "नमस्ते", "target": "Hello", "source_lang": "sa", "target_lang": "en", "category": "greeting"},
    {"source": "भवान् कथमस्ति?", "target": "How are you?", "source_lang": "sa", "target_lang": "en", "category": "greeting"},
    {"source": "अहं गच्छामि", "target": "I am going", "source_lang": "sa", "target_lang": "en", "category": "basic"},
    {"source": "तव नाम किम्?", "target": "What is your name?", "source_lang": "sa", "target_lang": "en", "category": "basic"},
    {"source": "पुस्तकम् पठामि", "target": "I read a book", "source_lang": "sa", "target_lang": "en", "category": "basic"},
    {"source": "धन्यवादः", "target": "Thank you", "source_lang": "sa", "target_lang": "en", "category": "greeting"},
    {"source": "आप कैसे हैं?", "target": "How are you?", "source_lang": "hi", "target_lang": "en", "category": "greeting"},
    {"source": "मैं ठीक हूँ", "target": "I am fine", "source_lang": "hi", "target_lang": "en", "category": "greeting"},
    {"source": "आपका नाम क्या है?", "target": "What is your name?", "source_lang": "hi", "target_lang": "en", "category": "basic"},
    {"source": "मैं हिन्दी सीख रहा हूँ", "target": "I am learning Hindi", "source_lang": "hi", "target_lang": "en", "category": "learning"},
    {"source": "अहं संस्कृतम् पठामि", "target": "I study Sanskrit", "source_lang": "sa", "target_lang": "en", "category": "learning"},
    {"source": "सत्यमेव जयते", "target": "Truth alone triumphs", "source_lang": "sa", "target_lang": "en", "category": "proverb"},
    {"source": "वसुधैव कुटुम्बकम्", "target": "The world is one family", "source_lang": "sa", "target_lang": "en", "category": "proverb"},
    {"source": "अहिंसा परमो धर्मः", "target": "Non-violence is the highest duty", "source_lang": "sa", "target_lang": "en", "category": "proverb"},
    {"source": "आत्मनः प्रतिकूलानि परेषाम् न समाचरेत्", "target": "Do not do to others what you dislike for yourself", "source_lang": "sa", "target_lang": "en", "category": "ethics"},
    {"source": "जननी जन्मभूमिश्च स्वर्गादपि गरीयसी", "target": "Mother and motherland are greater than heaven", "source_lang": "sa", "target_lang": "en", "category": "proverb"},
]


class TranslationService:
    def get_pairs(self, source: str = "", target: str = "", category: str = "", limit: int = 50) -> list[dict]:
        results = TRANSLATION_PAIRS
        if source:
            results = [p for p in results if p["source_lang"] == source]
        if target:
            results = [p for p in results if p["target_lang"] == target]
        if category:
            results = [p for p in results if p["category"] == category]
        return results[:limit]

    def translate_word(self, word: str, source: str = "sa", target: str = "en") -> dict | None:
        for pair in TRANSLATION_PAIRS:
            if pair["source"] == word and pair["source_lang"] == source:
                return pair
        return None


sanskrit_parser = SanskritParser()
translator = TranslationService()
