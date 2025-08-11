import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { z } from 'zod'

const CreateWatchlist = z.object({
  userEmail: z.string().email(),
  serviceId: z.string(),
  locationId: z.string().optional(),
  queryParams: z.record(z.string(), z.string()).optional(), // 👈 clave y valor
})

export async function GET() {
  const data = await prisma.watchlist.findMany({
    include: { service: true, location: true, user: true }
  })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = CreateWatchlist.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: parsed.data.userEmail } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const wl = await prisma.watchlist.create({
    data: {
      userId: user.id,
      serviceId: parsed.data.serviceId,
      locationId: parsed.data.locationId,
      queryParams: parsed.data.queryParams
    }
  })
  return NextResponse.json(wl, { status: 201 })
}