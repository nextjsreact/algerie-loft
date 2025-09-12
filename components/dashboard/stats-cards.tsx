"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, ClipboardList, DollarSign, Users } from "lucide-react"
import { useTranslations } from "next-intl"

interface StatsCardsProps {
  stats: {
    totalLofts: number
    occupiedLofts: number
    activeTasks: number
    monthlyRevenue: number
    totalTeams: number
  },
  defaultCurrencySymbol: string // New prop
}

export function StatsCards({ stats, defaultCurrencySymbol }: StatsCardsProps) { // Destructure new prop
  const t = useTranslations('dashboard');
  
  const cards = [
    {
      title: t('totalLofts'),
      value: stats.totalLofts,
      icon: Building2,
      description: `${stats.occupiedLofts} ${t('occupiedLofts').toLowerCase()}`,
    },
    {
      title: t('activeTasks'),
      value: stats.activeTasks,
      icon: ClipboardList,
      description: t('inProgress'),
    },
    {
      title: t('monthlyRevenue'),
      value: `${defaultCurrencySymbol}${stats.monthlyRevenue.toLocaleString()}`, // Use new prop
      icon: DollarSign,
      description: t('thisMonth'),
    },
    {
      title: t('teams'),
      value: stats.totalTeams,
      icon: Users,
      description: t('activeTeams'),
    },
  ]

  return (
    
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto ">
      {cards.map((card) => (
        <Card key={card.title} className="transition-all duration-300 hover:scale-[1.03] "> 
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 ">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <card.icon className="h-4 w-4 " />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
