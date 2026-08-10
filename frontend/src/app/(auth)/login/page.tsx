"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api.post<{ access_token: string; user: any }>("/auth/login", {
        email, password,
      })
      localStorage.setItem("token", res.access_token)
      localStorage.setItem("user", JSON.stringify(res.user))
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const continueAsGuest = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.setItem("guest", "true")
    router.push("/dashboard")
  }

  return (
    <div className="mx-auto max-w-md pt-16">
      <h1 className="text-3xl font-bold text-center">Sign In</h1>
      <p className="mt-2 text-center text-gray-600">
        Welcome back to Sansi
      </p>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-sansi-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-sansi-500 focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sansi-600 px-4 py-2 text-white hover:bg-sansi-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <div className="mt-6 flex items-center gap-3">
        <hr className="flex-1 border-gray-300" />
        <span className="text-sm text-gray-500">or</span>
        <hr className="flex-1 border-gray-300" />
      </div>
      <button
        onClick={continueAsGuest}
        className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
      >
        Continue as Guest
      </button>
      <p className="mt-4 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-sansi-600 hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
