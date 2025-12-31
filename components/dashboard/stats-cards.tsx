"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, ClipboardList, DollarSign, Users } from "lucide-react"
import { useTranslations } from "next-intl"

interface StatsCardsProps {
  stats?: {
    totalLofts: number
    occupiedLofts: number
    activeTasks: number
    monthlyRevenue: number
    totalTeams: number
  } | null,
  defaultCurrencySymbol?: string
}

export function StatsCards({ stats, defaultCurrencySymbol = "DA" }: StatsCardsProps) {
  const t = useTranslations('dashboard');
  
  // Provide default values if stats is null or undefined
  const safeStats = stats || {
    totalLofts: 0,
    occupiedLofts: 0,
    activeTasks: 0,
    monthlyRevenue: 0,
    totalTeams: 0
  };
  
  const cards = [
    {
      title: t('totalLofts'),
      value: safeStats.totalLofts,
      icon: Building2,
      description: `${safeStats.occupiedLofts} ${t('occupiedLofts').toLowerCase()}`,
    },
    {
      title: t('activeTasks'),
      value: safeStats.activeTasks,
      icon: ClipboardList,
      description: t('inProgress'),
    },
    {
      title: t('monthlyRevenue'),
      value: `${defaultCurrencySymbol}${safeStats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: t('thisMonth'),
    },
    {
      title: t('teams'),
      value: safeStats.totalTeams,
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
