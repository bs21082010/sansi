"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { OnScreenKeyboard } from "./OnScreenKeyboard"

const DEVANAGARI_RANGE = /[\u0900-\u097F]/

type ScriptMode = "devanagari" | "iast"

interface TransliterationInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  showSuggestions?: boolean
}

const CONSONANTS: Record<string, string> = {
  k: "क", kh: "ख", g: "ग", gh: "घ", ṅ: "ङ",
  c: "च", ch: "छ", j: "ज", jh: "झ", ñ: "ञ",
  ṭ: "ट", ṭh: "ठ", ḍ: "ड", ḍh: "ढ", ṇ: "ण",
  t: "त", th: "थ", d: "द", dh: "ध", n: "न",
  p: "प", ph: "फ", b: "ब", bh: "भ", m: "म",
  y: "य", r: "र", l: "ल", v: "व", ś: "श",
  ṣ: "ष", s: "स", h: "ह",
}

const VOWELS: Record<string, string> = {
  a: "अ", ā: "आ", i: "इ", ī: "ई", u: "उ", ū: "ऊ",
  ṛ: "ऋ", e: "ए", ai: "ऐ", o: "ओ", au: "औ",
}

const VOWEL_MATRAS: Record<string, string> = {
  ā: "ा", i: "ि", ī: "ी", u: "ु", ū: "ू",
  ṛ: "ृ", e: "े", ai: "ै", o: "ो", au: "ौ",
}

const CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length)
const VOWEL_KEYS = Object.keys(VOWELS).sort((a, b) => b.length - a.length)

const NO_ANUSVARA_FOLLOW = new Set(["y", "r", "l", "v", "m", "n", "ñ", "ṅ", "ṇ"])

function vowelAt(text: string, pos: number): string | null {
  const rest = text.slice(pos)
  for (const key of VOWEL_KEYS) {
    if (rest.startsWith(key)) return key
  }
  return null
}

function consonantAt(text: string, pos: number): string | null {
  const rest = text.slice(pos)
  for (const key of CONSONANT_KEYS) {
    if (rest.startsWith(key)) return key
  }
  return null
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
  const [showKeyboard, setShowKeyboard] = useState(false)
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
    const input = text.toLowerCase().replace(/sh/g, "ś")
    let result = ""
    let i = 0
    while (i < input.length) {
      if (input[i] === "ḥ") {
        result += "ः"
        i++
        continue
      }
      if (input[i] === "ṃ") {
        result += "ं"
        i++
        continue
      }
      const rest = input.slice(i)
      let consonant: string | null = null
      for (const key of CONSONANT_KEYS) {
        if (rest.startsWith(key)) {
          consonant = key
          break
        }
      }
      if (consonant) {
        const next = vowelAt(input, i + consonant.length)
        if (next === "a") {
          result += CONSONANTS[consonant]
          i += consonant.length + 1
        } else if (next) {
          result += CONSONANTS[consonant] + VOWEL_MATRAS[next]
          i += consonant.length + next.length
        } else {
          const nextConsonant = consonantAt(input, i + consonant.length)
          if (nextConsonant === null) {
            result += consonant === "h" ? "ः" : CONSONANTS[consonant] + "्"
          } else if (
            (consonant === "m" || consonant === "n") &&
            !NO_ANUSVARA_FOLLOW.has(nextConsonant)
          ) {
            result += "ं"
          } else {
            result += CONSONANTS[consonant] + "्"
          }
          i += consonant.length
        }
        continue
      }
      const vowel = vowelAt(input, i)
      if (vowel) {
        result += VOWELS[vowel]
        i += vowel.length
        continue
      }
      result += input[i]
      i++
    }
    return result
  }, [])

  const commitValue = useCallback(
    (raw: string) => {
      const next =
        mode === "iast" && !DEVANAGARI_RANGE.test(raw)
          ? convertToDevanagari(raw)
          : raw
      onChange(next)
      return next
    },
    [mode, convertToDevanagari, onChange]
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value
    commitValue(raw)

    if (showSuggestions && mode === "iast") {
      setSuggestions(getPhoneticSuggestions(raw))
      setSelectedSuggestion(-1)
    }
  }

  const insertAtCursor = useCallback(
    (char: string) => {
      const el = inputRef.current
      const start = el?.selectionStart ?? value.length
      const end = el?.selectionEnd ?? value.length
      const next = commitValue(value.slice(0, start) + char + value.slice(end))
      requestAnimationFrame(() => {
        if (el) {
          el.focus()
          const pos = mode === "iast" ? next.length : start + char.length
          el.setSelectionRange(pos, pos)
        }
      })
    },
    [value, mode, commitValue]
  )

  const backspaceAtCursor = useCallback(() => {
    const el = inputRef.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    if (start === 0 && end === 0) return
    const from = end > start ? start : start - 1
    const next = commitValue(value.slice(0, from) + value.slice(end))
    requestAnimationFrame(() => {
      if (el) {
        el.focus()
        const pos = mode === "iast" ? next.length : from
        el.setSelectionRange(pos, pos)
      }
    })
  }, [value, mode, commitValue])

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
        <button
          type="button"
          onClick={() => setShowKeyboard((v) => !v)}
          className={`rounded px-3 py-1 text-xs ${
            showKeyboard
              ? "bg-sansi-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          कीबोर्ड
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
      {showKeyboard && (
        <OnScreenKeyboard
          lang={mode === "devanagari" ? "devanagari" : "english"}
          onKey={insertAtCursor}
          onBackspace={backspaceAtCursor}
          onSpace={() => insertAtCursor(" ")}
        />
      )}
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
