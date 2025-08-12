"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface SlotSnapshot {
  date: string
  time?: string
  status: "available" | "unavailable" | "unknown"
}

interface HistoryChartProps {
  data: SlotSnapshot[]
}

export function HistoryChart({ data }: HistoryChartProps) {
  // Group data by date and count available slots
  const chartData = data.reduce(
    (acc, snapshot) => {
      const date = new Date(snapshot.date).toLocaleDateString("es-ES", {
        month: "2-digit",
        day: "2-digit",
      })

      if (!acc[date]) {
        acc[date] = { date, available: 0, total: 0 }
      }

      acc[date].total++
      if (snapshot.status === "available") {
        acc[date].available++
      }

      return acc
    },
    {} as Record<string, { date: string; available: number; total: number }>,
  )

  const chartArray = Object.values(chartData).slice(-7) // Last 7 days

  if (chartArray.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hay datos disponibles para mostrar
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartArray}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            labelFormatter={(label) => `Fecha: ${label}`}
            formatter={(value, name) => [value, name === "available" ? "Cupos disponibles" : "Total"]}
          />
          <Bar dataKey="available" fill="#22c55e" name="available" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
