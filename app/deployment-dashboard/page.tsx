/**
 * Deployment Dashboard Page
 * 
 * Provides a comprehensive dashboard for monitoring deployment status,
 * feature flags, and rollback capabilities.
 */

import { MonitoringDashboard } from '../../components/deployment/monitoring-dashboard'

export default function DeploymentDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MonitoringDashboard />
    </div>
  )
}

export const metadata = {
  title: 'Deployment Dashboard - Loft Algérie',
  description: 'Real-time monitoring dashboard for deployment status and feature flags',
}