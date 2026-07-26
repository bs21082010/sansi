from rag.pipeline import pipeline
from rag.embeddings import embedder


class TutorService:
    def __init__(self):
        self.system_prompt = (
            "You are a Sanskrit and Hindi tutor. Answer questions about grammar, "
            "translation, vocabulary, and texts. Use the provided context from "
            "authentic sources to support your answers with citations. "
            "Be encouraging and educational."
        )

    async def generate_response(
        self,
        message: str,
        language: str = "sa",
        context: str = "",
    ) -> tuple[str, list[str]]:
        retrieved = pipeline.retrieve(message, top_k=3)
        rag_context = pipeline.format_context(retrieved) if retrieved else context

        citations = [d["title"] for d in retrieved]
        reply = self._build_reply(message, language, rag_context)

        return reply, citations

    def _build_reply(self, message: str, language: str, context: str) -> str:
        if context:
            return f"Based on the texts:\n\n{context}\n\nRegarding your question: {message}"
        return f"That's a great question about {message}. Let me explain..."
