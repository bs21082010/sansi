"use client"

import { useState } from "react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="mx-auto max-w-md pt-16">
      <h1 className="text-3xl font-bold text-center">Sign In</h1>
      <p className="mt-2 text-center text-gray-600">
        Welcome back to Sansi
      </p>
      <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
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
          className="w-full rounded-lg bg-sansi-600 px-4 py-2 text-white hover:bg-sansi-700"
        >
          Sign In
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-sansi-600 hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
