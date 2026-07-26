import { Search } from "lucide-react"

const sampleTexts = [
  { id: 1, title: "भगवद्गीता", title_iast: "Bhagavad Gītā", language: "sa", source: "Mahābhārata" },
  { id: 2, title: "अभिज्ञानशाकुन्तलम्", title_iast: "Abhijñānaśākuntalam", language: "sa", source: "Kālidāsa" },
  { id: 3, title: "रामचरितमानस", title_iast: "Rāmacaritamānasa", language: "hi", source: "Tulasīdāsa" },
]

export default function CorpusPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Open Corpus</h1>
        <button className="rounded-lg bg-sansi-600 px-4 py-2 text-white hover:bg-sansi-700">
          Upload Text
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search texts in Sanskrit or Hindi..."
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-sansi-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button className="rounded-full bg-sansi-100 px-4 py-1 text-sm text-sansi-800">
          All
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 hover:bg-gray-200">
          Sanskrit
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 hover:bg-gray-200">
          Hindi
        </button>
      </div>

      <div className="space-y-4">
        {sampleTexts.map((text) => (
          <div
            key={text.id}
            className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h3 className="text-xl font-semibold text-gray-900">{text.title}</h3>
            <p className="text-sm text-gray-500 italic">{text.title_iast}</p>
            <div className="mt-2 flex gap-3 text-sm text-gray-500">
              <span className="rounded bg-gray-100 px-2 py-0.5">
                {text.language === "sa" ? "Sanskrit" : "Hindi"}
              </span>
              <span>{text.source}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
