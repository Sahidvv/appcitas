import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

// TODO: añadir token secreto en headers y validar aquí
export async function POST() {
  const watchlists = await prisma.watchlist.findMany({ include: { service: true, location: true } })

  // Aquí llamarías a tu(s) scraper(s) por servicio
  // Ejemplo (pseudo): const slots = await scraper.fetch({ locationId: wl.locationId, params: wl.queryParams })
  // Guardar snapshots y detectar cambios…

  return NextResponse.json({ ok: true, processed: watchlists.length })
}

