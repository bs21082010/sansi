import { MessageSquare, ArrowUp, ArrowDown } from "lucide-react"

const posts = [
  {
    id: 1,
    title: "Best resources for learning Sanskrit grammar?",
    author: "sanskrit_lover",
    votes: 12,
    comments: 8,
    type: "question",
  },
  {
    id: 2,
    title: "Free PDF: Complete Ashtadhyayi with commentary",
    author: "vyasa_contributor",
    votes: 24,
    comments: 5,
    type: "resource",
  },
  {
    id: 3,
    title: "How do you practice verb conjugation daily?",
    author: "hindi_learner",
    votes: 7,
    comments: 15,
    type: "discussion",
  },
]

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Community</h1>
        <button className="rounded-lg bg-sansi-600 px-4 py-2 text-white hover:bg-sansi-700">
          New Post
        </button>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex items-start gap-4 rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-col items-center gap-1">
              <button className="text-gray-400 hover:text-sansi-600">
                <ArrowUp className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-700">{post.votes}</span>
              <button className="text-gray-400 hover:text-red-500">
                <ArrowDown className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs capitalize">
                  {post.type}
                </span>
                <span>by {post.author}</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {post.comments} comments
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
