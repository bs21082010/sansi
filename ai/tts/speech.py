INDIC_VOICES = {
    "sa": {
        "name": "Sanskrit (Devanagari)",
        "model": "coqui/XTTS-v2",
        "speaker": "sanskrit_female",
    },
    "hi": {
        "name": "Hindi (Devanagari)",
        "model": "coqui/XTTS-v2",
        "speaker": "hindi_female",
    },
}


class SpeechService:
    def __init__(self):
        self._tts = None
        self.supported_languages = ["sa", "hi"]

    async def _ensure_model(self):
        if self._tts is not None:
            return
        try:
            from TTS.api import TTS

            self._tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
        except ImportError:
            self._tts = None

    async def synthesize(self, text: str, language: str = "sa") -> bytes:
        await self._ensure_model()
        voice_cfg = INDIC_VOICES.get(language, INDIC_VOICES["sa"])

        if self._tts is None:
            return text.encode("utf-8")

        import io
        import tempfile

        buf = io.BytesIO()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            self._tts.tts_to_file(
                text=text,
                language=language,
                speaker=voice_cfg["speaker"],
                file_path=tmp.name,
            )
            with open(tmp.name, "rb") as f:
                buf.write(f.read())
        buf.seek(0)
        return buf.read()

    async def list_voices(self) -> list[dict]:
        return [
            {
                "code": code,
                "name": cfg["name"],
                "model": cfg["model"],
            }
            for code, cfg in INDIC_VOICES.items()
        ]


speech = SpeechService()
