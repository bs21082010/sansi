export interface User {
  id: string
  email: string
  username: string
  display_name: string
  bio: string
  avatar_url: string
  is_tutor: boolean
  role: string
  created_at: string
}

export interface CorpusText {
  id: string
  title: string
  title_iast: string
  content: string
  content_iast: string
  language: string
  source: string
  tags: string[]
  is_verified: boolean
  version: number
  uploaded_by: string
  created_at: string
}

export interface Course {
  id: string
  title: string
  description: string
  language: string
  level: string
  created_by: string
  is_published: boolean
  created_at: string
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  content: string
  order: number
  lesson_type: string
  created_at: string
}

export interface CommunityPost {
  id: string
  title: string
  content: string
  post_type: string
  author_id: string
  votes: number
  tags: string[]
  created_at: string
}

export interface TutorMessage {
  role: "user" | "assistant"
  content: string
}
