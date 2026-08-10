"use client"

interface OnScreenKeyboardProps {
  lang: "devanagari" | "english"
  onKey: (char: string) => void
  onBackspace: () => void
  onSpace: () => void
}

const DEVANAGARI_ROWS: string[][] = [
  ["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ए", "ऐ", "ओ", "औ"],
  ["क", "ख", "ग", "घ", "ङ", "च", "छ", "ज", "झ", "ञ"],
  ["ट", "ठ", "ड", "ढ", "ण", "त", "थ", "द", "ध", "न"],
  ["प", "फ", "ब", "भ", "म", "य", "र", "ल", "व", "श", "ष", "स", "ह"],
  ["ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ", "ं", "ः", "ँ", "्"],
]

const ENGLISH_ROWS: string[][] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m", ".", ",", "?"],
]

export function OnScreenKeyboard({
  lang,
  onKey,
  onBackspace,
  onSpace,
}: OnScreenKeyboardProps) {
  const rows = lang === "devanagari" ? DEVANAGARI_ROWS : ENGLISH_ROWS

  return (
    <div className="w-full select-none rounded-xl border border-gray-200 bg-gray-50 p-2">
      {rows.map((row, r) => (
        <div key={r} className="mb-1 flex gap-1 last:mb-0">
          {row.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onKey(key)}
              className="min-w-0 flex-1 rounded-md bg-white px-1 py-2 text-base font-sanskrit text-gray-800 shadow-sm transition hover:bg-sansi-50 active:bg-sansi-100"
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      <div className="mt-1 flex gap-1">
        <button
          type="button"
          onClick={onSpace}
          className="flex-[3] rounded-md bg-white px-1 py-2 text-sm text-gray-600 shadow-sm transition hover:bg-sansi-50 active:bg-sansi-100"
        >
          Space
        </button>
        <button
          type="button"
          onClick={onBackspace}
          className="flex-1 rounded-md bg-white px-1 py-2 text-sm text-gray-600 shadow-sm transition hover:bg-sansi-50 active:bg-sansi-100"
        >
          Backspace
        </button>
      </div>
    </div>
  )
}
