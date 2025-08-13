import type { Scraper } from "./types"
import { pasaportePe } from "./pasaporte-pe"
// más scrapers acá…

export const scrapers: Scraper[] = [pasaportePe]

export function getScraperBySlug(slug: string) {
  return scrapers.find(s => s.slug === slug)
}
