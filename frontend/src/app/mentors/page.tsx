import { Star, Video, Heart } from "lucide-react"

const mentors = [
  {
    id: 1,
    name: "Dr. Ananya Sharma",
    headline: "Sanskrit Scholar & Vyākaraṇa Expert",
    rating: 4.9,
    thanks: 47,
    sessions: 120,
    languages: ["sa", "hi", "en"],
    specializations: ["grammar", "vedic"],
    badge: "expert",
  },
  {
    id: 2,
    name: "Prof. Vikram Joshi",
    headline: "Hindi Literature & Conversation Coach",
    rating: 4.7,
    thanks: 32,
    sessions: 85,
    languages: ["hi", "en"],
    specializations: ["conversation", "literature"],
    badge: "rising",
  },
  {
    id: 3,
    name: "Acharya Ravi Shastri",
    headline: "Traditional Sanskrit Guru — 15+ years volunteering",
    rating: 5.0,
    thanks: 28,
    sessions: 64,
    languages: ["sa", "hi"],
    specializations: ["grammar", "vedic", "philosophy"],
    badge: "expert",
  },
]

const badgeStyles: Record<string, string> = {
  expert: "bg-yellow-100 text-yellow-700",
  rising: "bg-blue-100 text-blue-700",
  new: "bg-green-100 text-green-700",
}

export default function MentorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Community Mentors</h1>
          <p className="mt-1 text-gray-600">
            Volunteer mentors sharing their knowledge — all sessions are free
          </p>
        </div>
        <button className="rounded-lg bg-sansi-600 px-4 py-2 text-white hover:bg-sansi-700">
          Become a Mentor
        </button>
      </div>

      <div className="flex gap-2">
        <button className="rounded-full bg-sansi-100 px-4 py-1 text-sm text-sansi-800">
          All Mentors
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 hover:bg-gray-200">
          Grammar
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 hover:bg-gray-200">
          Conversation
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 hover:bg-gray-200">
          Vedic
        </button>
      </div>

      <div className="space-y-4">
        {mentors.map((mentor) => (
          <div
            key={mentor.id}
            className="flex items-start gap-6 rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sansi-100 text-2xl font-bold text-sansi-700">
              {mentor.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
                  <p className="text-sm text-gray-500">{mentor.headline}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-medium capitalize ${
                    badgeStyles[mentor.badge]
                  }`}
                >
                  {mentor.badge}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <span className="flex items-center gap-1 text-sm text-yellow-600">
                  <Star className="h-4 w-4 fill-current" />
                  {mentor.rating} ({mentor.thanks} thanks)
                </span>
                <span className="flex items-center gap-1 text-sm text-red-500">
                  <Heart className="h-4 w-4 fill-current" />
                  {mentor.sessions} free sessions
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Video className="h-4 w-4" />
                  Available
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                {mentor.languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {lang === "sa" ? "Sanskrit" : lang === "hi" ? "Hindi" : "English"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
