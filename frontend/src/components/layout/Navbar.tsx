"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  BookOpen, GraduationCap, MessageCircle, Users, Globe,
  Zap, Award, Video, Trophy, Code, LogOut,
} from "lucide-react"

const links = [
  { href: "/corpus", label: "Corpus", icon: BookOpen },
  { href: "/tutor", label: "Tutor", icon: MessageCircle },
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/flashcards", label: "Flashcards", icon: Zap },
  { href: "/mentors", label: "Mentors", icon: Video },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/community", label: "Community", icon: Users },
  { href: "/leaderboard", label: "Leaderboard", icon: Award },
  { href: "/developer", label: "API", icon: Code },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isGuest, setIsGuest] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const update = () => {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        try {
          const u = JSON.parse(userStr)
          setUserName(u.display_name || u.username || null)
        } catch {
          setUserName(null)
        }
      } else {
        setUserName(null)
      }
      setIsGuest(localStorage.getItem("guest") === "true" && !localStorage.getItem("token"))
    }
    update()
    window.addEventListener("storage", update)
    return () => window.removeEventListener("storage", update)
  }, [pathname])

  const signOut = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("guest")
    setIsGuest(false)
    setUserName(null)
    router.push("/")
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Globe className="h-6 w-6 text-sansi-600" />
          Sansi
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-sansi-600"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {userName ? (
            <>
              <Link
                href="/profile"
                className="text-sm font-medium text-sansi-700 hover:text-sansi-800"
              >
                {userName}
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          ) : isGuest ? (
            <>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                Guest
              </span>
              <Link
                href="/login"
                className="rounded-lg bg-sansi-600 px-4 py-2 text-sm text-white hover:bg-sansi-700"
              >
                Sign In
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </nav>
  )
}