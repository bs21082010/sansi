"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"
import * as THREE from "three"
import * as pdfjsLib from "pdfjs-dist"
import {
  X,
  Boxes,
  Settings2,
  RotateCcw,
  UploadCloud,
  FileText,
  Layers,
  Grid3X3,
  CircleDot,
  Orbit,
} from "lucide-react"

type PageData = {
  label: string
  texture: THREE.CanvasTexture
  aspect: number
}

type Layout = "stack" | "grid" | "circle" | "spiral"

type Settings = {
  layout: Layout
  spacing: number
  radius: number
  pageScale: number
  thickness: number
  bg: string
  tint: string
  wireframe: boolean
  showLabels: boolean
  autoRotate: boolean
  speed: number
  showGrid: boolean
}

const DEFAULT_SETTINGS: Settings = {
  layout: "spiral",
  spacing: 0.7,
  radius: 4,
  pageScale: 1,
  thickness: 2,
  bg: "#0b0f19",
  tint: "#94a3b8",
  wireframe: false,
  showLabels: true,
  autoRotate: true,
  speed: 0.06,
  showGrid: true,
}

const MAX_PAGES = 120

const BG_SWATCHES = ["#0b0f19", "#eef2f7", "#1e1b4b", "#2e1065", "#052e16", "#3f0d12"]
const TINT_SWATCHES = ["#94a3b8", "#fbbf24", "#34d399", "#f472b6", "#ffffff", "#60a5fa"]

// ---------------------------------------------------------------------------
// PDF / text -> canvas textures
// ---------------------------------------------------------------------------

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const test = line ? line + " " + w : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function renderTextPage(canvas: HTMLCanvasElement, text: string, label: string) {
  const ctx = canvas.getContext("2d")!
  const w = canvas.width
  const h = canvas.height
  ctx.fillStyle = "#faf6ec"
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = "#3f3a2e"
  ctx.font = "26px Georgia, 'Noto Serif', serif"
  const margin = 52
  const lines = wrapText(ctx, text, w - margin * 2)
  const maxLines = Math.floor((h - margin * 2 - 60) / 38)
  let y = margin + 30
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    ctx.fillText(lines[i], margin, y)
    y += 38
  }
  if (lines.length > maxLines) {
    ctx.fillText("…", margin, y)
  }
  ctx.fillStyle = "#b8a26a"
  ctx.font = "20px Georgia, serif"
  ctx.textAlign = "center"
  ctx.fillText(`— ${label} —`, w / 2, h - 30)
  ctx.textAlign = "left"
}

function makeTextPages(text: string): PageData[] {
  const chunks = text
    .split(/\n{2,}/)
    .map((c) => c.trim())
    .filter(Boolean)
  const pages = chunks.length > 1 ? chunks : [text.trim()]
  const out: PageData[] = []
  for (let i = 0; i < pages.length && i < MAX_PAGES; i++) {
    const canvas = document.createElement("canvas")
    canvas.width = 720
    canvas.height = 1000
    renderTextPage(canvas, pages[i], String(i + 1))
    out.push({
      label: String(i + 1),
      texture: new THREE.CanvasTexture(canvas),
      aspect: 720 / 1000,
    })
  }
  return out
}

async function makePdfPages(data: ArrayBuffer): Promise<PageData[]> {
  const doc = await pdfjsLib.getDocument({ data }).promise
  const count = Math.min(doc.numPages, MAX_PAGES)
  const out: PageData[] = []
  try {
    for (let i = 1; i <= count; i++) {
      const page = await doc.getPage(i)
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = document.createElement("canvas")
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext("2d")!
      await page.render({ canvasContext: ctx, viewport }).promise
      out.push({
        label: String(i),
        texture: new THREE.CanvasTexture(canvas),
        aspect: viewport.width / viewport.height,
      })
      try {
        page.cleanup()
      } catch {
        /* noop */
      }
    }
  } finally {
    await doc.destroy()
  }
  return out
}

// ---------------------------------------------------------------------------
// layout computation
// ---------------------------------------------------------------------------

function computeLayout(
  count: number,
  layout: Layout,
  spacing: number,
  radius: number
): { pos: [number, number, number]; rot: [number, number, number] }[] {
  const items: { pos: [number, number, number]; rot: [number, number, number] }[] = []
  const n = Math.max(count, 1)
  if (layout === "stack") {
    for (let i = 0; i < n; i++) {
      items.push({
        pos: [0, (i - (n - 1) / 2) * spacing, 0],
        rot: [0, i % 2 === 0 ? 0.05 : -0.05, 0],
      })
    }
  } else if (layout === "grid") {
    const cols = Math.max(2, Math.ceil(Math.sqrt(n)))
    const rows = Math.ceil(n / cols)
    for (let i = 0; i < n; i++) {
      const cx = i % cols
      const cy = Math.floor(i / cols)
      items.push({
        pos: [
          (cx - (cols - 1) / 2) * spacing * 1.7,
          (rows / 2 - cy - 0.5) * spacing * 1.2,
          0,
        ],
        rot: [0, 0, 0],
      })
    }
  } else if (layout === "circle") {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      items.push({
        pos: [Math.sin(a) * radius, 0, -Math.cos(a) * radius],
        rot: [0, Math.PI - a, 0],
      })
    }
  } else {
    // spiral
    const turns = 3
    for (let i = 0; i < n; i++) {
      const t = i / Math.max(n - 1, 1)
      const a = t * Math.PI * 2 * turns
      const rad = radius * (0.2 + 0.8 * t)
      items.push({
        pos: [Math.sin(a) * rad, (i - (n - 1) / 2) * spacing * 0.55, Math.cos(a) * rad],
        rot: [0, -a, 0],
      })
    }
  }
  return items
}

// ---------------------------------------------------------------------------
// 3D scene
// ---------------------------------------------------------------------------

function PageMesh({
  page,
  pos,
  rot,
  settings,
  selected,
  dimmed,
  onSelect,
}: {
  page: PageData
  pos: [number, number, number]
  rot: [number, number, number]
  settings: Settings
  selected: boolean
  dimmed: boolean
  onSelect: () => void
}) {
  const w = 1.5 * settings.pageScale * page.aspect
  const h = 1.5 * settings.pageScale
  return (
    <group position={pos} rotation={rot}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        scale={selected ? 1.18 : 1}
      >
        <planeGeometry args={[w, h]} />
        {settings.wireframe ? (
          <meshBasicMaterial color={settings.tint} wireframe transparent={dimmed} opacity={dimmed ? 0.3 : 1} />
        ) : (
          <meshBasicMaterial
            map={page.texture}
            transparent={dimmed}
            opacity={dimmed ? 0.35 : 1}
            toneMapped={false}
          />
        )}
      </mesh>
      {!settings.wireframe && settings.thickness > 0 && (
        <mesh position={[0, 0, -0.015 * settings.thickness]}>
          <boxGeometry args={[w, h, 0.03 * settings.thickness]} />
          <meshBasicMaterial color={settings.tint} />
        </mesh>
      )}
      {settings.showLabels && (
        <Html position={[0, h / 2 + 0.12, 0.02]} center zIndexRange={[50, 0]}>
          <div className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {page.label}
          </div>
        </Html>
      )}
    </group>
  )
}

function PagesGroup({
  pages,
  settings,
  selected,
  onSelect,
}: {
  pages: PageData[]
  settings: Settings
  selected: number | null
  onSelect: (i: number) => void
}) {
  const group = useRef<THREE.Group>(null)
  const layout = useMemo(
    () => computeLayout(pages.length, settings.layout, settings.spacing, settings.radius),
    [pages.length, settings.layout, settings.spacing, settings.radius]
  )
  useFrame((_, delta) => {
    if (settings.autoRotate && group.current) {
      group.current.rotation.y += delta * settings.speed
    }
  })
  return (
    <group ref={group} rotation={[0.12, 0, 0]}>
      {pages.map((p, i) => (
        <PageMesh
          key={i}
          page={p}
          pos={layout[i].pos}
          rot={layout[i].rot}
          settings={settings}
          selected={selected === i}
          dimmed={selected !== null && selected !== i}
          onSelect={() => onSelect(i)}
        />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// control panel pieces
// ---------------------------------------------------------------------------

function Slider({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(step < 1 ? 1 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-sansi-600"
      />
    </label>
  )
}

function Swatches({
  values,
  current,
  onChange,
}: {
  values: string[]
  current: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`h-6 w-6 rounded-full border-2 ${current === c ? "border-sansi-600" : "border-gray-200"}`}
          style={{ background: c }}
          aria-label={`color ${c}`}
        />
      ))}
    </div>
  )
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs font-medium ${
        value ? "border-sansi-300 bg-sansi-50 text-sansi-800" : "border-gray-200 bg-white text-gray-600"
      }`}
    >
      <span>{label}</span>
      <span className={`h-3.5 w-3.5 rounded-full ${value ? "bg-sansi-600" : "bg-gray-300"}`} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// main viewer
// ---------------------------------------------------------------------------

export default function Pdf3DViewer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<"input" | "loading" | "ready">("input")
  const [pages, setPages] = useState<PageData[]>([])
  const [sourceName, setSourceName] = useState("")
  const [url, setUrl] = useState("")
  const [pasteText, setPasteText] = useState("")
  const [error, setError] = useState("")
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [selected, setSelected] = useState<number | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    mountedRef.current = true
    setMounted(true)
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"
    return () => {
      mountedRef.current = false
    }
  }, [])

  // dispose textures on unmount
  useEffect(() => {
    return () => {
      pages.forEach((p) => p.texture.dispose())
    }
  }, [pages])

  const loadText = useCallback(() => {
    if (!pasteText.trim()) return
    setError("")
    setPhase("loading")
    setSelected(null)
    setTimeout(() => {
      if (!mountedRef.current) return
      try {
        const ps = makeTextPages(pasteText)
        if (!ps.length) throw new Error("No text to render")
        setPages(ps)
        setSourceName(`text · ${ps.length} pages`)
        setPhase("ready")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to render text")
        setPhase("input")
      }
    }, 30)
  }, [pasteText])

  const loadPdfBuffer = useCallback(
    async (buf: ArrayBuffer, name: string) => {
      setError("")
      setPhase("loading")
      setSelected(null)
      try {
        const ps = await makePdfPages(buf)
        if (!ps.length) throw new Error("PDF has no pages")
        setPages(ps)
        setSourceName(`${name} · ${ps.length} pages`)
        setPhase("ready")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to parse PDF")
        setPhase("input")
      }
    },
    []
  )

  const onFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return
      if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
        setError("Please choose a PDF file")
        return
      }
      const buf = await file.arrayBuffer()
      await loadPdfBuffer(buf, file.name)
    },
    [loadPdfBuffer]
  )

  const loadUrl = useCallback(async () => {
    const u = url.trim()
    if (!u) return
    setError("")
    setPhase("loading")
    setSelected(null)
    try {
      const res = await fetch(u)
      if (!res.ok) throw new Error(`HTTP ${res.status} while fetching PDF`)
      const buf = await res.arrayBuffer()
      await loadPdfBuffer(buf, u.split("/").pop() || u)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch PDF")
      setPhase("input")
    }
  }, [url, loadPdfBuffer])

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    setSelected(null)
  }, [])

  const close = useCallback(() => {
    pages.forEach((p) => p.texture.dispose())
    setPages([])
    setPhase("input")
    setSelected(null)
    setError("")
    setUrl("")
    setPasteText("")
    setSourceName("")
    onClose()
  }, [pages, onClose])

  if (!open) return null

  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }))

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur">
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Boxes className="h-4 w-4 text-sansi-400" />
          <span className="font-semibold text-white">3D PDF Viewer</span>
          {sourceName && <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">{sourceName}</span>}
        </div>
        <div className="flex items-center gap-2">
          {phase === "ready" && (
            <>
              <button
                onClick={() => setPanelOpen((v) => !v)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  panelOpen ? "bg-sansi-600 text-white" : "bg-white/10 text-gray-200"
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Customize
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/20"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </>
          )}
          <button
            onClick={close}
            className="rounded-lg bg-white/10 p-2 text-gray-200 hover:bg-white/20"
            aria-label="Close viewer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {/* 3D area */}
        <div className="relative flex-1">
          {phase === "ready" && mounted && (
            <Canvas camera={{ position: [0, 1.2, 9], fov: 50 }} dpr={[1, 1.8]}>
              <color attach="background" args={[settings.bg]} />
              <PagesGroup
                pages={pages}
                settings={settings}
                selected={selected}
                onSelect={(i) => setSelected(selected === i ? null : i)}
              />
              {settings.showGrid && <gridHelper args={[40, 40, "#4b5563", "#374151"]} position={[0, -3.2, 0]} />}
              <ambientLight intensity={1} />
              <OrbitControls enableDamping dampingFactor={0.08} makeDefault />
            </Canvas>
          )}

          {phase === "input" && (
            <div className="relative z-10 mx-auto flex h-full max-w-2xl flex-col justify-center gap-4 px-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  onFile(e.dataTransfer.files?.[0])
                }}
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-white/25 bg-white/5 p-10 text-center transition hover:border-sansi-400 hover:bg-white/10"
              >
                <UploadCloud className="mx-auto mb-3 h-10 w-10 text-sansi-400" />
                <p className="text-sm font-medium text-white">Drop a PDF here or click to browse</p>
                <p className="mt-1 text-xs text-gray-400">The whole document is rendered as 3D pages</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </div>

              <div className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="…or paste a PDF URL (https://…)"
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-sansi-400 focus:outline-none"
                />
                <button
                  onClick={loadUrl}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
                >
                  Load URL
                </button>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                  <FileText className="h-3.5 w-3.5" />
                  …or paste document text — it becomes 3D pages too
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={4}
                  placeholder={"Paste any article / lesson / book text here…\n\nParagraphs separated by blank lines become separate 3D pages."}
                  className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-sansi-400 focus:outline-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={loadText}
                    disabled={!pasteText.trim()}
                    className="rounded-lg bg-sansi-600 px-4 py-2 text-sm font-medium text-white hover:bg-sansi-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Render as 3D
                  </button>
                </div>
              </div>

              {error && <p className="text-center text-sm text-red-400">{error}</p>}
            </div>
          )}

          {phase === "loading" && (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sansi-400 border-t-transparent" />
              <p className="text-sm text-gray-300">Rendering document pages into 3D…</p>
            </div>
          )}
        </div>

        {/* customization panel */}
        {phase === "ready" && panelOpen && (
          <div className="w-72 overflow-y-auto border-l border-white/10 bg-[#101522] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Settings2 className="h-4 w-4 text-sansi-400" />
              Customize
            </div>
            {selected !== null && (
              <div className="mb-3 rounded-lg bg-sansi-600/20 px-3 py-2 text-xs text-sansi-200">
                Page {selected + 1} of {pages.length} selected — click it again to deselect.
              </div>
            )}

            <p className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Layout</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  ["stack", "Stack", Layers],
                  ["grid", "Grid", Grid3X3],
                  ["circle", "Circle", CircleDot],
                  ["spiral", "Spiral", Orbit],
                ] as [Layout, string, typeof Layers][]
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set({ layout: key })}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-medium ${
                    settings.layout === key
                      ? "border-sansi-400 bg-sansi-600/20 text-sansi-200"
                      : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <Slider label="Spacing" value={settings.spacing} min={0.2} max={2.5} onChange={(v) => set({ spacing: v })} />
              <Slider label="Radius / Spread" value={settings.radius} min={1.5} max={9} onChange={(v) => set({ radius: v })} />
              <Slider label="Page size" value={settings.pageScale} min={0.4} max={1.8} onChange={(v) => set({ pageScale: v })} />
              <Slider label="Thickness" value={settings.thickness} min={0} max={6} step={1} onChange={(v) => set({ thickness: v })} />
            </div>

            <p className="mb-1.5 mt-5 text-xs font-semibold uppercase tracking-wider text-gray-500">Style</p>
            <div className="space-y-2.5">
              <Toggle label="Wireframe mode" value={settings.wireframe} onChange={(v) => set({ wireframe: v })} />
              <Toggle label="Page number labels" value={settings.showLabels} onChange={(v) => set({ showLabels: v })} />
              <Toggle label="Auto-rotate scene" value={settings.autoRotate} onChange={(v) => set({ autoRotate: v })} />
              <Toggle label="Show floor grid" value={settings.showGrid} onChange={(v) => set({ showGrid: v })} />
              {settings.autoRotate && (
                <Slider label="Rotation speed" value={settings.speed} min={0.01} max={0.5} step={0.01} onChange={(v) => set({ speed: v })} />
              )}
            </div>

            <div className="mt-4 space-y-2.5">
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">Background</p>
                <Swatches values={BG_SWATCHES} current={settings.bg} onChange={(v) => set({ bg: v })} />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">Spine / wireframe accent</p>
                <Swatches values={TINT_SWATCHES} current={settings.tint} onChange={(v) => set({ tint: v })} />
              </div>
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              className="mt-5 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-white/10"
            >
              Load another PDF
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>
        )}
      </div>
    </div>
  )
}
