"use client"

import { useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"

const demoQuestions = [
  {
    id: "q1",
    question: "What is the Sanskrit word for 'book'?",
    options: ["पुस्तकम्", "जलम्", "अश्वः", "गृहम्"],
    answer: "पुस्तकम्",
  },
  {
    id: "q2",
    question: "Which verb means 'he goes'?",
    options: ["पठति", "गच्छति", "लिखति", "पश्यति"],
    answer: "गच्छति",
  },
  {
    id: "q3",
    question: "What does 'नमस्ते' mean?",
    options: ["Goodbye", "Hello", "Thank you", "Please"],
    answer: "Hello",
  },
]

export default function TestsPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = submitted
    ? demoQuestions.filter((q) => answers[q.id] === q.answer).length
    : 0

  const handleSubmit = () => {
    setSubmitted(true)
  }

  const resetTest = () => {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Practice Test</h1>
        {submitted && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">
              Score: {score}/{demoQuestions.length}
            </span>
            <button
              onClick={resetTest}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {demoQuestions.map((q) => (
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
          onClick={handleSubmit}
          className="w-full rounded-lg bg-sansi-600 py-3 text-white hover:bg-sansi-700"
        >
          Submit Answers
        </button>
      )}
    </div>
  )
}
