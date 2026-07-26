class SpeechService:
    def __init__(self):
        self.supported_languages = ["sa", "hi"]

    async def synthesize(self, text: str, language: str = "sa") -> bytes:
        return text.encode("utf-8")

    async def recognize(self, audio_bytes: bytes, language: str = "sa") -> str:
        return "[Speech recognition stub]"


speech = SpeechService()
