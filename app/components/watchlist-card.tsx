"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, MapPin } from "lucide-react"
import Link from "next/link"
import type { Watchlist } from "@/types"

interface WatchlistCardProps {
  watchlist: Watchlist
}

export function WatchlistCard({ watchlist }: WatchlistCardProps) {
  const historyUrl = `/dashboard/${watchlist.service.slug}${watchlist.locationId ? `?location=${watchlist.locationId}` : ""}`

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base sm:text-lg leading-tight">{watchlist.service.name}</CardTitle>
          <Badge variant={watchlist.isActive ? "default" : "secondary"} className="shrink-0">
            {watchlist.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {watchlist.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{watchlist.location.name}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Creado: {new Date(watchlist.createdAt).toLocaleDateString("es-ES")}
        </div>

        <Link href={historyUrl} className="block">
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            Ver historial
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
