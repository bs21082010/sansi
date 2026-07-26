"use client"

import { useState } from "react"
import { Copy, Key, BarChart3 } from "lucide-react"

const demoApps = [
  { name: "My Sanskrit App", prefix: "sansi_a1b2c3", plan: "free", requests: 1452 },
  { name: "Hindi Translator Bot", prefix: "sansi_d4e5f6", plan: "basic", requests: 8731 },
]

export default function DeveloperPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyKey = (prefix: string) => {
    setCopied(prefix)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Developer Portal</h1>
        <button className="rounded-lg bg-sansi-600 px-4 py-2 text-white hover:bg-sansi-700">
          Create New App
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <BarChart3 className="h-8 w-8 text-sansi-600" />
          <p className="mt-2 text-3xl font-bold">10,183</p>
          <p className="text-sm text-gray-500">Total API requests</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <Key className="h-8 w-8 text-sansi-600" />
          <p className="mt-2 text-3xl font-bold">2</p>
          <p className="text-sm text-gray-500">Active apps</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-2xl font-bold text-sansi-600">Free</p>
          <p className="text-sm text-gray-500">Current rate plan</p>
          <button className="mt-2 text-sm text-sansi-600 hover:underline">
            Upgrade →
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Apps</h2>
        {demoApps.map((app) => (
          <div
            key={app.name}
            className="flex items-center justify-between rounded-xl border bg-white p-6 shadow-sm"
          >
            <div>
              <h3 className="font-semibold text-gray-900">{app.name}</h3>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {app.prefix}...
                </code>
                <button
                  onClick={() => copyKey(app.prefix)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {copied === app.prefix && (
                  <span className="text-xs text-green-600">Copied!</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="rounded-full bg-sansi-100 px-3 py-1 text-xs font-medium capitalize text-sansi-700">
                {app.plan}
              </span>
              <p className="mt-1 text-sm text-gray-500">
                {app.requests.toLocaleString()} requests
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">API Reference</h2>
        <p className="mt-2 text-sm text-gray-600">
          Integrate Sanskrit & Hindi language capabilities into your apps.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            { method: "GET", path: "/api/v1/corpus", desc: "List texts" },
            { method: "POST", path: "/api/v1/tutor/chat", desc: "AI tutor" },
            { method: "GET", path: "/api/v1/courses", desc: "List courses" },
            { method: "POST", path: "/api/v1/morph/parse", desc: "Parse word" },
            { method: "GET", path: "/api/v1/translate/pairs", desc: "Translation pairs" },
            { method: "POST", path: "/api/v1/developer/apps", desc: "Create app" },
          ].map((ep) => (
            <div
              key={ep.path}
              className="flex items-center gap-3 rounded-lg border bg-gray-50 px-4 py-3"
            >
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${
                  ep.method === "GET"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {ep.method}
              </span>
              <code className="flex-1 text-xs text-gray-700">{ep.path}</code>
              <span className="text-xs text-gray-500">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
