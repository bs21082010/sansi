const challenges = [
  {
    id: 1,
    title: "संस्कृत सप्ताह",
    season: "Spring",
    description: "Add 5 Sanskrit texts to the corpus this week",
    goal: 5,
    points: 500,
    badge: "Spring Scholar",
    ends: "2026-08-07",
    progress: 3,
  },
  {
    id: 2,
    title: "Annotation Warrior",
    description: "Annotate 20 verses with grammar notes",
    goal: 20,
    points: 1000,
    badge: "Vyakarana Expert",
    ends: "2026-09-01",
    progress: 12,
  },
  {
    id: 3,
    title: "Translation Master",
    description: "Submit 10 Hindi→English translation pairs",
    goal: 10,
    points: 750,
    badge: "Translator",
    ends: "2026-08-15",
    progress: 7,
  },
  {
    id: 4,
    title: "Streak Keeper",
    description: "Maintain a 7-day login streak",
    goal: 7,
    points: 300,
    badge: "Consistent",
    ends: "2026-08-30",
    progress: 4,
  },
]

export default function ChallengesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Challenges & Events</h1>
        <span className="rounded-full bg-sansi-100 px-4 py-1 text-sm text-sansi-700">
          Spring Season
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {challenges.map((c) => {
          const pct = Math.round((c.progress / c.goal) * 100)
          return (
            <div
              key={c.id}
              className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
                  {c.season && (
                    <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {c.season}
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold text-sansi-600">{c.points}pts</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{c.description}</p>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {c.progress}/{c.goal}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-sansi-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">Ends {c.ends}</span>
                {c.badge && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                    🏅 {c.badge}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
