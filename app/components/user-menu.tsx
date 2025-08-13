// components/user-menu.tsx
"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function UserMenu({ email }: { email?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{email}</span>
      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
        Cerrar sesión
      </Button>
    </div>
  )
}
