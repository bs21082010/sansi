# Sansi — Open Platform for Sanskrit & Hindi

Sansi is an open-source collaborative platform for learning, preserving, and contributing to Sanskrit and Hindi. Think of it as a language-focused OpenCode with built-in AI tutoring, transliteration, and a community-driven corpus.

## Architecture

```
sansi/
├── backend/        # FastAPI (Python)
│   └── app/
│       ├── api/    # RESTful routes
│       ├── models/ # SQLAlchemy models
│       ├── schemas/ # Pydantic schemas
│       └── services/ # Business logic
├── frontend/       # Next.js 14 (TypeScript)
│   └── src/
│       ├── app/    # Pages & layouts
│       ├── components/ # Reusable UI
│       └── lib/    # API client & utils
├── ai/             # AI microservice
│   ├── rag/        # Retrieval-Augmented Generation
│   ├── models/     # Model loading (GGUF, LoRA)
│   ├── tutor/      # Grammar & chat engine
│   └── tts/        # Speech-to-text / text-to-speech
└── docker-compose.yml
```

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# AI service
cd ai
pip install -r requirements.txt
uvicorn app:app --port 8080
```

## Key Features

- **Interactive Tutor** — AI chatbot for grammar, translation, and exercises
- **Open Corpus** — Shared library of Sanskrit/Hindi texts with transliteration
- **Learning Hub** — Courses, flashcards, quizzes, and practice tests
- **Community** — Repo-style contributions, peer review, and voting
- **Transliteration** — Devanagari ↔ IAST conversion built in
- **API Access** — REST endpoints for developers to build on top

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| AI | Sentence-Transformers, GGUF/LoRA models |
| Infra | Docker, GitHub Actions |

## License

MIT
