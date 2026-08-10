"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"

interface Contributor {
  rank: number
  user_id: string
  username: string
  display_name: string
  score: { total_points: number; texts_uploaded: number; annotations_made: number; lessons_completed: number }
}

interface MentorRow {
  rank: number
  user_id: string
  headline: string
  rating: number
  thanks_count: number
  total_sessions: number
  badge: string
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"contributors" | "mentors">("contributors")
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [mentors, setMentors] = useState<MentorRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, m] = await Promise.all([
        api.get<Contributor[]>("/leaderboard/contributors?limit=20"),
        api.get<MentorRow[]>("/leaderboard/mentors?limit=20"),
      ])
      setContributors(c || [])
      setMentors(m || [])
    } catch {
      setContributors([])
      setMentors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Leaderboard</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("contributors")}
          className={`rounded-full px-4 py-1 text-sm ${
            tab === "contributors"
              ? "bg-sansi-100 text-sansi-800"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Contributors
        </button>
        <button
          onClick={() => setTab("mentors")}
          className={`rounded-full px-4 py-1 text-sm ${
            tab === "mentors"
              ? "bg-sansi-100 text-sansi-800"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Mentors
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading leaderboard...</p>
      ) : tab === "contributors" ? (
        contributors.length === 0 ? (
          <p className="text-gray-500">No contributors yet.</p>
        ) : (
          <div className="space-y-2">
            {contributors.map((c) => (
              <div
                key={c.user_id}
                className={`flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm ${
                  c.rank <= 3 ? "border-sansi-200 bg-sansi-50" : ""
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
                    c.rank === 1
                      ? "bg-yellow-100 text-yellow-700"
                      : c.rank === 2
                        ? "bg-gray-200 text-gray-700"
                        : c.rank === 3
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.rank}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {c.display_name || c.username || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.score.texts_uploaded} texts · {c.score.annotations_made} annotations ·{" "}
                    {c.score.lessons_completed} lessons
                  </p>
                </div>
                <span className="text-lg font-bold text-sansi-600">
                  {c.score.total_points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )
      ) : mentors.length === 0 ? (
        <p className="text-gray-500">No mentors yet.</p>
      ) : (
        <div className="space-y-2">
          {mentors.map((m) => (
            <div
              key={m.user_id}
              className={`flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm ${
                m.rank <= 3 ? "border-sansi-200 bg-sansi-50" : ""
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
                  m.rank === 1
                    ? "bg-yellow-100 text-yellow-700"
                    : m.rank === 2
                      ? "bg-gray-200 text-gray-700"
                      : m.rank === 3
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-500"
                }`}
              >
                {m.rank}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{m.headline || "Mentor"}</p>
                <p className="text-xs text-gray-500">
                  ⭐ {m.rating} · {m.thanks_count} thanks · {m.total_sessions} sessions
                </p>
              </div>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs capitalize text-purple-700">
                {m.badge}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
