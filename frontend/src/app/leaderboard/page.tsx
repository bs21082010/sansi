const contributors = [
  { rank: 1, name: "Vyasa_Contributor", points: 2450, texts: 12, annotations: 48 },
  { rank: 2, name: "Sanskrit_Scholar", points: 1820, texts: 8, annotations: 35 },
  { rank: 3, name: "GrammarGuru", points: 1560, texts: 6, annotations: 52 },
  { rank: 4, name: "HindiLearner99", points: 920, texts: 3, annotations: 18 },
  { rank: 5, name: "VedaReader", points: 780, texts: 5, annotations: 22 },
]

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Leaderboard</h1>

      <div className="flex gap-2">
        <button className="rounded-full bg-sansi-100 px-4 py-1 text-sm text-sansi-800">
          Contributors
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 hover:bg-gray-200">
          Mentors
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 hover:bg-gray-200">
          Streaks
        </button>
      </div>

      <div className="space-y-2">
        {contributors.map((c) => (
          <div
            key={c.rank}
            className={`flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm ${
              c.rank <= 3 ? "border-sansi-200 bg-sansi-50" : ""
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
                c.rank === 1
                  ? "bg-yellow-100 text-yellow-700"
                  : c.rank === 2
                    ? "bg-gray-200 text-gray-700"
                    : c.rank === 3
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-500"
              }`}
            >
              {c.rank}
            </span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{c.name}</p>
              <p className="text-xs text-gray-500">
                {c.texts} texts · {c.annotations} annotations
              </p>
            </div>
            <span className="text-lg font-bold text-sansi-600">
              {c.points.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
