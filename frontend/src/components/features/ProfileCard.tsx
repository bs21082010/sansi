"use client"

import { Award, BookOpen, MessageSquare, Star } from "lucide-react"

interface ProfileCardProps {
  username: string
  displayName: string
  bio: string
  role: string
  score: {
    total_points: number
    texts_uploaded: number
    annotations_made: number
    lessons_completed: number
  }
}

export function ProfileCard({ username, displayName, bio, role, score }: ProfileCardProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sansi-100 text-2xl font-bold text-sansi-700">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
          <p className="text-sm text-gray-500">@{username}</p>
          <span className="mt-1 inline-block rounded-full bg-sansi-100 px-3 py-0.5 text-xs font-medium capitalize text-sansi-700">
            {role}
          </span>
        </div>
      </div>

      {bio && <p className="mt-4 text-sm text-gray-600">{bio}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-lg font-bold text-gray-900">{score.total_points}</p>
            <p className="text-xs text-gray-500">Points</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-sansi-600" />
          <div>
            <p className="text-lg font-bold text-gray-900">{score.lessons_completed}</p>
            <p className="text-xs text-gray-500">Lessons</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-lg font-bold text-gray-900">{score.texts_uploaded}</p>
            <p className="text-xs text-gray-500">Texts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-lg font-bold text-gray-900">{score.annotations_made}</p>
            <p className="text-xs text-gray-500">Annotations</p>
          </div>
        </div>
      </div>
    </div>
  )
}
