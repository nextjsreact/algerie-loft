"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

  // Calculer les valeurs max pour le scaling (avec valeur par défaut pour éviter -Infinity)
  const maxRevenue = loftRevenue.length > 0 
    ? Math.max(...loftRevenue.map(item => Math.max(item.revenue, item.expenses, item.net_profit)), 1)
    : 1
  const maxMonthlyValue = monthlyRevenue.length > 0
    ? Math.max(...monthlyRevenue.map(item => Math.max(item.revenue, item.expenses)), 1)
    : 1

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
          <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-700">{t('revenue')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700">{t('expenses')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">{t('netProfit')}</span>
                </div>
              </div>
            </div>
            
            <div className="relative bg-white rounded-lg p-4 shadow-inner border">
              <svg viewBox="0 0 1000 400" className="w-full h-80">
                <defs>
                  <linearGradient id="revenueGradientBar" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0088FE" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#0088FE" stopOpacity="0.6"/>
                  </linearGradient>
                  <linearGradient id="expenseGradientBar" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FF8042" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#FF8042" stopOpacity="0.6"/>
                  </linearGradient>
                  <linearGradient id="profitGradientBar" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00C49F" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#00C49F" stopOpacity="0.6"/>
                  </linearGradient>
                </defs>
                
                {/* Grid lines */}
                <g stroke="#f3f4f6" strokeWidth="1">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <line key={i} x1="80" y1={60 + i * 50} x2="920" y2={60 + i * 50} />
                  ))}
                </g>
                
                {/* Bars */}
                {loftRevenue.slice(0, 8).map((item, index) => {
                  const x = 100 + index * 100;
                  const barWidth = 25;
                  
                  const revenueHeight = (item.revenue / maxRevenue) * 250;
                  const expenseHeight = (item.expenses / maxRevenue) * 250;
                  const profitHeight = (item.net_profit / maxRevenue) * 250;
                  
                  return (
                    <g key={index}>
                      {/* Revenue bar */}
                      <rect
                        x={x - barWidth}
                        y={310 - revenueHeight}
                        width={barWidth}
                        height={revenueHeight}
                        fill="url(#revenueGradientBar)"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                      
                      {/* Expense bar */}
                      <rect
                        x={x}
                        y={310 - expenseHeight}
                        width={barWidth}
                        height={expenseHeight}
                        fill="url(#expenseGradientBar)"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                      
                      {/* Profit bar */}
                      <rect
                        x={x + barWidth}
                        y={310 - profitHeight}
                        width={barWidth}
                        height={profitHeight}
                        fill="url(#profitGradientBar)"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                      
                      {/* Loft name */}
                      <text
                        x={x + barWidth/2}
                        y="340"
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700"
                        transform={`rotate(-45, ${x + barWidth/2}, 340)`}
                      >
                        {item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name}
                      </text>
                      
                      {/* Values on hover */}
                      <text
                        x={x + barWidth/2}
                        y={305 - Math.max(revenueHeight, expenseHeight, profitHeight) - 5}
                        textAnchor="middle"
                        className="text-xs font-bold fill-gray-600"
                      >
                        {(item.net_profit / 1000).toFixed(0)}k
                      </text>
                    </g>
                  );
                })}
                
                {/* Y-axis labels */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <text
                    key={i}
                    x="65"
                    y={315 - i * 50}
                    textAnchor="end"
                    className="text-sm font-medium fill-gray-600"
                  >
                    {(maxRevenue * i / 5 / 1000).toFixed(0)}k DA
                  </text>
                ))}
              </svg>
            </div>
          </div>
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
          <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border shadow-lg">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-700">{t('revenue')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700">{t('expenses')}</span>
              </div>
            </div>

            {/* Scrollable chart — 12 months × 80px = 960px wide */}
            <div className="overflow-x-auto">
              <div className="relative bg-white rounded-lg p-4 shadow-inner border" style={{ minWidth: '960px' }}>
                <svg viewBox="0 0 1020 300" className="w-full h-64">
                  <defs>
                    <linearGradient id="revenueLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0088FE"/>
                      <stop offset="100%" stopColor="#00C49F"/>
                    </linearGradient>
                    <linearGradient id="expenseLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF8042"/>
                      <stop offset="100%" stopColor="#FF4444"/>
                    </linearGradient>
                  </defs>

                  {/* Grid */}
                  <g stroke="#f3f4f6" strokeWidth="1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <line key={i} x1="60" y1={50 + i * 40} x2="980" y2={50 + i * 40} />
                    ))}
                  </g>

                  {/* Revenue line */}
                  {monthlyRevenue.length > 0 && (
                    <path
                      d={monthlyRevenue.map((item, i) =>
                        `${i === 0 ? 'M' : 'L'} ${80 + i * 80} ${210 - (item.revenue / maxMonthlyValue) * 160}`
                      ).join(' ')}
                      stroke="url(#revenueLineGradient)"
                      strokeWidth="3"
                      fill="none"
                    />
                  )}

                  {/* Expense line */}
                  {monthlyRevenue.length > 0 && (
                    <path
                      d={monthlyRevenue.map((item, i) =>
                        `${i === 0 ? 'M' : 'L'} ${80 + i * 80} ${210 - (item.expenses / maxMonthlyValue) * 160}`
                      ).join(' ')}
                      stroke="url(#expenseLineGradient)"
                      strokeWidth="3"
                      fill="none"
                    />
                  )}

                  {/* Data points + month labels */}
                  {monthlyRevenue.map((item, i) => (
                    <g key={i}>
                      <circle cx={80 + i * 80} cy={210 - (item.revenue / maxMonthlyValue) * 160} r="5" fill="#0088FE" stroke="white" strokeWidth="2" />
                      <circle cx={80 + i * 80} cy={210 - (item.expenses / maxMonthlyValue) * 160} r="5" fill="#FF8042" stroke="white" strokeWidth="2" />
                      {/* Value label above revenue dot */}
                      <text x={80 + i * 80} y={200 - (item.revenue / maxMonthlyValue) * 160} textAnchor="middle" fontSize="9" fill="#0088FE">
                        {item.revenue > 0 ? `${(item.revenue / 1000).toFixed(0)}k` : ''}
                      </text>
                      <text x={80 + i * 80} y="240" textAnchor="middle" fontSize="11" fill="#374151">
                        {item.month}
                      </text>
                    </g>
                  ))}

                  {/* Y-axis labels */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <text key={i} x="55" y={215 - i * 40} textAnchor="end" fontSize="10" fill="#6b7280">
                      {(maxMonthlyValue * i / 4 / 1000).toFixed(0)}k
                    </text>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Lofts les Plus Rentables */}