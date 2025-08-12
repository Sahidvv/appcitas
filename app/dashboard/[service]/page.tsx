"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HistoryChart } from "@/components/history-chart"
import { HistorySkeleton } from "@/components/loading-skeleton"
import { ArrowLeft, ChevronDown } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import type { HistoryData, Service } from "@/types"

const ITEMS_PER_PAGE = 100

export default function ServiceHistoryPage({
  params,
}: {
  params: { service: string }
}) {
  const [historyData, setHistoryData] = useState<HistoryData>({ data: [] })
  const [services, setServices] = useState<Service[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE)

  const { service } = params

  // Load services and initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [servicesData, historyResponse] = await Promise.all([
          api.getServices(),
          api.getSlotHistory(service, selectedLocation),
        ])
        setServices(servicesData)
        setHistoryData(historyResponse)
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [service, selectedLocation])

  const currentService = services.find((s) => s.slug === service || s.id === service)
  const recentDetections = historyData.data.slice().reverse()
  const visibleDetections = recentDetections.slice(0, visibleItems)
  const hasMore = visibleDetections.length < recentDetections.length

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value)
    setVisibleItems(ITEMS_PER_PAGE) // Reset pagination
  }

  const loadMore = () => {
    setVisibleItems((prev) => prev + ITEMS_PER_PAGE)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">Historial de disponibilidad</h1>
        </div>
        <HistorySkeleton />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Historial de disponibilidad</h1>
      </div>

      {/* Location Filter */}
      {currentService?.locations && currentService.locations.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="text-sm font-medium">Ubicación:</label>
            <Select value={selectedLocation} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {currentService.locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Cupos disponibles - Últimos 7 días</CardTitle>
          </CardHeader>
          <CardContent>
            <HistoryChart data={historyData.data} />
          </CardContent>
        </Card>

        {/* Recent Detections Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Últimas detecciones</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDetections.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aún no hay datos</p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleDetections.map((detection, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">
                            {new Date(detection.date).toLocaleString("es-ES", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {detection.time && ` - ${detection.time}`}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                detection.status === "available"
                                  ? "default"
                                  : detection.status === "unavailable"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {detection.status === "available"
                                ? "Disponible"
                                : detection.status === "unavailable"
                                  ? "No disponible"
                                  : "Desconocido"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={loadMore}>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Cargar más ({recentDetections.length - visibleItems} restantes)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
