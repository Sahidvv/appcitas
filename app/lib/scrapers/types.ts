export type ScrapeResult = {
  serviceSlug: string               // ej: "pasaporte-pe"
  locationId?: string | null        // si aplica
  status: "available" | "full"
  date?: string                     // ISO si la fuente da fecha específica
  time?: string | null
  capacity?: number | null
}

export interface Scraper {
  slug: string                      // debe coincidir con Service.slug
  name: string
  scrape: (opts?: { locationId?: string }) => Promise<ScrapeResult[]>
}
