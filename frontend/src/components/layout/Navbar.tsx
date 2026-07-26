import Link from "next/link"
import {
  BookOpen, GraduationCap, MessageCircle, Users, Globe,
  Zap, Award, Video,
} from "lucide-react"

const links = [
  { href: "/corpus", label: "Corpus", icon: BookOpen },
  { href: "/tutor", label: "Tutor", icon: MessageCircle },
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/flashcards", label: "Flashcards", icon: Zap },
  { href: "/tutors", label: "Tutors", icon: Video },
  { href: "/community", label: "Community", icon: Users },
  { href: "/leaderboard", label: "Leaderboard", icon: Award },
]

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Globe className="h-6 w-6 text-sansi-600" />
          Sansi
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-sansi-600"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-sansi-600 px-4 py-2 text-sm text-white hover:bg-sansi-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}
