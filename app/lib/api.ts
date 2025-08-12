import { toast } from "@/components/ui/use-toast"

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store", ...options })
    if (!res.ok) {
      const msg = `Error ${res.status}: ${res.statusText}`
      toast({ title: "Error", description: msg, variant: "destructive" })
      throw new ApiError(res.status, msg)
    }
    return res.json()
  } catch (err) {
    if (err instanceof ApiError) throw err
    const msg = "Error de conexión. Verifica tu internet."
    toast({ title: "Error", description: msg, variant: "destructive" })
    throw new Error(msg)
  }
}

export const api = {
  getWatchlists: () => fetcher<import("@/types").Watchlist[]>("/api/watchlist"),

  // OJO: ya no enviamos userEmail; lo saca el backend de la sesión
  createWatchlist: (data: { serviceId: string; locationId?: string; queryParams?: Record<string, string> }) =>
    fetcher<import("@/types").Watchlist>("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  getServices: () => fetcher<import("@/types").Service[]>("/api/services"),

  getSlotHistory: (service: string, location?: string, days = 7) => {
    const params = new URLSearchParams({ service, days: String(days) })
    if (location && location !== "all") params.set("location", location)
    return fetcher<import("@/types").HistoryData>(`/api/slots/history?${params}`)
  },
}
