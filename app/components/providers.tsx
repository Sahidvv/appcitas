"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"

export default function Providers({ children }: { children: React.ReactNode }) {
  // Si más adelante tienes ThemeProvider, colócalo aquí también
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  )
}
