"use client"

import { useState } from "react"
import { Send } from "lucide-react"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "नमस्ते! I am your Sanskrit & Hindi tutor. Ask me about grammar, translation, or anything related to the languages.",
    },
  ])
  const [input, setInput] = useState("")

  const sendMessage = () => {
    if (!input.trim()) return
    const userMsg: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    setTimeout(() => {
      const reply: Message = {
        role: "assistant",
        content: `I understand your question about "${input}". I'll help you learn this concept. (AI integration coming soon — this is a demo response.)`,
      }
      setMessages((prev) => [...prev, reply])
    }, 500)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col space-y-6">
      <h1 className="text-3xl font-bold">AI Tutor</h1>

      <div className="flex h-[500px] flex-col rounded-xl border bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-sansi-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a question in Sanskrit, Hindi, or English..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-sansi-500 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              className="rounded-lg bg-sansi-600 px-4 py-2 text-white hover:bg-sansi-700"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
