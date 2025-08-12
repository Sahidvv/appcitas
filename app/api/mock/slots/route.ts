// app/api/mock/slots/route.ts
import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json([
    { date: '2025-08-12', available: false },
    { date: '2025-08-13', available: true,  times: ['08:30','09:00'] },
    { date: '2025-08-14', available: true }
  ])
}
