"use client"

import { useState, useCallback } from "react"

const DEVANAGARI_RANGE = /[\u0900-\u097F]/

type ScriptMode = "devanagari" | "iast"

interface TransliterationInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const IAST_TO_DEVANAGARI: Record<string, string> = {
  a: "अ", ā: "आ", i: "इ", ī: "ई", u: "उ", ū: "ऊ",
  ṛ: "ऋ", e: "ए", ai: "ऐ", o: "ओ", au: "औ",
  ka: "क", kha: "ख", ga: "ग", gha: "घ", ṅa: "ङ",
  ca: "च", cha: "छ", ja: "ज", jha: "झ", ña: "ञ",
  ṭa: "ट", ṭha: "ठ", ḍa: "ड", ḍha: "ढ", ṇa: "ण",
  ta: "त", tha: "थ", da: "द", dha: "ध", na: "न",
  pa: "प", pha: "फ", ba: "ब", bha: "भ", ma: "म",
  ya: "य", ra: "र", la: "ल", va: "व", śa: "श",
  ṣa: "ष", sa: "स", ha: "ह",
}

export function TransliterationInput({
  value,
  onChange,
  placeholder = "Type here...",
  className = "",
}: TransliterationInputProps) {
  const [mode, setMode] = useState<ScriptMode>("devanagari")

  const convertToDevanagari = useCallback((text: string) => {
    let result = text.toLowerCase()
    for (const [iast, dev] of Object.entries(IAST_TO_DEVANAGARI)) {
      result = result.replace(new RegExp(iast, "g"), dev)
    }
    return result
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value
    if (mode === "iast" && !DEVANAGARI_RANGE.test(raw)) {
      onChange(convertToDevanagari(raw))
    } else {
      onChange(raw)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("devanagari")}
          className={`rounded px-3 py-1 text-xs ${
            mode === "devanagari"
              ? "bg-sansi-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          देवनागरी
        </button>
        <button
          type="button"
          onClick={() => setMode("iast")}
          className={`rounded px-3 py-1 text-xs ${
            mode === "iast"
              ? "bg-sansi-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          IAST
        </button>
      </div>
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="min-h-[120px] w-full rounded-lg border border-gray-300 p-4 font-sanskrit focus:border-sansi-500 focus:outline-none"
        dir={mode === "devanagari" || DEVANAGARI_RANGE.test(value) ? "ltr" : "ltr"}
      />
    </div>
  )
}
