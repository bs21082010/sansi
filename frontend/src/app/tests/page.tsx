"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { CheckCircle, XCircle, RotateCcw, FileText } from "lucide-react"
import { api } from "@/lib/api"

interface TestMeta {
  id: string
  title: string
  course_id: string
  time_limit_minutes: number
  passing_score: number
  created_at: string
}

interface Question {
  id: string
  question: string
  options: string[]
  answer: string
}

interface Test extends TestMeta {
  questions: Question[]
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestMeta[]>([])
  const [courses, setCourses] = useState<Record<string, string>>({})
  const [test, setTest] = useState<Test | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)
  const [savedLocally, setSavedLocally] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [testList, courseList] = await Promise.all([
        api.get<TestMeta[]>("/learning/tests"),
        api.get<{ id: string; title: string }[]>("/courses"),
      ])
      setTests(testList || [])
      const map: Record<string, string> = {}
      for (const c of courseList || []) map[c.id] = c.title
      setCourses(map)
    } catch {
      setTests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pickTest = async (id: string) => {
    setAnswers({})
    setSubmitted(false)
    setResult(null)
    setError("")
    try {
      const t = await api.get<Test>(`/learning/tests/${id}`)
      const qs = typeof t.questions === "string" ? JSON.parse(t.questions) : t.questions
      setTest({ ...t, questions: qs })
    } catch {
      setError("Could not load test")
      setTest(null)
    }
  }

  const submit = async () => {
    if (!test) return
    setSubmitting(true)
    setError("")
    const isGuest = typeof window !== "undefined" && !localStorage.getItem("token")
    try {
      if (isGuest) {
        const correct = test.questions.filter((q) => answers[q.id] === q.answer).length
        const score = Math.round((correct / test.questions.length) * 100)
        setResult({ score, passed: score >= (test.passing_score || 60) })
        setSavedLocally(true)
      } else {
        const res = await api.post<{ score: number; passed: boolean }>(
          `/learning/tests/${test.id}/attempt`,
          { answers }
        )
        setResult(res)
      }
      setSubmitted(true)
    } catch {
      setError("Could not submit the test. Please try again.")
      setTimeout(() => setError(""), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setAnswers({})
    setSubmitted(false)
    setResult(null)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Practice Tests</h1>
        {submitted && result && (
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-semibold ${
                result.passed ? "text-green-600" : "text-red-600"
              }`}
            >
              {result.passed ? "PASSED" : "FAILED"} — {result.score}%
            </span>
            <button
              onClick={reset}
              className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
            >
              <RotateCcw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}
      </div>

      {savedLocally && (
        <div className="rounded-lg bg-sansi-50 px-4 py-2 text-sm text-sansi-800">
          You are taking this test as a guest, so your score was graded locally.{" "}
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>{" "}
          to save your score and earn points.
        </div>
      )}

      {!test ? (
        loading ? (
          <p className="text-gray-500">Loading tests...</p>
        ) : tests.length === 0 ? (
          <p className="text-gray-500">No tests available yet.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">Pick a test to start:</p>
            <div className="grid gap-3 md:grid-cols-2">
              {tests.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pickTest(t.id)}
                  className="flex items-start gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md"
                >
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-sansi-600" />
                  <div>
                    <p className="font-medium text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">
                      {courses[t.course_id] || "General"} · {t.time_limit_minutes} min · pass{" "}
                      {t.passing_score}%
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{test.title}</h2>
              <p className="text-sm text-gray-500">
                {test.questions.length} questions · {test.time_limit_minutes} min · pass at{" "}
                {test.passing_score}%
              </p>
            </div>
            <button
              onClick={() => setTest(null)}
              className="text-sm text-sansi-700 hover:underline"
            >
              Choose another test
            </button>
          </div>

          <div className="space-y-6">
            {test.questions.map((q) => (
              <div
                key={q.id}
                className={`rounded-xl border bg-white p-6 shadow-sm ${
                  submitted
                    ? answers[q.id] === q.answer
                      ? "border-green-300"
                      : "border-red-300"
                    : ""
                }`}
              >
                <p className="mb-4 font-medium text-gray-900">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                        submitted
                          ? opt === q.answer
                            ? "border-green-500 bg-green-50"
                            : answers[q.id] === opt && opt !== q.answer
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200"
                          : answers[q.id] === opt
                            ? "border-sansi-500 bg-sansi-50"
                            : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                        disabled={submitted}
                        className="sr-only"
                      />
                      {submitted && opt === q.answer && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {submitted && answers[q.id] === opt && opt !== q.answer && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-sanskrit text-lg">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!submitted && (
            <button
              onClick={submit}
              disabled={submitting || Object.keys(answers).length < test.questions.length}
              className="w-full rounded-lg bg-sansi-600 py-3 text-white hover:bg-sansi-700 disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : `Submit Answers (${Object.keys(answers).length}/${test.questions.length} answered)`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
