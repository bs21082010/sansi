MAPPING = {
    "अ": "a", "आ": "ā", "इ": "i", "ई": "ī", "उ": "u", "ऊ": "ū",
    "ऋ": "ṛ", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au",
    "क": "ka", "ख": "kha", "ग": "ga", "घ": "gha", "ङ": "ṅa",
    "च": "ca", "छ": "cha", "ज": "ja", "झ": "jha", "ञ": "ña",
    "ट": "ṭa", "ठ": "ṭha", "ड": "ḍa", "ढ": "ḍha", "ण": "ṇa",
    "त": "ta", "थ": "tha", "द": "da", "ध": "dha", "न": "na",
    "प": "pa", "फ": "pha", "ब": "ba", "भ": "bha", "म": "ma",
    "य": "ya", "र": "ra", "ल": "la", "व": "va", "श": "śa",
    "ष": "ṣa", "स": "sa", "ह": "ha",
    "ा": "ā", "ि": "i", "ी": "ī", "ु": "u", "ू": "ū",
    "ृ": "ṛ", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
    "ं": "ṃ", "ः": "ḥ",
}


def devanagari_to_iast(text: str) -> str:
    result = []
    for char in text:
        result.append(MAPPING.get(char, char))
    return "".join(result)


def iast_to_devanagari(text: str) -> str:
    reverse_map = {v: k for k, v in MAPPING.items()}
    result = []
    i = 0
    while i < len(text):
        found = False
        for length in (2, 1):
            chunk = text[i : i + length]
            if chunk in reverse_map:
                result.append(reverse_map[chunk])
                i += length
                found = True
                break
        if not found:
            result.append(text[i])
            i += 1
    return "".join(result)
