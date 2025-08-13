import { NextResponse } from "next/server"
import { runAllScrapers } from "@/lib/snapshots"

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-key")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const snapshots = await runAllScrapers()
  return NextResponse.json({ ok: true, created: snapshots.length })
}
