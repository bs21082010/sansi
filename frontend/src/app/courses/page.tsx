"use client"

import { useState, useEffect, useCallback } from "react"
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import { api } from "@/lib/api"

interface Course {
  id: string
  title: string
  description: string
  language: string
  level: string
  created_by: string
  is_published: boolean
  created_at: string
}

interface Lesson {
  id: string
  title: string
  duration?: string
  content?: { introduction?: string; summary?: string; sections?: { heading?: string; body?: string }[] }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState<string>("all")
  const [language, setLanguage] = useState<string>("all")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({})
  const [lessonLoading, setLessonLoading] = useState(false)
  const [openLesson, setOpenLesson] = useState<string | null>(null)

  const loadCourses = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Course[]>("/courses")
      setCourses(data || [])
    } catch {
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const filtered = courses.filter((c) => {
    if (level !== "all" && c.level !== level) return false
    if (language !== "all" && c.language !== language) return false
    return true
  })

  const toggleCourse = async (course: Course) => {
    if (expanded === course.id) {
      setExpanded(null)
      return
    }
    setExpanded(course.id)
    setLessonLoading(true)
    try {
      const data = await api.get<Lesson[]>(`/courses/${course.id}/lessons`)
      setLessons((prev) => ({ ...prev, [course.id]: data || [] }))
    } catch {
      setLessons((prev) => ({ ...prev, [course.id]: [] }))
    } finally {
      setLessonLoading(false)
    }
  }

  const levels = ["all", "beginner", "intermediate", "advanced"]
  const languages = ["all", "sa", "hi"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Learning Hub</h1>
        <span className="rounded-full bg-sansi-100 px-4 py-1 text-sm text-sansi-800">
          {filtered.length} courses
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 self-center mr-1">Level:</span>
        {levels.map((lv) => (
          <button
            key={lv}
            onClick={() => setLevel(lv)}
            className={`rounded-full px-4 py-1 text-sm capitalize ${
              level === lv
                ? "bg-sansi-100 text-sansi-800"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {lv}
          </button>
        ))}
        <span className="text-sm text-gray-500 self-center ml-3 mr-1">Language:</span>
        {languages.map((lg) => (
          <button
            key={lg}
            onClick={() => setLanguage(lg)}
            className={`rounded-full px-4 py-1 text-sm capitalize ${
              language === lg
                ? "bg-sansi-100 text-sansi-800"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {lg === "sa" ? "Sanskrit" : lg === "hi" ? "Hindi" : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading courses...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No courses match your filters.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-sansi-100 px-3 py-1 text-xs font-medium text-sansi-700">
                  {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                </span>
                <span className="text-xs text-gray-400">
                  {course.language === "sa" ? "Sanskrit" : course.language === "hi" ? "Hindi" : course.language}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">{course.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{course.description}</p>
              <button
                onClick={() => toggleCourse(course)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-sansi-200 px-4 py-2 text-sm text-sansi-700 hover:bg-sansi-50"
              >
                <BookOpen className="h-4 w-4" />
                {expanded === course.id ? "Hide Lessons" : "View Lessons"}
                {expanded === course.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expanded === course.id && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  {lessonLoading ? (
                    <p className="text-sm text-gray-500">Loading lessons...</p>
                  ) : (lessons[course.id] || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No lessons yet.</p>
                  ) : (
                    lessons[course.id].map((l) => (
                      <div key={l.id} className="overflow-hidden rounded-lg bg-gray-50">
                        <button
                          onClick={() => setOpenLesson(openLesson === l.id ? null : l.id)}
                          className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-gray-100"
                        >
                          <span className="text-sm font-medium text-gray-900">{l.title}</span>
                          <span className="flex items-center gap-2">
                            {l.duration && <span className="text-xs text-gray-500">{l.duration}</span>}
                            {openLesson === l.id ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </span>
                        </button>
                        {openLesson === l.id && (
                          <div className="space-y-3 border-t border-gray-200 p-4">
                            {l.content?.introduction && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium text-gray-900">Introduction: </span>
                                {l.content.introduction}
                              </p>
                            )}
                            {l.content?.summary && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium text-gray-900">Summary: </span>
                                {l.content.summary}
                              </p>
                            )}
                            {(l.content?.sections || []).map((sec, i) => (
                              <div key={i} className="rounded-md bg-white p-3">
                                {sec.heading && (
                                  <h4 className="mb-1 text-sm font-semibold text-gray-900">{sec.heading}</h4>
                                )}
                                {sec.body && <p className="text-sm leading-relaxed text-gray-700">{sec.body}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
