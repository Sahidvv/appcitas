import { prisma } from "@/lib/db"
import type { ScrapeResult } from "@/lib/scrapers/types"
import { getScraperBySlug } from "@/lib/scrapers"

export async function runScraperAndStore(serviceSlug: string) {
  const scraper = getScraperBySlug(serviceSlug)
  if (!scraper) throw new Error(`Scraper not found: ${serviceSlug}`)
  const results = await scraper.scrape()

  const created = []
  for (const r of results) {
    const service = await prisma.service.findUnique({ where: { slug: r.serviceSlug } })
    if (!service) continue

    const snapshot = await prisma.slotSnapshot.create({
      data: {
        serviceId: service.id,
        locationId: r.locationId ?? null,
        date: new Date(),                   // o r.date si viene de la fuente
        time: r.time ?? null,
        capacity: r.capacity ?? null,
        status: r.status === "available" ? "available" : "full",
      },
    })
    created.push(snapshot)
  }
  return created
}

export async function runAllScrapers() {
  // Opcional: levantar todos de la tabla Service.isActive
  const services = await prisma.service.findMany({ where: { isActive: true } })
  const out = []
  for (const s of services) {
    try {
      out.push(await runScraperAndStore(s.slug))
    } catch (e) {
      console.error("[scraper error]", s.slug, e)
    }
  }
  return out.flat()
}
