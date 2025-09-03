"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useTranslations } from "next-intl"

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

interface RevenueChartProps {
  monthlyRevenue: MonthlyRevenueData[];
}

export function RevenueChart({ monthlyRevenue }: RevenueChartProps) {
  const t = useTranslations('dashboard');
  
  const chartConfig = {
    revenue: {
      label: t('revenue'),
      color: "hsl(var(--chart-1))",
    },
    expenses: {
      label: t('expenses'),
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('revenueVsExpenses')}</CardTitle>
        <CardDescription>{t('monthlyFinancialOverview')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyRevenue}>
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={{ fill: "var(--color-revenue)" }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="var(--color-expenses)"
                strokeWidth={2}
                dot={{ fill: "var(--color-expenses)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
