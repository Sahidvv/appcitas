import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const serviceId = searchParams.get('service')
  const locationId = searchParams.get('location') ?? undefined
  const days = Number(searchParams.get('days') ?? '7')

  if (!serviceId) return NextResponse.json({ error: 'service is required' }, { status: 400 })

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const data = await prisma.slotSnapshot.findMany({
    where: { serviceId, ...(locationId ? { locationId } : {}), fetchedAt: { gte: since } },
    orderBy: { fetchedAt: 'asc' }
  })
  return NextResponse.json({ data })
}
