import { Star, Video, IndianRupee } from "lucide-react"

const tutors = [
  {
    id: 1,
    name: "Dr. Ananya Sharma",
    headline: "Sanskrit Scholar & Vyākaraṇa Expert",
    rating: 4.9,
    reviews: 47,
    hourly_rate: 500,
    languages: ["sa", "hi", "en"],
    specializations: ["grammar", "vedic"],
    badge: "top",
  },
  {
    id: 2,
    name: "Prof. Vikram Joshi",
    headline: "Hindi Literature & Conversation Coach",
    rating: 4.7,
    reviews: 32,
    hourly_rate: 350,
    languages: ["hi", "en"],
    specializations: ["conversation", "literature"],
    badge: "rising",
  },
  {
    id: 3,
    name: "Acharya Ravi Shastri",
    headline: "Traditional Sanskrit Guru (15+ yrs)",
    rating: 5.0,
    reviews: 28,
    hourly_rate: 800,
    languages: ["sa", "hi"],
    specializations: ["grammar", "vedic", "philosophy"],
    badge: "expert",
  },
]

const badgeStyles: Record<string, string> = {
  top: "bg-purple-100 text-purple-700",
  rising: "bg-blue-100 text-blue-700",
  expert: "bg-yellow-100 text-yellow-700",
  new: "bg-green-100 text-green-700",
}

export default function TutorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Find a Tutor</h1>
        <button className="rounded-lg bg-sansi-600 px-4 py-2 text-white hover:bg-sansi-700">
          Become a Tutor
        </button>
      </div>

      <div className="flex gap-2">
        <button className="rounded-full bg-sansi-100 px-4 py-1 text-sm text-sansi-800">
          All
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
        {tutors.map((tutor) => (
          <div
            key={tutor.id}
            className="flex items-start gap-6 rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sansi-100 text-2xl font-bold text-sansi-700">
              {tutor.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{tutor.name}</h3>
                  <p className="text-sm text-gray-500">{tutor.headline}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ₹{tutor.hourly_rate}
                  </p>
                  <p className="text-xs text-gray-500">per hour</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <span className="flex items-center gap-1 text-sm text-yellow-600">
                  <Star className="h-4 w-4 fill-current" />
                  {tutor.rating} ({tutor.reviews})
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Video className="h-4 w-4" />
                  Online
                </span>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-medium capitalize ${
                    badgeStyles[tutor.badge]
                  }`}
                >
                  {tutor.badge}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                {tutor.languages.map((lang) => (
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
