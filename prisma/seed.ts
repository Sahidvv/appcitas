// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Usuario demo (upsert)
  const user = await prisma.user.upsert({
    where: { email: 'demo@sahid.dev' },
    update: {},
    create: { email: 'demo@sahid.dev', name: 'Demo' }
  })

  // Servicios (upsert por slug único)
  const passport = await prisma.service.upsert({
    where: { slug: 'pasaporte-pe' },
    update: {},
    create: {
      name: 'Pasaporte (Perú)',
      slug: 'pasaporte-pe',
      country: 'PE',
      sourceUrl: 'https://ejemplo.migraciones.gob.pe/citas',
      isActive: true
    }
  })

  const reniec = await prisma.service.upsert({
    where: { slug: 'dni-pe' },
    update: {},
    create: {
      name: 'DNI (Perú)',
      slug: 'dni-pe',
      country: 'PE',
      sourceUrl: 'https://ejemplo.reniec.gob.pe/citas',
      isActive: true
    }
  })

  // Ubicaciones (pueden quedar duplicadas si corres muchas veces; para evitarlo, busca primero)
  async function upsertLocation(serviceId: string, name: string) {
    const found = await prisma.location.findFirst({ where: { serviceId, name } })
    return found ?? prisma.location.create({ data: { name, serviceId } })
  }

  const l1 = await upsertLocation(passport.id, 'Lima - Sede Central')
  const l2 = await upsertLocation(passport.id, 'Callao - MAC')
  const l3 = await upsertLocation(reniec.id, 'Lima - RENIEC')

  // Watchlist demo (solo crear si no existe una igual)
  const existingWL = await prisma.watchlist.findFirst({
    where: { userId: user.id, serviceId: passport.id, locationId: l1.id }
  })
  if (!existingWL) {
    await prisma.watchlist.create({
      data: { userId: user.id, serviceId: passport.id, locationId: l1.id, isActive: true }
    })
  }

  console.log('Seed listo ✅')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
