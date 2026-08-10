"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api } from "@/lib/api"

interface User {
  id: string
  username: string
  display_name: string
  role: string
  score_points: number
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        if (localStorage.getItem("guest") === "true") {
          setIsGuest(true)
          setUser(null)
          return
        }
        const me = await api.get<User>("/auth/me")
        setUser(me)
      } catch {
        setIsGuest(true)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {user ? `Welcome back, ${user.display_name || user.username}!` : "Guest Dashboard"}
      </h1>
      {isGuest ? (
        <div className="rounded-xl border border-sansi-200 bg-sansi-50 p-6">
          <p className="text-gray-700">
            You are browsing as a <strong>guest</strong>. Everything here is free — explore
            courses, use the tutor, and take tests.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-sansi-600 px-5 py-2 text-sm text-white hover:bg-sansi-700"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Register Free
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Great to see you back!</p>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Points</h3>
          <p className="mt-2 text-3xl font-bold text-sansi-600">{user?.score_points ?? "—"}</p>
          <p className="text-sm text-gray-500">
            {user ? "From contributions & tests" : "Sign in to track your progress"}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Role</h3>
          <p className="mt-2 text-3xl font-bold text-sansi-600 capitalize">{user?.role ?? "Guest"}</p>
          <p className="text-sm text-gray-500">On the platform</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Free Forever</h3>
          <p className="mt-2 text-3xl font-bold text-sansi-600">🌿</p>
          <p className="text-sm text-gray-500">Always open, no paywalls</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/courses"
          className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold">Continue Learning</h3>
          <p className="mt-1 text-sm text-gray-600">
            47 courses with lessons, flashcards, and tests — pick one and start now.
          </p>
        </Link>
        <Link
          href="/tutor"
          className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold">AI Tutor</h3>
          <p className="mt-1 text-sm text-gray-600">
            Ask the free AI tutor anything about Sanskrit or Hindi — no login needed.
          </p>
        </Link>
      </div>
    </div>
  )
}
