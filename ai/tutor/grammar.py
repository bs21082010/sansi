VERB_TEMPLATES = {
    "sa": {
        "present": {
            "description": "Present Indicative (लट् लकार)",
            "endings": {
                "1s": "ति", "2s": "सि", "3s": "ति",
                "1p": "मः", "2p": "थ", "3p": "न्ति",
            },
        },
        "past": {
            "description": "Imperfect (अन्‌ट्‌ लकार)",
            "endings": {
                "1s": "त्", "2s": "ः", "3s": "त्",
                "1p": "म", "2p": "त", "3p": "न्",
            },
        },
    },
    "hi": {
        "present": {
            "description": "Present Tense",
            "endings": {"1s": "ता हूँ", "2s": "ता है", "3s": "ता है",
                        "1p": "ते हैं", "2p": "ते हो", "3p": "ते हैं"},
        },
    },
}


class GrammarEngine:
    def get_conjugation(self, verb_root: str, tense: str, language: str = "sa") -> dict | None:
        lang_templates = VERB_TEMPLATES.get(language)
        if not lang_templates:
            return None
        tense_data = lang_templates.get(tense)
        if not tense_data:
            return None

        conjugations = {}
        for person, ending in tense_data["endings"].items():
            conjugations[person] = verb_root + ending

        return {
            "verb_root": verb_root,
            "tense": tense_data["description"],
            "conjugations": conjugations,
        }

    def get_declension(self, noun: str, language: str = "sa") -> dict:
        return {
            "noun": noun,
            "language": language,
            "note": "Full declension tables available in the course content",
        }


grammar = GrammarEngine()
