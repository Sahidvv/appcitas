// app/api/debug/send-test/route.ts
import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_SERVER_USER, // te lo envías a ti mismo
    subject: "Test SMTP",
    text: "Hola, este es un test de SMTP desde notify.",
  })

  return NextResponse.json({ ok: true, id: info.messageId })
}
