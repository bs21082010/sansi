"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badges } from "@/components/features/Badges"
import { ProfileCard } from "@/components/features/ProfileCard"
import { api } from "@/lib/api"

interface User {
  id: string
  username: string
  display_name: string
  bio: string
  role: string
  score_points: number
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (localStorage.getItem("guest") === "true") {
          setIsGuest(true)
          return
        }
        const me = await api.get<User>("/auth/me")
        setUser(me)
      } catch {
        setIsGuest(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-gray-500">Loading profile...</p>
      </div>
    )
  }

  if (isGuest || !user) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <div className="rounded-xl border border-sansi-200 bg-sansi-50 p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sansi-100 text-2xl font-bold text-sansi-700">
            ?
          </div>
          <h2 className="mt-4 text-xl font-bold">Guest Profile</h2>
          <p className="mt-2 text-gray-600">
            You are browsing as a guest. Create a free account to earn points, badges, and track
            your learning progress.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-sansi-600 px-6 py-3 text-white hover:bg-sansi-700"
            >
              Register Free
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold">Profile</h1>
      <ProfileCard
        username={user.username}
        displayName={user.display_name || user.username}
        bio={user.bio}
        role={user.role}
        score={{
          total_points: user.score_points,
          texts_uploaded: 0,
          annotations_made: 0,
          lessons_completed: 0,
        }}
      />
      <section>
        <h2 className="mb-4 text-xl font-semibold">Badges</h2>
        <Badges badges={[]} />
      </section>
    </div>
  )
}
