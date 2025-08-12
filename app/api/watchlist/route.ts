import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import type { Prisma } from "@prisma/client"   // <- type-only
import { getServerSession } from "next-auth"   // <- v4
import { authOptions } from "@/lib/auth"       // <- tus opciones
import { ratelimit } from "@/lib/rate"
import { headers } from "next/headers"

const CreateWatchlist = z.object({
  serviceId: z.string(),
  locationId: z.string().optional(),
  queryParams: z.record(z.string(), z.string()).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const data = await prisma.watchlist.findMany({
    where: { user: { email: session.user.email } },
    include: { service: true, location: true, user: true },
  })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // headers() NO es async
  const ip = headers().get("x-forwarded-for") ?? "unknown"
  const { success } = await ratelimit.limit(`watchlist:create:${ip}`)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const body = await req.json()
  const parsed = CreateWatchlist.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const wl = await prisma.watchlist.create({
    data: {
      userId: user.id,
      serviceId: parsed.data.serviceId,
      locationId: parsed.data.locationId,
      // Si TS sigue molestando, asegúrate de haber corrido `pnpm prisma generate`
      queryParams: parsed.data.queryParams as Prisma.InputJsonValue,
    },
  })
  return NextResponse.json(wl, { status: 201 })
}
