"use client"

import { useState, useEffect, useCallback } from "react"
import { Star, Heart, Video, X } from "lucide-react"
import { api } from "@/lib/api"

interface Mentor {
  id: string
  user_id: string
  username: string
  display_name: string
  headline: string
  bio: string
  languages: string[]
  specializations: string[]
  total_sessions: number
  rating: number
  thanks_count: number
  badge: string
}

const badgeStyles: Record<string, string> = {
  expert: "bg-yellow-100 text-yellow-700",
  rising: "bg-blue-100 text-blue-700",
  new: "bg-green-100 text-green-700",
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [specialization, setSpecialization] = useState("all")
  const [showRegister, setShowRegister] = useState(false)
  const [headline, setHeadline] = useState("")
  const [bio, setBio] = useState("")
  const [langs, setLangs] = useState("sa,hi,en")
  const [specs, setSpecs] = useState("grammar")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = specialization !== "all" ? `?specialization=${specialization}` : ""
      const data = await api.get<Mentor[]>(`/community/mentors${qs}`)
      setMentors(data || [])
    } catch {
      setMentors([])
    } finally {
      setLoading(false)
    }
  }, [specialization])

  useEffect(() => {
    load()
  }, [load])

  const register = async () => {
    if (!headline.trim()) return
    setSubmitting(true)
    setMessage("")
    try {
      const qs = new URLSearchParams({
        headline,
        bio,
        languages: langs,
        specializations: specs,
      }).toString()
      await api.post<{ registered: boolean }>(`/community/mentors/register?${qs}`, {})
      setShowRegister(false)
      setMessage("Registered as mentor!")
      setTimeout(() => setMessage(""), 3000)
      load()
    } catch {
      setMessage("Please log in as a contributor to register")
      setTimeout(() => setMessage(""), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const specializations = ["all", "grammar", "conversation", "vedic", "literature", "philosophy"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Community Mentors</h1>
          <p className="mt-1 text-gray-600">
            Volunteer mentors sharing their knowledge — all sessions are free
          </p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="rounded-lg bg-sansi-600 px-4 py-2 text-white hover:bg-sansi-700"
        >
          Become a Mentor
        </button>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>
      )}

      <div className="flex flex-wrap gap-2">
        {specializations.map((s) => (
          <button
            key={s}
            onClick={() => setSpecialization(s)}
            className={`rounded-full px-4 py-1 text-sm capitalize ${
              specialization === s
                ? "bg-sansi-100 text-sansi-800"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? "All Mentors" : s}
          </button>
        ))}
      </div>

      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Become a Mentor</h2>
              <button onClick={() => setShowRegister(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Headline (e.g. Sanskrit Grammar Expert)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short bio"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={langs}
                onChange={(e) => setLangs(e.target.value)}
                placeholder="Languages (comma separated: sa,hi,en)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder="Specializations (comma separated: grammar,vedic)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                onClick={register}
                disabled={submitting || !headline.trim()}
                className="w-full rounded-lg bg-sansi-600 py-2 text-white hover:bg-sansi-700 disabled:opacity-50"
              >
                {submitting ? "Registering..." : "Register"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading mentors...</p>
      ) : mentors.length === 0 ? (
        <p className="text-gray-500">No mentors found.</p>
      ) : (
        <div className="space-y-4">
          {mentors.map((mentor) => (
            <div
              key={mentor.id || mentor.user_id}
              className="flex items-start gap-6 rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sansi-100 text-2xl font-bold text-sansi-700">
                {(mentor.display_name || mentor.username || "M").charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {mentor.display_name || mentor.username || "Mentor"}
                    </h3>
                    <p className="text-sm text-gray-500">{mentor.headline}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-medium capitalize ${
                      badgeStyles[mentor.badge] || badgeStyles.new
                    }`}
                  >
                    {mentor.badge}
                  </span>
                </div>
                {mentor.bio && <p className="mt-2 text-sm text-gray-600">{mentor.bio}</p>}
                <div className="mt-3 flex items-center gap-4">
                  <span className="flex items-center gap-1 text-sm text-yellow-600">
                    <Star className="h-4 w-4 fill-current" />
                    {mentor.rating} ({mentor.thanks_count} thanks)
                  </span>
                  <span className="flex items-center gap-1 text-sm text-red-500">
                    <Heart className="h-4 w-4 fill-current" />
                    {mentor.total_sessions} free sessions
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Video className="h-4 w-4" />
                    Available
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(mentor.languages || []).map((lang) => (
                    <span
                      key={lang}
                      className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {lang === "sa" ? "Sanskrit" : lang === "hi" ? "Hindi" : "English"}
                    </span>
                  ))}
                  {(mentor.specializations || []).map((s) => (
                    <span
                      key={s}
                      className="rounded bg-sansi-50 px-2 py-0.5 text-xs text-sansi-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
