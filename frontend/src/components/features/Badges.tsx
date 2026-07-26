interface Badge {
  name: string
  description: string
  icon: string
  category: string
}

const BADGE_ICONS: Record<string, string> = {
  award: "🏆",
  book: "📖",
  star: "⭐",
  heart: "❤️",
  brain: "🧠",
  fire: "🔥",
  pen: "✍️",
  chat: "💬",
  verified: "✅",
}

interface BadgesProps {
  badges: Badge[]
}

export function Badges({ badges }: BadgesProps) {
  if (badges.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-gray-50 p-6 text-center text-sm text-gray-500">
        Complete contributions to earn badges
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      {badges.map((badge) => (
        <div
          key={badge.name}
          className="group relative flex items-center gap-2 rounded-full bg-sansi-50 px-4 py-2 text-sm"
        >
          <span className="text-lg">
            {BADGE_ICONS[badge.icon] || BADGE_ICONS.award}
          </span>
          <span className="font-medium text-sansi-800">{badge.name}</span>
          <div className="pointer-events-none absolute -top-2 left-1/2 z-10 w-48 -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">
            {badge.description}
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      ))}
    </div>
  )
}
