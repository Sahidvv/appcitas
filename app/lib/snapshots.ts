import { prisma } from '@/lib/db'
import type { Slot } from './scraping/base'

export async function persistSlots({ serviceId, locationId, slots }:{
  serviceId: string; locationId?: string; slots: Slot[]
}) {
  const created: string[] = []
  for (const s of slots) {
    const existing = await prisma.slotSnapshot.findFirst({
      where: {
        serviceId,
        locationId: locationId ?? undefined,
        date: new Date(s.date + 'T00:00:00.000Z'),
        time: s.time ?? null,
        status: s.status === 'available' ? 'available' : 'full',
      }
    })
    if (!existing) {
      const snap = await prisma.slotSnapshot.create({
        data: {
          serviceId,
          locationId: locationId ?? null,
          date: new Date(s.date + 'T00:00:00.000Z'),
          time: s.time ?? null,
          capacity: s.capacity ?? null,
          status: s.status === 'available' ? 'available' : 'full',
        }
      })
      created.push(snap.id)
    }
  }
  return created
}

export async function hasNewAvailable({ serviceId, locationId }:{
  serviceId: string; locationId?: string
}) {
  const last = await prisma.slotSnapshot.findFirst({
    where: { serviceId, locationId: locationId ?? undefined, status: 'available' },
    orderBy: { fetchedAt: 'desc' }
  })
  return Boolean(last)
}
