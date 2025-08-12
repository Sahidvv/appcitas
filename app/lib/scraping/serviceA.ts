import { Scraper, Slot, normalizeDate } from './base'

const BASE = process.env.APP_BASE_URL
  ? `${process.env.APP_BASE_URL}/api/mock/slots`
  : 'http://localhost:3000/api/mock/slots'
  
export const ServiceAScraper: Scraper = {
  name: 'serviceA',
  baseUrl: BASE,
  ratePerMin: 2,
  async fetch({ locationName, params }) {
    const url = new URL(BASE)
    if (locationName) url.searchParams.set('location', locationName)
    if (params) Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v))

    const res = await fetch(url.toString(), { headers: { 'User-Agent': 'AgendaCuposBot/1.0' } })
    if (!res.ok) return []
    const data = await res.json() as Array<{ date: string; available: boolean; times?: string[] }>

    const slots: Slot[] = []
    for (const d of data) {
      if (d.available) {
        if (d.times?.length) {
          for (const t of d.times) slots.push({ date: normalizeDate(d.date), time: t, status: 'available' })
        } else {
          slots.push({ date: normalizeDate(d.date), status: 'available' })
        }
      } else {
        slots.push({ date: normalizeDate(d.date), status: 'full' })
      }
    }
    return slots
  }
}
