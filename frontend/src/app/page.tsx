import Link from "next/link"
import { BookOpen, MessageCircle, Globe, Users } from "lucide-react"

const features = [
  {
    title: "Interactive Tutor",
    description: "AI-powered chatbot for grammar, translation, and exercises in Sanskrit & Hindi",
    icon: MessageCircle,
    href: "/tutor",
  },
  {
    title: "Open Corpus",
    description: "Shared library of Sanskrit/Hindi texts with annotations and transliteration",
    icon: BookOpen,
    href: "/corpus",
  },
  {
    title: "Learning Hub",
    description: "Courses, flashcards, quizzes, and practice tests for all levels",
    icon: Globe,
    href: "/courses",
  },
  {
    title: "Community",
    description: "Collaborate, discuss, and vote on the best explanations and resources",
    icon: Users,
    href: "/community",
  },
]

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          संस्कृतम् हिन्दी च{" "}
          <span className="bg-gradient-to-r from-sansi-600 to-sansi-400 bg-clip-text text-transparent">
            Learn Together
          </span>
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Open collaborative platform for Sanskrit and Hindi — learn, contribute, and preserve.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-sansi-600 px-6 py-3 text-white hover:bg-sansi-700"
          >
            Get Started
          </Link>
          <Link
            href="/corpus"
            className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            Explore Corpus
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
