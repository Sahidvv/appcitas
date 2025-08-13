import { prisma } from "@/lib/db"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVER_USER,        // ← igual que NextAuth
    pass: process.env.EMAIL_SERVER_PASSWORD,    // ← igual que NextAuth (App Password)
  },
})

export async function notifyForSnapshot(snapshotId: string) {
  const snapshot = await prisma.slotSnapshot.findUnique({
    where: { id: snapshotId },
    include: { service: true, location: true },
  })
  if (!snapshot || snapshot.status !== "available") return 0

  const watchlists = await prisma.watchlist.findMany({
    where: {
      serviceId: snapshot.serviceId,
      isActive: true,
      OR: [{ locationId: null }, { locationId: snapshot.locationId }],
    },
    include: { user: true },
  })

  let count = 0
  for (const wl of watchlists) {
    if (!wl.user?.email) continue

    await transporter.sendMail({
      from: `"Cupos Públicos" <${process.env.EMAIL_FROM}>`, // usa el mismo remitente que auth
      to: wl.user.email,
      subject: `¡Nuevo cupo en ${snapshot.service.name}!`,
      html: `
        <p>Se detectó disponibilidad en <b>${snapshot.service.name}</b>${snapshot.location ? ` – ${snapshot.location.name}` : ""}.</p>
        <p>Fecha: ${snapshot.date.toISOString().slice(0,16).replace('T',' ')}</p>
        <p><a href="${snapshot.service.sourceUrl}" target="_blank" rel="noreferrer">Ir al portal</a></p>
      `,
      text: `Nuevo cupo en ${snapshot.service.name}. Ir: ${snapshot.service.sourceUrl}`,
      replyTo: process.env.EMAIL_FROM, // ayuda a reputación
    })

    await prisma.alert.create({
      data: {
        userId: wl.userId,
        watchlistId: wl.id,
        snapshotId: snapshot.id,
        channel: "email",
      },
    })
    count++
  }
  return count
}
