
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { SCRAPERS } from '@/lib/scraping/registry'
import { persistSlots, hasNewAvailable } from '@/lib/snapshots'
import { sendTelegram } from '@/lib/alerts'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const auth = req.headers.get('x-cron-key')
  if (!auth || auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const watchlists = await prisma.watchlist.findMany({
    include: { service: true, location: true, user: true }
  })

  let processed = 0
  for (const wl of watchlists) {
    const scraper = SCRAPERS[wl.service.slug]
    if (!scraper || !wl.service.isActive) continue

    const params = (wl.queryParams ?? {}) as Record<string, string>
    const slots = await scraper.fetch({ locationName: wl.location?.name, params })
    await persistSlots({ serviceId: wl.serviceId, locationId: wl.locationId ?? undefined, slots })

    const hasNew = await hasNewAvailable({ serviceId: wl.serviceId, locationId: wl.locationId ?? undefined })
    if (hasNew && wl.user.telegramChat) {
      await sendTelegram(
        wl.user.telegramChat,
        `¡Nuevos cupos para ${wl.service.name}${wl.location ? ' - ' + wl.location.name : ''}!`
      )
    }
    processed++
  }

  return NextResponse.json({ ok: true, processed })
}
