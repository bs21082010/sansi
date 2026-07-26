from typing import TypedDict

from rag.embeddings import embedder


class Document(TypedDict):
    id: str
    title: str
    content: str
    language: str
    embedding: list[float]


class RAGPipeline:
    def __init__(self):
        self.documents: list[Document] = []

    def add_documents(self, docs: list[Document]):
        texts = [f"{d['title']} {d['content']}" for d in docs]
        embeddings = embedder.encode(texts)
        for doc, emb in zip(docs, embeddings):
            doc["embedding"] = emb
            self.documents.append(doc)

    def retrieve(self, query: str, top_k: int = 5) -> list[Document]:
        if not self.documents:
            return []

        query_emb = embedder.encode([query])[0]
        scored = []
        for doc in self.documents:
            score = embedder.similarity(query_emb, doc["embedding"])
            scored.append((score, doc))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored[:top_k]]

    def format_context(self, docs: list[Document]) -> str:
        return "\n\n".join(
            f"Source: {d['title']} ({d['language']})\n{d['content']}" for d in docs
        )


pipeline = RAGPipeline()
