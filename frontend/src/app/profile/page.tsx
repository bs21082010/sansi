import { Badges } from "@/components/features/Badges"
import { ProfileCard } from "@/components/features/ProfileCard"

const demoBadges = [
  { name: "First Upload", description: "Uploaded your first text to the corpus", icon: "book", category: "contribution" },
  { name: "Helping Hand", description: "Made 10 annotations on community texts", icon: "heart", category: "contribution" },
  { name: "Polyglot", description: "Completed 5 lessons", icon: "brain", category: "learning" },
]

const demoScore = {
  total_points: 340,
  texts_uploaded: 3,
  annotations_made: 12,
  lessons_completed: 5,
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold">Profile</h1>
      <ProfileCard
        username="sanskrit_lover"
        displayName="Arya Sharma"
        bio="Sanskrit enthusiast and contributor. Learning grammar and sharing texts."
        role="contributor"
        score={demoScore}
      />
      <section>
        <h2 className="mb-4 text-xl font-semibold">Badges</h2>
        <Badges badges={demoBadges} />
      </section>
    </div>
  )
}
