"use client"

import { useState, useEffect, useCallback } from "react"
import { Trophy, Flame } from "lucide-react"
import { api } from "@/lib/api"

interface Challenge {
  id: string
  title: string
  description?: string
  season?: string
  is_seasonal: boolean
  goal: number
  points_reward: number
  badge_reward?: string
  ends_at?: string
  is_active: boolean
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Challenge[]>("/community/challenges?active_only=true")
      setChallenges(data || [])
    } catch {
      setChallenges([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const join = async (id: string) => {
    try {
      await api.post<{ joined: boolean }>(`/community/challenges/${id}/join`, {})
      setJoined((prev) => ({ ...prev, [id]: true }))
      setMessage("Joined the challenge!")
      setTimeout(() => setMessage(""), 3000)
    } catch {
      setMessage("Please log in to join challenges")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Challenges & Events</h1>
        <span className="rounded-full bg-sansi-100 px-4 py-1 text-sm text-sansi-700">
          <Flame className="mr-1 inline h-4 w-4" />
          {challenges.length} active
        </span>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading challenges...</p>
      ) : challenges.length === 0 ? (
        <p className="text-gray-500">No active challenges right now.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {challenges.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
                  {c.is_seasonal && c.season && (
                    <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {c.season}
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold text-sansi-600">
                  {c.points_reward}pts
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{c.description || "Complete the challenge to earn points and badges."}</p>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Goal: {c.goal}</span>
                  {c.badge_reward && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                      🏅 {c.badge_reward}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                {c.ends_at && (
                  <span className="text-xs text-gray-400">
                    Ends {new Date(c.ends_at).toLocaleDateString()}
                  </span>
                )}
                <button
                  onClick={() => join(c.id)}
                  disabled={joined[c.id]}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                    joined[c.id]
                      ? "bg-green-100 text-green-700"
                      : "bg-sansi-600 text-white hover:bg-sansi-700"
                  }`}
                >
                  <Trophy className="h-4 w-4" />
                  {joined[c.id] ? "Joined" : "Join"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
