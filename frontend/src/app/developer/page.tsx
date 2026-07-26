"use client"

import { useState } from "react"
import { Copy, Key, BarChart3, Shield } from "lucide-react"

const demoApps = [
  { name: "My Sanskrit App", prefix: "sansi_a1b2c3", tier: "builder", requests: 8731 },
  { name: "Hindi Translator Bot", prefix: "sansi_d4e5f6", tier: "hobby", requests: 1452 },
]

const tiers = [
  {
    name: "Hobby",
    rate: "1,000 req/hr",
    desc: "Personal projects and experiments",
    color: "bg-green-100 text-green-700",
  },
  {
    name: "Builder",
    rate: "10,000 req/hr",
    desc: "Active apps and integrations",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Scale",
    rate: "100,000 req/hr",
    desc: "Production applications",
    color: "bg-purple-100 text-purple-700",
  },
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
        <div>
          <h1 className="text-3xl font-bold">Developer Portal</h1>
          <p className="mt-1 text-gray-600">
            Free & open API — build apps on top of Sanskrit & Hindi language tools
          </p>
        </div>
        <button className="rounded-lg bg-sansi-600 px-4 py-2 text-white hover:bg-sansi-700">
          Create New App
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <BarChart3 className="h-8 w-8 text-sansi-600" />
          <p className="mt-2 text-3xl font-bold">10,183</p>
          <p className="text-sm text-gray-500">Total API requests (all free)</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <Key className="h-8 w-8 text-sansi-600" />
          <p className="mt-2 text-3xl font-bold">2</p>
          <p className="text-sm text-gray-500">Active apps — no charge</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <Shield className="h-8 w-8 text-sansi-600" />
          <p className="mt-2 text-3xl font-bold text-green-600">100% Free</p>
          <p className="text-sm text-gray-500">No paywalls, no hidden fees</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.name} className="rounded-xl border bg-white p-4 shadow-sm text-center">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${t.color}`}>
              {t.name}
            </span>
            <p className="mt-2 text-2xl font-bold">{t.rate}</p>
            <p className="text-xs text-gray-500">{t.desc}</p>
            <p className="mt-1 text-sm font-medium text-green-600">₹0 — always free</p>
          </div>
        ))}
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
                {app.tier}
              </span>
              <p className="mt-1 text-sm text-gray-500">
                {app.requests.toLocaleString()} requests
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">API Reference — Open Access</h2>
        <p className="mt-2 text-sm text-gray-600">
          Every endpoint is free. No API key required for read-only access.
          Get a key for write operations and higher rate limits.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            { method: "GET", path: "/api/v1/corpus", desc: "Browse texts" },
            { method: "POST", path: "/api/v1/tutor/chat", desc: "AI tutor" },
            { method: "GET", path: "/api/v1/morph/parse", desc: "Parse word" },
            { method: "GET", path: "/api/v1/translate/pairs", desc: "Translation pairs" },
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
