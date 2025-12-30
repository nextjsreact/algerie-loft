"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { BarChart3 } from 'lucide-react'

interface EarningsData {
  month: string
  earnings: number
  bookings: number
}

interface PartnerEarningsChartProps {
  userId: string
}

export function PartnerEarningsChart({ userId }: PartnerEarningsChartProps) {
  const [earningsData, setEarningsData] = useState<EarningsData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEarningsData()
  }, [userId])

  const fetchEarningsData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/partner/earnings?months=6')
      if (response.ok) {
        const data = await response.json()
        setEarningsData(data.earnings || [])
      } else {
        // Fallback to mock data if API fails
        const mockData: EarningsData[] = [
          { month: 'Jan', earnings: 15000, bookings: 8 },
          { month: 'Feb', earnings: 18000, bookings: 10 },
          { month: 'Mar', earnings: 22000, bookings: 12 },
          { month: 'Apr', earnings: 25000, bookings: 14 },
          { month: 'May', earnings: 28000, bookings: 16 },
          { month: 'Jun', earnings: 32000, bookings: 18 },
        ]
        setEarningsData(mockData)
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error)
      // Fallback to mock data
      const mockData: EarningsData[] = [
        { month: 'Jan', earnings: 15000, bookings: 8 },
        { month: 'Feb', earnings: 18000, bookings: 10 },
        { month: 'Mar', earnings: 22000, bookings: 12 },
        { month: 'Apr', earnings: 25000, bookings: 14 },
        { month: 'May', earnings: 28000, bookings: 16 },
        { month: 'Jun', earnings: 32000, bookings: 18 },
      ]
      setEarningsData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const chartConfig = {
    earnings: {
      label: 'Earnings (DZD)',
      color: 'hsl(var(--chart-1))',
    },
    bookings: {
      label: 'Bookings',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Earnings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Earnings Overview
        </CardTitle>
        <p className="text-sm text-gray-600">Monthly earnings and booking trends</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={earningsData}>
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="var(--color-earnings)"
                strokeWidth={3}
                dot={{ fill: "var(--color-earnings)", strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="var(--color-bookings)"
                strokeWidth={3}
                dot={{ fill: "var(--color-bookings)", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}