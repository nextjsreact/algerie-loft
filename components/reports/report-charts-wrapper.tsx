"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

interface LoftRevenue {
  name: string
  revenue: number
  expenses: number
  net_profit: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
  expenses: number
}

interface ReportChartsWrapperProps {
  loftRevenue: LoftRevenue[]
  monthlyRevenue: MonthlyRevenue[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function ReportChartsWrapper({ loftRevenue, monthlyRevenue }: ReportChartsWrapperProps) {
  const t = useTranslations("analytics")

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Revenus et Dépenses par Loft */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            {t('revenueExpensesByLoft')}
          </CardTitle>
          <CardDescription>
            {t('trackRevenueExpenses')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={loftRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value?.toLocaleString()} DA`,
                  name === 'revenue' ? t('revenue') : 
                  name === 'expenses' ? t('expenses') : 
                  t('netProfit')
                ]}
              />
              <Bar dataKey="revenue" fill="#0088FE" name="revenue" />
              <Bar dataKey="expenses" fill="#FF8042" name="expenses" />
              <Bar dataKey="net_profit" fill="#00C49F" name="net_profit" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tendance Mensuelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            {t('monthlyFinancialTrend')}
          </CardTitle>
          <CardDescription>
            {t('trends')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value?.toLocaleString()} DA`,
                  name === 'revenue' ? t('revenue') : t('expenses')
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#0088FE" 
                strokeWidth={3}
                name="revenue"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#FF8042" 
                strokeWidth={3}
                name="expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 5 Lofts les Plus Rentables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            {t('top5ProfitableLofts')}
          </CardTitle>
          <CardDescription>
            {t('mostValuableAssets')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={loftRevenue.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value?.toLocaleString()} DA`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="net_profit"
              >
                {loftRevenue.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value?.toLocaleString()} DA`, t('netProfit')]}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}