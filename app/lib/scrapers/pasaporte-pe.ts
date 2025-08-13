import * as cheerio from "cheerio"
import type { Scraper, ScrapeResult } from "./types"

export const pasaportePe: Scraper = {
  slug: "pasaporte-pe",
  name: "Pasaporte (Perú)",
  async scrape() {
    // TODO: reemplazar por URL pública real permitida
    const url = "https://example.com/pasaporte/agenda" 
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } })
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`)
    const html = await res.text()
    const $ = cheerio.load(html)

    // Lógica mínima: si aparece “sin cupos” -> full, si aparece “disponible” -> available
    const text = $("body").text().toLowerCase()
    const available = text.includes("disponible") || text.includes("cupos disponibles")
    const status: "available" | "full" = available ? "available" : "full"

    const item: ScrapeResult = {
      serviceSlug: "pasaporte-pe",
      status,
      // Opcional: parsear fecha/hora/capacidad
    }
    return [item]
  }
}
