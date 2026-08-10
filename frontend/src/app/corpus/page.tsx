"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, BookOpen, Boxes } from "lucide-react"
import { api } from "@/lib/api"
import dynamic from "next/dynamic"

const Pdf3DViewer = dynamic(() => import("@/components/Pdf3DViewer"), { ssr: false })

interface CorpusText {
  id: string
  title: string
  title_iast: string
  content: string
  language: string
  source: string
  is_verified: boolean
}

export default function CorpusPage() {
  const [texts, setTexts] = useState<CorpusText[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [language, setLanguage] = useState("all")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (language !== "all") params.set("language", language)
      const qs = params.toString() ? `?${params.toString()}` : ""
      const res = await api.get<{ items: CorpusText[]; total: number }>(`/corpus${qs}`)
      setTexts(res.items || [])
    } catch {
      setTexts([])
    } finally {
      setLoading(false)
    }
  }, [search, language])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Open Corpus</h1>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-sansi-100 px-4 py-1 text-sm text-sansi-800">
            {texts.length} texts
          </span>
          <button
            onClick={() => setViewerOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-sansi-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sansi-700"
          >
            <Boxes className="h-4 w-4" />
            3D PDF Viewer
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search texts in Sanskrit or Hindi..."
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-sansi-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        {["all", "sa", "hi"].map((lg) => (
          <button
            key={lg}
            onClick={() => setLanguage(lg)}
            className={`rounded-full px-4 py-1 text-sm ${
              language === lg
                ? "bg-sansi-100 text-sansi-800"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {lg === "all" ? "All" : lg === "sa" ? "Sanskrit" : "Hindi"}
          </button>
        ))}
      </div>

      <Pdf3DViewer open={viewerOpen} onClose={() => setViewerOpen(false)} />

      {loading ? (
        <p className="text-gray-500">Loading texts...</p>
      ) : texts.length === 0 ? (
        <p className="text-gray-500">No texts in the corpus yet.</p>
      ) : (
        <div className="space-y-4">
          {texts.map((text) => (
            <div
              key={text.id}
              className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{text.title}</h3>
                  {text.title_iast && (
                    <p className="text-sm text-gray-500 italic">{text.title_iast}</p>
                  )}
                </div>
                {text.is_verified && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    Verified
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-3 text-sm text-gray-500">
                <span className="rounded bg-gray-100 px-2 py-0.5">
                  {text.language === "sa" ? "Sanskrit" : text.language === "hi" ? "Hindi" : text.language}
                </span>
                {text.source && <span>{text.source}</span>}
              </div>
              <button
                onClick={() => setExpanded(expanded === text.id ? null : text.id)}
                className="mt-4 flex items-center gap-2 text-sm text-sansi-700 hover:underline"
              >
                <BookOpen className="h-4 w-4" />
                {expanded === text.id ? "Hide text" : "Read text"}
              </button>
              {expanded === text.id && text.content && (
                <div className="mt-3 rounded-lg bg-gray-50 p-4">
                  <p className="whitespace-pre-line font-sanskrit text-lg text-gray-900 leading-relaxed">
                    {text.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
