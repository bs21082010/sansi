"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageSquare, ArrowUp, ArrowDown, Plus, X } from "lucide-react"
import { api } from "@/lib/api"

interface Post {
  id: string
  title: string
  content?: string
  post_type: string
  author_id: string
  votes: number
  tags?: string[]
  created_at: string
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState("all")
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [postType, setPostType] = useState("question")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = type !== "all" ? `?post_type=${type}` : ""
      const res = await api.get<{ items: Post[]; total: number }>(`/community/posts${qs}`)
      setPosts(res.items || [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    load()
  }, [load])

  const vote = async (post: Post, delta: number) => {
    try {
      const res = await api.post<{ votes: number }>(`/community/posts/${post.id}/vote?delta=${delta}`, {})
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, votes: res.votes } : p))
      )
    } catch {
      setError("Please log in to vote")
      setTimeout(() => setError(""), 3000)
    }
  }

  const submitPost = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    setError("")
    try {
      await api.post<Post>("/community/posts", {
        title,
        content,
        post_type: postType,
        tags: [],
      })
      setShowNew(false)
      setTitle("")
      setContent("")
      load()
    } catch {
      setError("Please log in as a contributor to post")
      setTimeout(() => setError(""), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Community</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-lg bg-sansi-600 px-4 py-2 text-white hover:bg-sansi-700"
        >
          <Plus className="h-4 w-4" /> New Post
        </button>
      </div>

      <div className="flex gap-2">
        {["all", "question", "discussion", "resource"].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full px-4 py-1 text-sm capitalize ${
              type === t
                ? "bg-sansi-100 text-sansi-800"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">New Post</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="question">Question</option>
                <option value="discussion">Discussion</option>
                <option value="resource">Resource</option>
              </select>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Details (optional)"
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                onClick={submitPost}
                disabled={submitting || !title.trim()}
                className="w-full rounded-lg bg-sansi-600 py-2 text-white hover:bg-sansi-700 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500">No posts yet. Start the conversation!</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-start gap-4 rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => vote(post, 1)}
                  className="text-gray-400 hover:text-sansi-600"
                  aria-label="Upvote"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-gray-700">{post.votes}</span>
                <button
                  onClick={() => vote(post, -1)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label="Downvote"
                >
                  <ArrowDown className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                {post.content && <p className="mt-1 text-sm text-gray-600">{post.content}</p>}
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs capitalize">
                    {post.post_type}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
