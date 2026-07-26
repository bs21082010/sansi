const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

class ApiClient {
  private base: string

  constructor(base: string) {
    this.base = base
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) headers["Authorization"] = `Bearer ${token}`
    }
    return headers
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: { ...this.getHeaders(), ...options?.headers },
      ...options,
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(body || `API error: ${res.status}`)
    }
    return res.json()
  }

  get<T>(path: string) {
    return this.request<T>(path)
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" })
  }
}

export const api = new ApiClient(API_BASE)
