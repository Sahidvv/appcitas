import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const services = await prisma.service.findMany({ include: { locations: true } })
  return NextResponse.json(services)
}