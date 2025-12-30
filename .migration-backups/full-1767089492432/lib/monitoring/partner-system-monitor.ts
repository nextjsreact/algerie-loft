/**
 * Partner System Monitoring and Alerting
 * Provides comprehensive monitoring for the partner dashboard system
 */

import { createClient } from '@/utils/supabase/server';

export interface PartnerSystemMetrics {
  // Registration Metrics
  daily_registrations: number;
  weekly_registrations: number;
  monthly_registrations: number;
  registration_conversion_rate: number;
  
  // Approval Metrics
  pending_validations: number;
  average_approval_time_hours: number;
  approval_rate_percentage: number;
  rejected_applications: number;
  
  // Usage Metrics
  total_active_partners: number;
  daily_active_partners: number;
  weekly_active_partners: number;
  dashboard_sessions_today: number;
  
  // Revenue Metrics
  total_partner_revenue: number;
  average_revenue_per_partner: number;
  monthly_revenue_growth: number;
  
  // System Health
  api_response_time_ms: number;
  error_rate_percentage: number;
  database_connection_pool_usage: number;
  
  // Data Quality
  partners_with_complete_profiles: number;
  properties_without_images: number;
  reservations_missing_data: number;
}

export interface PartnerSystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  current_value: number;
  timestamp: string;
  resolved: boolean;
}

export class PartnerSystemMonitor {
  private static instance: PartnerSystemMonitor;
  private alerts: PartnerSystemAlert[] = [];
  private metrics: PartnerSystemMetrics | null = null;
  private lastUpdate: Date | null = null;

  static getInstance(): PartnerSystemMonitor {
    if (!PartnerSystemMonitor.instance) {
      PartnerSystemMonitor.instance = new PartnerSystemMonitor();
    }
    return PartnerSystemMonitor.instance;
  }

  /**
   * Collect all partner system metrics
   */
  async collectMetrics(): Promise<PartnerSystemMetrics> {
    const supabase = await createClient(true); // Use service role for monitoring
    
    try {
      // Registration Metrics
      const registrationMetrics = await this.getRegistrationMetrics(supabase);
      
      // Approval Metrics
      const approvalMetrics = await this.getApprovalMetrics(supabase);
      
      // Usage Metrics
      const usageMetrics = await this.getUsageMetrics(supabase);
      
      // Revenue Metrics
      const revenueMetrics = await this.getRevenueMetrics(supabase);
      
      // System Health Metrics
      const healthMetrics = await this.getSystemHealthMetrics(supabase);
      
      // Data Quality Metrics
      const qualityMetrics = await this.getDataQualityMetrics(supabase);

      this.metrics = {
        ...registrationMetrics,
        ...approvalMetrics,
        ...usageMetrics,
        ...revenueMetrics,
        ...healthMetrics,
        ...qualityMetrics
      };

      this.lastUpdate = new Date();
      
      // Check for alerts after collecting metrics
      await this.checkAlerts();
      
      return this.metrics;

    } catch (error) {
      console.error('Error collecting partner system metrics:', error);
      throw error;
    }
  }

  /**
   * Get registration-related metrics
   */
  private async getRegistrationMetrics(supabase: any) {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Daily registrations
    const { count: dailyRegistrations } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString().split('T')[0]);

    // Weekly registrations
    const { count: weeklyRegistrations } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Monthly registrations
    const { count: monthlyRegistrations } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());

    // Registration conversion rate (approved / total)
    const { count: totalRegistrations } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true });

    const { count: approvedRegistrations } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'approved');

    const registrationConversionRate = totalRegistrations > 0 
      ? (approvedRegistrations / totalRegistrations) * 100 
      : 0;

    return {
      daily_registrations: dailyRegistrations || 0,
      weekly_registrations: weeklyRegistrations || 0,
      monthly_registrations: monthlyRegistrations || 0,
      registration_conversion_rate: Math.round(registrationConversionRate * 100) / 100
    };
  }

  /**
   * Get approval-related metrics
   */
  private async getApprovalMetrics(supabase: any) {
    // Pending validations
    const { count: pendingValidations } = await supabase
      .from('partner_validation_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Average approval time
    const { data: approvedRequests } = await supabase
      .from('partner_validation_requests')
      .select('created_at, processed_at')
      .eq('status', 'approved')
      .not('processed_at', 'is', null)
      .limit(100);

    let averageApprovalTime = 0;
    if (approvedRequests && approvedRequests.length > 0) {
      const totalTime = approvedRequests.reduce((sum, request) => {
        const created = new Date(request.created_at);
        const processed = new Date(request.processed_at);
        return sum + (processed.getTime() - created.getTime());
      }, 0);
      averageApprovalTime = totalTime / approvedRequests.length / (1000 * 60 * 60); // Convert to hours
    }

    // Approval rate
    const { count: totalRequests } = await supabase
      .from('partner_validation_requests')
      .select('id', { count: 'exact', head: true })
      .in('status', ['approved', 'rejected']);

    const { count: approvedRequests2 } = await supabase
      .from('partner_validation_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');

    const approvalRate = totalRequests > 0 
      ? (approvedRequests2 / totalRequests) * 100 
      : 0;

    // Rejected applications
    const { count: rejectedApplications } = await supabase
      .from('partner_validation_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected');

    return {
      pending_validations: pendingValidations || 0,
      average_approval_time_hours: Math.round(averageApprovalTime * 100) / 100,
      approval_rate_percentage: Math.round(approvalRate * 100) / 100,
      rejected_applications: rejectedApplications || 0
    };
  }

  /**
   * Get usage-related metrics
   */
  private async getUsageMetrics(supabase: any) {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total active partners
    const { count: totalActivePartners } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'approved');

    // Daily active partners (logged in today)
    const { count: dailyActivePartners } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'approved')
      .gte('last_login_at', today.toISOString().split('T')[0]);

    // Weekly active partners
    const { count: weeklyActivePartners } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'approved')
      .gte('last_login_at', weekAgo.toISOString());

    // Dashboard sessions today (would need session tracking)
    const dashboardSessionsToday = dailyActivePartners || 0; // Simplified

    return {
      total_active_partners: totalActivePartners || 0,
      daily_active_partners: dailyActivePartners || 0,
      weekly_active_partners: weeklyActivePartners || 0,
      dashboard_sessions_today: dashboardSessionsToday
    };
  }

  /**
   * Get revenue-related metrics
   */
  private async getRevenueMetrics(supabase: any) {
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const thisMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    // Get all partner properties
    const { data: partnerProperties } = await supabase
      .from('lofts')
      .select('id, partner_id')
      .not('partner_id', 'is', null);

    if (!partnerProperties || partnerProperties.length === 0) {
      return {
        total_partner_revenue: 0,
        average_revenue_per_partner: 0,
        monthly_revenue_growth: 0
      };
    }

    const propertyIds = partnerProperties.map(p => p.id);

    // Get revenue data
    const { data: revenueData } = await supabase
      .from('reservations')
      .select('pricing, check_out_date, loft_id')
      .in('loft_id', propertyIds)
      .eq('status', 'completed')
      .gte('check_out_date', lastMonth.toISOString());

    let totalRevenue = 0;
    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;

    revenueData?.forEach(reservation => {
      const checkOut = new Date(reservation.check_out_date);
      const amount = reservation.pricing?.total_amount || 0;
      
      totalRevenue += amount;
      
      if (checkOut >= thisMonthStart) {
        currentMonthRevenue += amount;
      } else if (checkOut >= lastMonth && checkOut < thisMonthStart) {
        lastMonthRevenue += amount;
      }
    });

    // Calculate average revenue per partner
    const uniquePartners = new Set(partnerProperties.map(p => p.partner_id));
    const averageRevenuePerPartner = uniquePartners.size > 0 
      ? totalRevenue / uniquePartners.size 
      : 0;

    // Calculate monthly growth rate
    const monthlyGrowthRate = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    return {
      total_partner_revenue: Math.round(totalRevenue),
      average_revenue_per_partner: Math.round(averageRevenuePerPartner),
      monthly_revenue_growth: Math.round(monthlyGrowthRate * 100) / 100
    };
  }

  /**
   * Get system health metrics
   */
  private async getSystemHealthMetrics(supabase: any) {
    const startTime = Date.now();
    
    try {
      // Test database response time
      await supabase.from('partners').select('id').limit(1);
      const responseTime = Date.now() - startTime;

      // Get error rate from audit logs (simplified)
      const { count: totalRequests } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { count: errorRequests } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .like('new_values', '%error%');

      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

      return {
        api_response_time_ms: responseTime,
        error_rate_percentage: Math.round(errorRate * 100) / 100,
        database_connection_pool_usage: 0 // Would need actual pool monitoring
      };

    } catch (error) {
      return {
        api_response_time_ms: 9999,
        error_rate_percentage: 100,
        database_connection_pool_usage: 100
      };
    }
  }

  /**
   * Get data quality metrics
   */
  private async getDataQualityMetrics(supabase: any) {
    // Partners with complete profiles
    const { count: totalPartners } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true });

    const { count: completeProfiles } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .not('business_name', 'is', null)
      .not('phone', 'is', null)
      .not('address', 'is', null);

    // Properties without images (simplified check)
    const { count: propertiesWithoutImages } = await supabase
      .from('lofts')
      .select('id', { count: 'exact', head: true })
      .not('partner_id', 'is', null)
      .is('images', null);

    // Reservations missing data
    const { count: reservationsMissingData } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .is('guest_info', null);

    return {
      partners_with_complete_profiles: completeProfiles || 0,
      properties_without_images: propertiesWithoutImages || 0,
      reservations_missing_data: reservationsMissingData || 0
    };
  }

  /**
   * Check for alerts based on current metrics
   */
  private async checkAlerts(): Promise<void> {
    if (!this.metrics) return;

    const newAlerts: PartnerSystemAlert[] = [];

    // Critical: High error rate
    if (this.metrics.error_rate_percentage > 5) {
      newAlerts.push({
        id: `error-rate-${Date.now()}`,
        type: 'critical',
        title: 'High Error Rate Detected',
        description: `Error rate is ${this.metrics.error_rate_percentage}%, exceeding 5% threshold`,
        metric: 'error_rate_percentage',
        threshold: 5,
        current_value: this.metrics.error_rate_percentage,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Warning: Slow API response
    if (this.metrics.api_response_time_ms > 2000) {
      newAlerts.push({
        id: `slow-api-${Date.now()}`,
        type: 'warning',
        title: 'Slow API Response Time',
        description: `API response time is ${this.metrics.api_response_time_ms}ms, exceeding 2000ms threshold`,
        metric: 'api_response_time_ms',
        threshold: 2000,
        current_value: this.metrics.api_response_time_ms,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Warning: Many pending validations
    if (this.metrics.pending_validations > 10) {
      newAlerts.push({
        id: `pending-validations-${Date.now()}`,
        type: 'warning',
        title: 'High Number of Pending Validations',
        description: `${this.metrics.pending_validations} validations are pending, exceeding 10 threshold`,
        metric: 'pending_validations',
        threshold: 10,
        current_value: this.metrics.pending_validations,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Info: Low approval rate
    if (this.metrics.approval_rate_percentage < 70) {
      newAlerts.push({
        id: `low-approval-rate-${Date.now()}`,
        type: 'info',
        title: 'Low Approval Rate',
        description: `Approval rate is ${this.metrics.approval_rate_percentage}%, below 70% threshold`,
        metric: 'approval_rate_percentage',
        threshold: 70,
        current_value: this.metrics.approval_rate_percentage,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Add new alerts
    this.alerts.push(...newAlerts);

    // Send notifications for new alerts
    for (const alert of newAlerts) {
      await this.sendAlertNotification(alert);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: PartnerSystemAlert): Promise<void> {
    try {
      // Log alert
      console.warn(`Partner System Alert [${alert.type.toUpperCase()}]:`, {
        title: alert.title,
        description: alert.description,
        metric: alert.metric,
        threshold: alert.threshold,
        current_value: alert.current_value,
        timestamp: alert.timestamp
      });

      // In a real implementation, this would send notifications via:
      // - Email
      // - Slack
      // - PagerDuty
      // - SMS
      // etc.

    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PartnerSystemMetrics | null {
    return this.metrics;
  }

  /**
   * Get current alerts
   */
  getAlerts(): PartnerSystemAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Get system health status
   */
  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const criticalAlerts = this.alerts.filter(a => !a.resolved && a.type === 'critical');
    const warningAlerts = this.alerts.filter(a => !a.resolved && a.type === 'warning');

    if (criticalAlerts.length > 0) return 'critical';
    if (warningAlerts.length > 0) return 'warning';
    return 'healthy';
  }
}