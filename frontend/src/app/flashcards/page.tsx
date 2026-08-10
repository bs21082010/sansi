"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, ArrowRight, Shuffle } from "lucide-react"
import { api } from "@/lib/api"

interface Card {
  id: string
  front: string
  back: string
  front_iast?: string
  language?: string
}

interface Course {
  id: string
  title: string
  language: string
}

export default function FlashcardsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState("")
  const [cards, setCards] = useState<Card[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadCourses = useCallback(async () => {
    try {
      const data = await api.get<Course[]>("/courses")
      setCourses(data || [])
    } catch {
      setCourses([])
    }
  }, [])

  const loadCards = useCallback(async (cid: string) => {
    setLoading(true)
    setCurrent(0)
    setFlipped(false)
    try {
      const data = await api.get<Card[]>(`/learning/courses/${cid}/flashcards`)
      setCards(data || [])
    } catch {
      setCards([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  useEffect(() => {
    if (courseId) loadCards(courseId)
    else setLoading(false)
  }, [courseId, loadCards])

  const shuffleCards = () => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5))
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
      <div className="flex w-full items-center justify-between">
        <h1 className="text-3xl font-bold">Flashcards</h1>
        {cards.length > 0 && (
          <button
            onClick={shuffleCards}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
          >
            <Shuffle className="h-4 w-4" /> Shuffle
          </button>
        )}
      </div>

      <div className="w-full">
        <label className="text-sm font-medium text-gray-600">Select a course:</label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="">-- Choose a course --</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.language === "sa" ? "Sanskrit" : "Hindi"})
            </option>
          ))}
        </select>
      </div>

      {!courseId ? (
        <p className="text-gray-500">Pick a course above to start studying.</p>
      ) : loading ? (
        <p className="text-gray-500">Loading flashcards...</p>
      ) : cards.length === 0 ? (
        <p className="text-gray-500">No flashcards for this course yet.</p>
      ) : (
        <>
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
              {cards[current].front_iast && (
                <p className="mt-4 text-sm italic text-gray-500">
                  {flipped ? "" : cards[current].front_iast}
                </p>
              )}
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
        </>
      )}
    </div>
  )
}
