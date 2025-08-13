// app/dashboard/page.tsx
import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { NewWatchlistModal } from "@/components/new-watchlist-modal"
import { WatchlistCard } from "@/components/watchlist-card"
import { WatchlistSkeleton } from "@/components/loading-skeleton"
import { AuthGate } from "@/components/auth-gate"
import type { Watchlist } from "@/types"
import { authOptions } from "@/lib/auth"  // ← ahora sí existe
import { getBaseUrl } from "@/lib/url"
import { cookies } from "next/headers"
import { signOut } from "next-auth/react" // 👈 importante
import { UserMenu } from "@/components/user-menu" // si lo separas en un componente
import { SignOutButton } from "@/components/sign-out-button" // 👈 nuevo

async function WatchlistContent() {
    const base = getBaseUrl()
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.toString() // o bien: cookieStore.getAll().map(...).join("; ")

    const res = await fetch(`${base}/api/watchlist`, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    })


  if (!res.ok) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Error cargando vigilancias.
        </CardContent>
      </Card>
    )
  }

  const watchlists: Watchlist[] = await res.json()

  if (watchlists.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-lg mb-4">Aún no hay datos</p>
          <p className="text-sm text-muted-foreground mb-6 text-center px-4">
            Crea tu primera vigilancia para comenzar a monitorear cupos disponibles
          </p>
          <NewWatchlistModal>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva vigilancia
            </Button>
          </NewWatchlistModal>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {watchlists.map((watchlist) => (
        <WatchlistCard key={watchlist.id} watchlist={watchlist} />
      ))}
    </div>
  )
}

async function AuthenticatedDashboard({ email }: { email: string }) {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Mis vigilancias</h1>
        <NewWatchlistModal>
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nueva vigilancia
          </Button>
        </NewWatchlistModal>
                  <SignOutButton />

      </div>

      <Suspense fallback={<WatchlistSkeleton />}>
        <WatchlistContent />
      </Suspense>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions) // ← v4
  if (!session?.user) {
    return <AuthGate />
  }
  return <AuthenticatedDashboard email={session.user.email ?? ""} />

}
