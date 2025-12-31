"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n/context"

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

interface RevenueChartProps {
  monthlyRevenue: MonthlyRevenueData[];
}

export function RevenueChart({ monthlyRevenue }: RevenueChartProps) {
  const { t } = useTranslation('dashboard');
  
  // Fallback data if no data provided
  const chartData = monthlyRevenue.length > 0 ? monthlyRevenue : [
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Fév', revenue: 52000, expenses: 35000 },
    { month: 'Mar', revenue: 48000, expenses: 33000 },
    { month: 'Avr', revenue: 61000, expenses: 40000 },
    { month: 'Mai', revenue: 55000, expenses: 37000 },
    { month: 'Jun', revenue: 67000, expenses: 42000 },
  ];
  
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  // Calculate max value for scaling
  const maxValue = Math.max(...chartData.map(item => Math.max(item.revenue, item.expenses)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('revenueVsExpenses')}</CardTitle>
        <CardDescription>{t('monthlyFinancialOverview')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {totalRevenue.toLocaleString()} DA
              </div>
              <div className="text-sm text-green-700">Revenus Total</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {totalExpenses.toLocaleString()} DA
              </div>
              <div className="text-sm text-red-700">Dépenses Total</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {netProfit.toLocaleString()} DA
              </div>
              <div className="text-sm text-blue-700">Bénéfice Net</div>
            </div>
          </div>
          
          {/* Modern Beautiful Chart */}
          <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  📈 Analyse Financière
                </h4>
                <p className="text-sm text-gray-600">Performance mensuelle • Tendances et évolution</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                  <span className="text-sm font-medium text-gray-700">Revenus</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-red-600"></div>
                  <span className="text-sm font-medium text-gray-700">Dépenses</span>
                </div>
              </div>
            </div>
            
            {/* Beautiful SVG Chart - FULL WIDTH */}
            <div className="relative bg-white rounded-lg p-8 shadow-inner border">
              <svg viewBox="0 0 800 350" className="w-full h-80">
                <defs>
                  {/* Gradients for beautiful fills */}
                  <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1"/>
                  </linearGradient>
                  <linearGradient id="revenueStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#059669"/>
                    <stop offset="100%" stopColor="#10b981"/>
                  </linearGradient>
                  <linearGradient id="expenseStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#dc2626"/>
                    <stop offset="100%" stopColor="#ef4444"/>
                  </linearGradient>
                </defs>
                
                {/* Grid lines - More space */}
                <g stroke="#f3f4f6" strokeWidth="1">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <line key={i} x1="80" y1={60 + i * 45} x2="720" y2={60 + i * 45} />
                  ))}
                  {chartData.map((_, i) => (
                    <line key={i} x1={80 + i * 106.67} y1="60" x2={80 + i * 106.67} y2="285" />
                  ))}
                </g>
                
                {/* Revenue Area Chart - Wider */}
                <path
                  d={`M 80 ${285 - (chartData[0].revenue / maxValue) * 225} ${chartData.map((item, i) => 
                    `L ${80 + i * 106.67} ${285 - (item.revenue / maxValue) * 225}`
                  ).join(' ')} L 720 285 L 80 285 Z`}
                  fill="url(#revenueGradient)"
                  className="animate-pulse"
                />
                
                {/* Expense Area Chart - Wider */}
                <path
                  d={`M 80 ${285 - (chartData[0].expenses / maxValue) * 225} ${chartData.map((item, i) => 
                    `L ${80 + i * 106.67} ${285 - (item.expenses / maxValue) * 225}`
                  ).join(' ')} L 720 285 L 80 285 Z`}
                  fill="url(#expenseGradient)"
                  className="animate-pulse"
                />
                
                {/* Revenue Line - Wider */}
                <path
                  d={`M 80 ${285 - (chartData[0].revenue / maxValue) * 225} ${chartData.map((item, i) => 
                    `L ${80 + i * 106.67} ${285 - (item.revenue / maxValue) * 225}`
                  ).join(' ')}`}
                  stroke="url(#revenueStroke)"
                  strokeWidth="4"
                  fill="none"
                  className="drop-shadow-sm"
                />
                
                {/* Expense Line - Wider */}
                <path
                  d={`M 80 ${285 - (chartData[0].expenses / maxValue) * 225} ${chartData.map((item, i) => 
                    `L ${80 + i * 106.67} ${285 - (item.expenses / maxValue) * 225}`
                  ).join(' ')}`}
                  stroke="url(#expenseStroke)"
                  strokeWidth="4"
                  fill="none"
                  className="drop-shadow-sm"
                />
                
                {/* Data Points - Bigger */}
                {chartData.map((item, i) => (
                  <g key={i}>
                    {/* Revenue Point */}
                    <circle
                      cx={80 + i * 106.67}
                      cy={285 - (item.revenue / maxValue) * 225}
                      r="8"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="3"
                      className="drop-shadow-lg hover:r-10 transition-all cursor-pointer"
                    />
                    {/* Expense Point */}
                    <circle
                      cx={80 + i * 106.67}
                      cy={285 - (item.expenses / maxValue) * 225}
                      r="8"
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth="3"
                      className="drop-shadow-lg hover:r-10 transition-all cursor-pointer"
                    />
                    
                    {/* Value Labels on Points */}
                    <text
                      x={80 + i * 106.67}
                      y={285 - (item.revenue / maxValue) * 225 - 15}
                      textAnchor="middle"
                      className="text-xs font-bold fill-emerald-600"
                    >
                      {(item.revenue / 1000).toFixed(0)}k
                    </text>
                    <text
                      x={80 + i * 106.67}
                      y={285 - (item.expenses / maxValue) * 225 - 15}
                      textAnchor="middle"
                      className="text-xs font-bold fill-red-600"
                    >
                      {(item.expenses / 1000).toFixed(0)}k
                    </text>
                  </g>
                ))}
                
                {/* Month Labels - Bigger */}
                {chartData.map((item, i) => (
                  <text
                    key={i}
                    x={80 + i * 106.67}
                    y="310"
                    textAnchor="middle"
                    className="text-sm font-semibold fill-gray-700"
                  >
                    {item.month}
                  </text>
                ))}
                
                {/* Y-axis Labels - More detailed */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <text
                    key={i}
                    x="65"
                    y={290 - i * 45}
                    textAnchor="end"
                    className="text-sm font-medium fill-gray-600"
                  >
                    {(maxValue * i / 5 / 1000).toFixed(0)}k DA
                  </text>
                ))}
              </svg>
              
              {/* Enhanced Hover Info */}
              <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">📊 Analyse Période</div>
                <div className="font-bold text-gray-900 text-lg">Jan - Jun 2024</div>
                <div className="text-xs text-emerald-600 mt-1">Tendance: ↗ Croissance</div>
              </div>
            </div>
            
            {/* Modern Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">↗</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {(totalRevenue / 1000).toFixed(0)}k DA
                    </div>
                    <div className="text-xs text-emerald-600 font-medium">Revenus Totaux</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">↘</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-700">
                      {(totalExpenses / 1000).toFixed(0)}k DA
                    </div>
                    <div className="text-xs text-red-600 font-medium">Dépenses Totales</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">💰</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-700">
                      {(netProfit / 1000).toFixed(0)}k DA
                    </div>
                    <div className="text-xs text-blue-600 font-medium">Bénéfice Net</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Indicator */}
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                <span>📊</span>
                <span>Performance Excellente • Croissance Positive</span>
                <span>✨</span>
              </div>
            </div>
          </div>
          
          {/* Monthly Data Table */}
          <div className="mt-4">
            <h4 className="font-medium mb-3 text-gray-700">📋 Données Mensuelles Détaillées:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {chartData.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border shadow-sm">
                  <span className="font-medium text-gray-700">{item.month}</span>
                  <div className="flex gap-6">
                    <span className="text-green-600 font-medium">↗ {item.revenue.toLocaleString()} DA</span>
                    <span className="text-red-600 font-medium">↘ {item.expenses.toLocaleString()} DA</span>
                    <span className="text-blue-600 font-medium">
                      = {(item.revenue - item.expenses).toLocaleString()} DA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          

        </div>
      </CardContent>
    </Card>
  )
}
