import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") || "deepseek/deepseek-chat";
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") || "";
const DEEPSEEK_MODEL = Deno.env.get("DEEPSEEK_MODEL") || "deepseek-chat";
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") || "";
const GH_MODEL = Deno.env.get("GH_MODEL") || "gpt-4o-mini";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const AI_API_KEY = Deno.env.get("AI_API_KEY") || Deno.env.get("OPENAI_API_KEY") || "";
const AI_BASE_URL = (Deno.env.get("AI_BASE_URL") || "https://api.openai.com/v1").replace(/\/$/, "");
const AI_MODEL = Deno.env.get("AI_MODEL") || "gpt-4o-mini";
const AI_TIMEOUT_MS = parseInt(Deno.env.get("AI_TIMEOUT_MS") || "60000");

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Authorization,Content-Type,apikey" };

function json(d: unknown, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }); }
function err(m: string, s = 400) { return json({ detail: m }, s); }

async function parseBody<T>(r: Request): Promise<T> {
  const ct = r.headers.get("content-type") || "";
  if (ct.includes("application/json")) { const t = await r.text(); return JSON.parse(t); }
  const f = await r.formData(); return Object.fromEntries(f) as T;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(timer); }
}

function extractContent(data: unknown): string {
  const d = data as { choices?: { message?: { content?: unknown; reasoning?: unknown } }[]; message?: { content?: unknown } };
  const msg = d?.choices?.[0]?.message || d?.message || {};
  const content = (msg?.content ?? msg?.reasoning ?? "") as unknown;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((p: { text?: string }) => p?.text ?? "").join("");
  return "";
}

interface Provider { key: string; baseUrl: string; model: string; name: string; }

function buildProviders(): Provider[] {
  const list: Provider[] = [];
  if (OPENROUTER_API_KEY) list.push({ key: OPENROUTER_API_KEY, baseUrl: "https://openrouter.ai/api/v1", model: OPENROUTER_MODEL, name: "openrouter" });
  if (DEEPSEEK_API_KEY) list.push({ key: DEEPSEEK_API_KEY, baseUrl: "https://api.deepseek.com/v1", model: DEEPSEEK_MODEL, name: "deepseek" });
  if (GITHUB_TOKEN) list.push({ key: GITHUB_TOKEN, baseUrl: "https://models.github.ai/inference", model: GH_MODEL, name: "github" });
  if (GEMINI_API_KEY) list.push({ key: GEMINI_API_KEY, baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: GEMINI_MODEL, name: "google" });
  if (AI_API_KEY) list.push({ key: AI_API_KEY, baseUrl: AI_BASE_URL, model: AI_MODEL, name: "custom" });
  return list;
}

async function callProvider(p: Provider, messages: { role: string; content: string }[], temperature: number, jsonMode: boolean, maxTokens: number): Promise<string> {
  const body: Record<string, unknown> = { model: p.model, messages, temperature, max_tokens: maxTokens };
  if (jsonMode) body.response_format = { type: "json_object" };
  const res = await fetchWithTimeout(`${p.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + p.key },
    body: JSON.stringify(body),
  }, Math.min(AI_TIMEOUT_MS, 20000));
  if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(`${p.name} ${res.status}${t ? " - " + t.slice(0, 200) : ""}`); }
  const data = await res.json();
  const out = extractContent(data);
  if (!out) throw new Error(`${p.name} returned empty response`);
  return out;
}

async function callAI(system: string, user: string, temperature: number, jsonMode = false): Promise<{ content: string; error?: string; status?: number }> {
  const providers = buildProviders();
  if (!providers.length) return { content: "", error: "AI service not configured: set OPENROUTER_API_KEY, DEEPSEEK_API_KEY, GITHUB_TOKEN, GEMINI_API_KEY, or AI_API_KEY secret", status: 503 };
  const messages = [{ role: "system", content: system }, { role: "user", content: user }];
  let lastErr = "";
  for (let pass = 0; pass < 2; pass++) {
    for (const p of providers) {
      try { return { content: await callProvider(p, messages, temperature, jsonMode, 2048) }; }
      catch (e) { lastErr = e instanceof Error ? e.message : "AI request failed"; }
    }
    await new Promise((r) => setTimeout(r, 800 * (pass + 1)));
  }
  return { content: "", error: lastErr.includes("timed out") ? "AI request timed out" : lastErr, status: 502 };
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/[^\/]+\/?/, "");
  const method = req.method;

  try {
    if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

    if ((path === "tutor/chat" || path === "chat") && method === "POST") {
      const body = await parseBody(req);
      const lang = body.language || "sa";
      const diff = body.difficulty || "beginner";
      const system = `You are a ${lang} language tutor. Answer concisely for a ${diff} learner. Return valid JSON only: {"reply":"...","difficulty":"...","suggested_exercise":null}`;
      const history: { role: string; content: string }[] = Array.isArray(body.messages) && body.messages.length ? body.messages.slice(-8) : (body.message ? [{ role: "user", content: body.message }] : []);
      if (!history.length) return err("message required", 400);
      const user = history.map((m) => m.role + ": " + m.content).join("\n");
      const ai = await callAI(system, user, 0.7, true);
      if (ai.error) return err(ai.error, ai.status === 503 ? 503 : ai.status === 429 ? 429 : 502);
      const txt = ai.content;
      try { const j = JSON.parse(txt.replace(/^```json\s*|```\s*/g, "").trim()); return json({ reply: j.reply || txt, citations: [], difficulty: j.difficulty || diff, suggested_exercise: j.suggested_exercise || null, mode: "tutor" }); }
      catch { return json({ reply: txt || "I'm having trouble responding right now.", citations: [], difficulty: diff, suggested_exercise: null, mode: "tutor" }); }
    }

    if ((path === "tutor/translate" || path === "translate") && method === "POST") {
      const body = await parseBody(req);
      const src = body.source || url.searchParams.get("source") || "sa";
      const tgt = body.target || url.searchParams.get("target") || "en";
      const prompt = `Translate this ${src} text to ${tgt}. Return ONLY valid JSON: {"translated_text":"...","word_count":N}`;
      const dt = body.text || url.searchParams.get("text") || "";
      if (!dt) return err("text required", 400);
      const ai = await callAI(prompt, dt, 0.3, true);
      if (ai.error) return err(ai.error, ai.status === 503 ? 503 : ai.status === 429 ? 429 : 502);
      const txt = ai.content;
      try { const j = JSON.parse(txt.replace(/^```json\s*|```\s*$/g, "").trim()); return json({ translated_text: j.translated_text || txt, word_count: j.word_count || 0, source: src, target: tgt }); }
      catch { return json({ translated_text: txt, word_count: 0, source: src, target: tgt }); }
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Internal server error", 500);
  }
});
