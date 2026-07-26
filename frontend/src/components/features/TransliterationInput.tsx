"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"

const DEVANAGARI_RANGE = /[\u0900-\u097F]/

type ScriptMode = "devanagari" | "iast"

interface TransliterationInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  showSuggestions?: boolean
}

const IAST_MAP: Record<string, string> = {
  a: "अ", ā: "आ", i: "इ", ī: "ई", u: "उ", ū: "ऊ",
  ṛ: "ऋ", e: "ए", ai: "ऐ", o: "ओ", au: "औ",
  k: "क्", kh: "ख्", g: "ग्", gh: "घ्", ṅ: "ङ्",
  c: "च्", ch: "छ्", j: "ज्", jh: "झ्", ñ: "ञ्",
  ṭ: "ट्", ṭh: "ठ्", ḍ: "ड्", ḍh: "ढ्", ṇ: "ण्",
  t: "त्", th: "थ्", d: "द्", dh: "ध्", n: "न्",
  p: "प्", ph: "फ्", b: "ब्", bh: "भ्", m: "म्",
  y: "य्", r: "र्", l: "ल्", v: "व्", ś: "श्",
  ṣ: "ष्", s: "स्", h: "ह्",
}

const SUGGESTIONS: Record<string, string[]> = {
  a: ["अ", "आ", "इ"],
  ka: ["क", "का", "कि", "की", "कु", "के", "कै", "को", "कौ"],
  ga: ["ग", "गा", "गि"],
  ta: ["त", "ता", "ति", "ती", "तु", "ते", "तो"],
  na: ["न", "ना", "नि", "नी", "नु", "ने", "नो"],
  ma: ["म", "मा", "मि", "मी", "मु", "मे", "मो"],
  sa: ["स", "सा", "सि", "सी", "सु", "से", "सो"],
  ha: ["ह", "हा", "हि", "ही", "हु", "हे", "हो"],
  bh: ["भ", "भा", "भि", "भी", "भु", "भे", "भो"],
}

export function TransliterationInput({
  value,
  onChange,
  placeholder = "Type here...",
  className = "",
  showSuggestions = true,
}: TransliterationInputProps) {
  const [mode, setMode] = useState<ScriptMode>("devanagari")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const getPhoneticSuggestions = useCallback((text: string): string[] => {
    const lastWord = text.split(/[\s,.\n]+/).pop()?.toLowerCase() || ""
    if (!lastWord) return []

    const results: string[] = []
    for (const [key, vals] of Object.entries(SUGGESTIONS)) {
      if (key.startsWith(lastWord) && lastWord.length >= 1) {
        results.push(...vals)
      }
    }
    return results.slice(0, 5)
  }, [])

  const convertToDevanagari = useCallback((text: string) => {
    let result = text.toLowerCase()
    for (const [iast, dev] of Object.entries(IAST_MAP)) {
      result = result.replace(new RegExp(iast + "(?=[a-z]|$)", "g"), dev)
    }
    const finalMap: Record<string, string> = {
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
    for (const [iast, dev] of Object.entries(finalMap)) {
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

    if (showSuggestions && mode === "iast") {
      setSuggestions(getPhoneticSuggestions(raw))
      setSelectedSuggestion(-1)
    }
  }

  const applySuggestion = (suggestion: string) => {
    const parts = value.split(/[\s,.\n]+/)
    parts.pop()
    const newVal = parts.length > 0 ? parts.join(" ") + " " + suggestion : suggestion
    onChange(newVal + " ")
    setSuggestions([])
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedSuggestion((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Tab" || e.key === "Enter") {
      if (selectedSuggestion >= 0) {
        e.preventDefault()
        applySuggestion(suggestions[selectedSuggestion])
      }
    } else if (e.key === "Escape") {
      setSuggestions([])
    }
  }

  return (
    <div className={`relative space-y-2 ${className}`}>
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
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[120px] w-full rounded-lg border border-gray-300 p-4 font-sanskrit focus:border-sansi-500 focus:outline-none"
        dir="ltr"
      />
      {showSuggestions && suggestions.length > 0 && mode === "iast" && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => applySuggestion(s)}
              className={`w-full px-4 py-2 text-left text-lg font-sanskrit hover:bg-sansi-50 ${
                i === selectedSuggestion ? "bg-sansi-100" : ""
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
