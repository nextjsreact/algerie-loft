'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function BudgetAlertsDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget Alerts Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Budget alerts dashboard content will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}