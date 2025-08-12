"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { Service } from "@/types"

interface NewWatchlistModalProps {
  children: React.ReactNode
}

export function NewWatchlistModal({ children }: NewWatchlistModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [email, setEmail] = useState("demo@sahid.dev")
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const { toast } = useToast()
  const router = useRouter()

  const loadServices = async () => {
    if (services.length > 0) return // Already loaded

    setServicesLoading(true)
    try {
      const data = await api.getServices()
      setServices(data)
    } catch (error) {
      // Error already handled by api utility
      console.error("Failed to load services:", error)
    } finally {
      setServicesLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      loadServices()
    } else {
      // Reset form when closing
      setSelectedService("")
      setSelectedLocation("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService) return

    setLoading(true)
    try {
      const body = {
        userEmail: email,
        serviceId: selectedService,
        ...(selectedLocation && selectedLocation !== "all" && { locationId: selectedLocation }),
      }

      await api.createWatchlist(body)

      toast({
        title: "Éxito",
        description: "Vigilancia creada correctamente",
      })

      setOpen(false)
      router.refresh() // Refresh the page to show new watchlist
    } catch (error) {
      // Error already handled by api utility
      console.error("Failed to create watchlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedServiceData = services.find((s) => s.id === selectedService)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Nueva vigilancia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Servicio</Label>
            <Select value={selectedService} onValueChange={setSelectedService} required>
              <SelectTrigger>
                <SelectValue placeholder={servicesLoading ? "Cargando..." : "Selecciona un servicio"} />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedServiceData?.locations && selectedServiceData.locations.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación (opcional)</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ubicaciones</SelectItem>
                  {selectedServiceData.locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedService} className="w-full sm:w-auto">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
