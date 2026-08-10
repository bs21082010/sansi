import Link from "next/link"
import { BookOpen, MessageCircle, Globe, Users } from "lucide-react"

const features = [
  {
    title: "Interactive Tutor",
    description: "AI-powered chatbot for grammar, translation, and exercises — completely free",
    icon: MessageCircle,
    href: "/tutor",
  },
  {
    title: "Open Corpus",
    description: "Classical Sanskrit + modern Hindi texts, freely accessible with community annotations",
    icon: BookOpen,
    href: "/corpus",
  },
  {
    title: "Community Learning",
    description: "Flashcards, tests, forkable lessons — no barriers, always open",
    icon: Globe,
    href: "/courses",
  },
  {
    title: "Open API",
    description: "Build apps on top of our corpus, parser, and tutor engine — free for everyone",
    icon: Users,
    href: "/developer",
  },
]

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center">
        <span className="inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
          🌿 100% Free — Always
        </span>
        <h1 className="mt-4 text-5xl font-bold tracking-tight text-gray-900">
          संस्कृतम् हिन्दी च{" "}
          <span className="bg-gradient-to-r from-sansi-600 to-sansi-400 bg-clip-text text-transparent">
            Open for All
          </span>
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Free collaborative platform for Sanskrit and Hindi. No paywalls, no subscriptions.
          Built by the community, for the community.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-sansi-600 px-6 py-3 text-white hover:bg-sansi-700"
          >
            Start Learning Free
          </Link>
          <Link
            href="/tutor"
            className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            Try Tutor as Guest
          </Link>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Link
            key={f.title}
            href={f.href}
            className="group rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <f.icon className="h-8 w-8 text-sansi-600" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{f.description}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
