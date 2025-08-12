import type { Scraper } from './base'
import { ServiceAScraper } from './serviceA'

export const SCRAPERS: Record<string, Scraper> = {
  'pasaporte-pe': ServiceAScraper,
  'dni-pe': ServiceAScraper, // temporalmente el mismo
}
