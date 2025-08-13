// app/auth/signin/page.tsx
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SignInPage() {
  const [email, setEmail] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    await signIn("email", { email, callbackUrl: "/dashboard" })
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Entrar por email</h1>
        <Input
          type="email"
          placeholder="tu-correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">Enviar enlace</Button>
        <p className="text-sm text-muted-foreground">
          Te enviaremos un enlace mágico para iniciar sesión.
        </p>
      </form>
    </div>
  )
}
