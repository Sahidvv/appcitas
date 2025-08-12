export interface Service {
  id: string
  name: string
  slug: string
  locations: Location[]
}

export interface Location {
  id: string
  name: string
}

export interface Watchlist {
  id: string
  userEmail: string
  serviceId: string
  locationId?: string
  service: Service
  location?: Location
  isActive: boolean
  createdAt: string
}

export interface SlotSnapshot {
  date: string
  time?: string
  status: "available" | "unavailable" | "unknown"
}

export interface HistoryData {
  data: SlotSnapshot[]
}
