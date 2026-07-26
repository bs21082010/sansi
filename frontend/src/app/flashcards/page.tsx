"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, Shuffle } from "lucide-react"

const sampleCards = [
  { front: "नमस्ते", back: "Hello / Greetings", front_iast: "namaste" },
  { front: "पुस्तकम्", back: "Book", front_iast: "pustakam" },
  { front: "विद्यालयः", back: "School", front_iast: "vidyālayaḥ" },
  { front: "गच्छति", back: "He/She goes", front_iast: "gacchati" },
  { front: "जलम्", back: "Water", front_iast: "jalam" },
]

export default function FlashcardsPage() {
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [cards] = useState([...sampleCards])

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCurrent(0)
    setFlipped(false)
  }

  const next = () => {
    if (current < cards.length - 1) {
      setCurrent(current + 1)
      setFlipped(false)
    }
  }

  const prev = () => {
    if (current > 0) {
      setCurrent(current - 1)
      setFlipped(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center space-y-8 pt-8">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-3xl font-bold">Flashcards</h1>
        <button
          onClick={shuffleCards}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
        >
          <Shuffle className="h-4 w-4" /> Shuffle
        </button>
      </div>

      <p className="text-sm text-gray-500">
        {current + 1} / {cards.length}
      </p>

      <button
        onClick={() => setFlipped(!flipped)}
        className="flex h-64 w-full cursor-pointer items-center justify-center rounded-2xl border-2 bg-white p-8 shadow-lg transition hover:shadow-xl"
      >
        <div className="text-center">
          <p className="text-4xl font-sanskrit text-gray-900">
            {flipped ? cards[current].back : cards[current].front}
          </p>
          <p className="mt-4 text-sm italic text-gray-500">
            {flipped ? "" : cards[current].front_iast}
          </p>
          <p className="mt-6 text-xs text-gray-400">
            {flipped ? "Tap to see front" : "Tap to reveal meaning"}
          </p>
        </div>
      </button>

      <div className="flex gap-4">
        <button
          onClick={prev}
          disabled={current === 0}
          className="flex items-center gap-2 rounded-lg border px-6 py-3 disabled:opacity-30"
        >
          <ArrowLeft className="h-5 w-5" /> Previous
        </button>
        <button
          onClick={next}
          disabled={current === cards.length - 1}
          className="flex items-center gap-2 rounded-lg bg-sansi-600 px-6 py-3 text-white disabled:opacity-30"
        >
          Next <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
