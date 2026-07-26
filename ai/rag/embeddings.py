try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

import numpy as np

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


class EmbeddingService:
    def __init__(self, model_name: str = MODEL_NAME):
        self.model = None
        self.model_name = model_name
        if SentenceTransformer is not None:
            self.model = SentenceTransformer(model_name)

    def encode(self, texts: list[str]) -> list[list[float]]:
        if self.model is None:
            return [[0.0] * 384 for _ in texts]
        embeddings = self.model.encode(texts, normalize_embeddings=True)
        return embeddings.tolist()

    def similarity(self, a: list[float], b: list[float]) -> float:
        return float(np.dot(a, b))


embedder = EmbeddingService()
