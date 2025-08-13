// app/api/auth/revoke/route.ts (opcional, admin o self)
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  await prisma.session.deleteMany({ where: { user: { email: session.user.email } } })
  return NextResponse.json({ ok: true })
}
