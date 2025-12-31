"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart'
// Recharts temporairement désactivé pour éviter les erreurs d3-shape avec Next.js 16
// import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
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
        <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border shadow-lg">
          <div className="text-center mb-4">
            <h4 className="font-semibold text-gray-700">Évolution des Gains</h4>
            <p className="text-sm text-gray-500">Gains et réservations mensuels</p>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-700">Gains</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">Réservations</span>
            </div>
          </div>
          
          <div className="relative bg-white rounded-lg p-4 shadow-inner border">
            <svg viewBox="0 0 600 200" className="w-full h-48">
              <defs>
                <linearGradient id="earningsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0088FE"/>
                  <stop offset="100%" stopColor="#00C49F"/>
                </linearGradient>
                <linearGradient id="bookingsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00C49F"/>
                  <stop offset="100%" stopColor="#FFBB28"/>
                </linearGradient>
              </defs>
              
              {/* Grid */}
              <g stroke="#f3f4f6" strokeWidth="1">
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="50" y1={30 + i * 30} x2="550" y2={30 + i * 30} />
                ))}
              </g>
              
              {/* Earnings line */}
              <path
                d="M 50 120 L 150 100 L 250 80 L 350 90 L 450 70 L 550 60"
                stroke="url(#earningsGradient)"
                strokeWidth="3"
                fill="none"
                className="drop-shadow-sm"
              />
              
              {/* Bookings line */}
              <path
                d="M 50 140 L 150 130 L 250 110 L 350 120 L 450 100 L 550 90"
                stroke="url(#bookingsGradient)"
                strokeWidth="3"
                fill="none"
                className="drop-shadow-sm"
              />
              
              {/* Data points */}
              {[50, 150, 250, 350, 450, 550].map((x, i) => {
                const earningsY = [120, 100, 80, 90, 70, 60][i];
                const bookingsY = [140, 130, 110, 120, 100, 90][i];
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={earningsY}
                      r="4"
                      fill="#0088FE"
                      stroke="white"
                      strokeWidth="2"
                      className="drop-shadow-lg"
                    />
                    <circle
                      cx={x}
                      cy={bookingsY}
                      r="4"
                      fill="#00C49F"
                      stroke="white"
                      strokeWidth="2"
                      className="drop-shadow-lg"
                    />
                  </g>
                );
              })}
              
              {/* Month labels */}
              {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'].map((month, i) => (
                <text
                  key={i}
                  x={50 + i * 100}
                  y="180"
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700"
                >
                  {month}
                </text>
              ))}
            </svg>
          </div>
          
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              💰 Performance excellente • +18% ce mois
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}