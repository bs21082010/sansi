import random

TEMPLATES = {
    "beginner": {
        "quiz": [
            "What is the meaning of '{word}'?",
            "Translate '{phrase}' to {target_lang}.",
            "Which case ending is used for '{noun}' in {case}?",
        ],
        "hint": "Think about the basic meaning of the word.",
        "explanation": "This is a fundamental concept. Let's break it down simply.",
    },
    "intermediate": {
        "quiz": [
            "Identify the sandhi in '{phrase}':",
            "Conjugate the verb '{root}' in {tense} for {person}:",
            "Explain the grammatical function of '{word}' in this sentence:",
        ],
        "hint": "Consider the grammatical rules we discussed.",
        "explanation": "This builds on the basics. Here's how the rule applies.",
    },
    "advanced": {
        "quiz": [
            "Analyze the compound '{compound}' — what type of samāsa is it?",
            "Translate and explain the nuance in '{passage}':",
            "Identify the meter (chandas) of this verse: '{verse}'",
        ],
        "hint": "Think about the morphological structure.",
        "explanation": "This is an advanced concept. Here's the detailed analysis.",
    },
}

WORDS = {
    "beginner": [
        {"word": "नमस्ते", "meaning": "Hello", "phrase": "नमस्ते कौशलम्"},
        {"word": "पुस्तक", "meaning": "Book", "phrase": "पुस्तकम् पठामि"},
        {"word": "विद्या", "meaning": "Knowledge", "phrase": "विद्या ददाति"},
    ],
    "intermediate": [
        {"word": "गच्छति", "meaning": "goes", "phrase": "रामः गच्छति", "root": "गम्", "tense": "present"},
        {"word": "पठन्ति", "meaning": "they read", "phrase": "छात्राः पठन्ति", "root": "पठ्", "tense": "present"},
    ],
    "advanced": [
        {"compound": "राजपुरुषः", "passage": "राजपुरुषः नगरं गच्छति", "verse": ""},
        {"compound": "देवदत्तः", "passage": "देवदत्तः विद्यालयं गच्छति", "verse": ""},
    ],
}


class AdaptiveDifficulty:
    def __init__(self):
        self.user_levels: dict[str, str] = {}

    def get_level(self, user_id: str) -> str:
        return self.user_levels.get(user_id, "beginner")

    def set_level(self, user_id: str, level: str):
        if level in TEMPLATES:
            self.user_levels[user_id] = level

    def adjust_level(self, user_id: str, correct: bool, streak: int):
        current = self.get_level(user_id)
        levels = ["beginner", "intermediate", "advanced"]
        idx = levels.index(current)

        if correct and streak >= 3 and idx < len(levels) - 1:
            self.user_levels[user_id] = levels[idx + 1]
        elif not correct and streak <= -2 and idx > 0:
            self.user_levels[user_id] = levels[idx - 1]

    def generate_exercise(self, level: str) -> dict:
        templates = TEMPLATES[level]
        words = WORDS[level]
        word = random.choice(words) if words else {"word": "संस्कृतम्"}

        return {
            "level": level,
            "question": random.choice(templates["quiz"]).format(**word, target_lang="Hindi", case="प्रथमा"),
            "hint": templates["hint"],
            "explanation": templates["explanation"],
            "context": word,
        }


difficulty = AdaptiveDifficulty()
