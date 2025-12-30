import { reservationAuditService, SecurityEvent } from './reservation-audit-service'
import { reservationErrorTrackingService } from './reservation-error-tracking'
import { logger } from '@/lib/logger'
import { trackError } from '@/lib/monitoring/error-tracking'

/**
 * Security monitoring service for reservation flow
 * Requirements: 10.4
 */

export interface SecurityThreat {
  threat_id: string
  threat_type: SecurityThreatType
  severity: 'low' | 'medium' | 'high' | 'critical'
  user_id?: string
  ip_address?: string
  user_agent?: string
  reservation_id?: string
  detection_time: string
  indicators: string[]
  risk_score: number
  blocked: boolean
  mitigation_actions: string[]
}

export type SecurityThreatType = 
  | 'brute_force_attack'
  | 'credential_stuffing'
  | 'payment_fraud'
  | 'booking_fraud'
  | 'data_scraping'
  | 'ddos_attack'
  | 'injection_attack'
  | 'session_hijacking'
  | 'account_takeover'
  | 'fake_booking'
  | 'rate_limit_violation'
  | 'suspicious_behavior'

export interface SecurityMetrics {
  total_threats: number
  threats_by_type: Record<SecurityThreatType, number>
  threats_by_severity: Record<string, number>
  blocked_requests: number
  false_positives: number
  detection_accuracy: number
  response_time: number
  top_threat_sources: Array<{ ip: string; count: number }>
}

export interface RateLimitRule {
  rule_id: string
  endpoint_pattern: string
  max_requests: number
  time_window_minutes: number
  user_based: boolean
  ip_based: boolean
  enabled: boolean
}

export class ReservationSecurityMonitoringService {
  private threatStore: Map<string, SecurityThreat> = new Map()
  private rateLimitCounters: Map<string, { count: number; reset_time: number }> = new Map()
  private suspiciousIPs: Set<string> = new Set()
  private blockedIPs: Set<string> = new Set()

  private defaultRateLimits: RateLimitRule[] = [
    {
      rule_id: 'auth_attempts',
      endpoint_pattern: '/api/auth/*',
      max_requests: 5,
      time_window_minutes: 15,
      user_based: false,
      ip_based: true,
      enabled: true
    },
    {
      rule_id: 'reservation_creation',
      endpoint_pattern: '/api/reservations',
      max_requests: 10,
      time_window_minutes: 60,
      user_based: true,
      ip_based: true,
      enabled: true
    },
    {
      rule_id: 'availability_checks',
      endpoint_pattern: '/api/availability/*',
      max_requests: 100,
      time_window_minutes: 60,
      user_based: false,
      ip_based: true,
      enabled: true
    },
    {
      rule_id: 'payment_attempts',
      endpoint_pattern: '/api/payments/*',
      max_requests: 3,
      time_window_minutes: 30,
      user_based: true,
      ip_based: true,
      enabled: true
    }
  ]

  /**
   * Monitor and detect security threats in reservation flow
   * Requirements: 10.4
   */
  async detectSecurityThreats(
    context: {
      user_id?: string
      session_id?: string
      ip_address?: string
      user_agent?: string
      endpoint?: string
      method?: string
      request_body?: any
      reservation_id?: string
    }
  ): Promise<SecurityThreat[]> {
    try {
      const threats: SecurityThreat[] = []
      const currentTime = Date.now()

      // 1. Check for brute force attacks
      const bruteForceThreats = await this.detectBruteForceAttacks(context)
      threats.push(...bruteForceThreats)

      // 2. Check for payment fraud
      const paymentFraudThreats = await this.detectPaymentFraud(context)
      threats.push(...paymentFraudThreats)

      // 3. Check for booking fraud
      const bookingFraudThreats = await this.detectBookingFraud(context)
      threats.push(...bookingFraudThreats)

      // 4. Check for data scraping
      const scrapingThreats = await this.detectDataScraping(context)
      threats.push(...scrapingThreats)

      // 5. Check for injection attacks
      const injectionThreats = await this.detectInjectionAttacks(context)
      threats.push(...injectionThreats)

      // 6. Check rate limits
      const rateLimitThreats = await this.checkRateLimits(context)
      threats.push(...rateLimitThreats)

      // 7. Check for suspicious behavior patterns
      const behaviorThreats = await this.detectSuspiciousBehavior(context)
      threats.push(...behaviorThreats)

      // Store and process detected threats
      for (const threat of threats) {
        await this.processThreat(threat)
      }

      return threats

    } catch (error) {
      logger.error('Error detecting security threats', error, { context })
      return []
    }
  }

  /**
   * Check if request should be blocked based on security rules
   * Requirements: 10.4
   */
  async shouldBlockRequest(
    context: {
      user_id?: string
      ip_address?: string
      user_agent?: string
      endpoint?: string
      method?: string
    }
  ): Promise<{ blocked: boolean; reason?: string; threat_id?: string }> {
    try {
      // Check if IP is blocked
      if (context.ip_address && this.blockedIPs.has(context.ip_address)) {
        return {
          blocked: true,
          reason: 'IP address is blocked due to security violations'
        }
      }

      // Check rate limits
      const rateLimitViolation = await this.checkRateLimitViolation(context)
      if (rateLimitViolation.violated) {
        return {
          blocked: true,
          reason: `Rate limit exceeded: ${rateLimitViolation.rule_id}`,
          threat_id: rateLimitViolation.threat_id
        }
      }

      // Check for active threats
      const activeThreats = Array.from(this.threatStore.values())
        .filter(threat => 
          threat.severity === 'critical' &&
          threat.blocked &&
          (threat.ip_address === context.ip_address || threat.user_id === context.user_id)
        )

      if (activeThreats.length > 0) {
        return {
          blocked: true,
          reason: 'Active security threat detected',
          threat_id: activeThreats[0].threat_id
        }
      }

      return { blocked: false }

    } catch (error) {
      logger.error('Error checking request blocking', error, { context })
      return { blocked: false }
    }
  }

  /**
   * Get security metrics for monitoring dashboard
   * Requirements: 10.4
   */
  getSecurityMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): SecurityMetrics {
    const hours = this.getHoursFromTimeRange(timeRange)
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000)
    
    const recentThreats = Array.from(this.threatStore.values())
      .filter(threat => new Date(threat.detection_time).getTime() > cutoffTime)

    const threatsByType: Record<string, number> = {}
    const threatsBySeverity: Record<string, number> = {}
    const threatSources: Record<string, number> = {}
    let blockedRequests = 0

    recentThreats.forEach(threat => {
      threatsByType[threat.threat_type] = (threatsByType[threat.threat_type] || 0) + 1
      threatsBySeverity[threat.severity] = (threatsBySeverity[threat.severity] || 0) + 1
      
      if (threat.blocked) {
        blockedRequests++
      }
      
      if (threat.ip_address) {
        threatSources[threat.ip_address] = (threatSources[threat.ip_address] || 0) + 1
      }
    })

    const topThreatSources = Object.entries(threatSources)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      total_threats: recentThreats.length,
      threats_by_type: threatsByType as Record<SecurityThreatType, number>,
      threats_by_severity: threatsBySeverity,
      blocked_requests: blockedRequests,
      false_positives: 0, // Would be calculated based on manual reviews
      detection_accuracy: 95, // Would be calculated based on validation
      response_time: 150, // Average response time in ms
      top_threat_sources: topThreatSources
    }
  }

  /**
   * Block IP address due to security violations
   * Requirements: 10.4
   */
  async blockIPAddress(
    ipAddress: string,
    reason: string,
    duration?: number,
    blockedBy?: string
  ): Promise<void> {
    try {
      this.blockedIPs.add(ipAddress)
      
      logger.warn('IP address blocked', {
        ip_address: ipAddress,
        reason,
        duration,
        blocked_by: blockedBy,
        timestamp: new Date().toISOString()
      })

      // Log security event
      await reservationAuditService.logSecurityEvent(
        `ip_block_${Date.now()}`,
        {
          event_type: 'suspicious_activity',
          severity: 'high',
          ip_address: ipAddress,
          details: {
            action: 'ip_blocked',
            reason,
            duration,
            blocked_by: blockedBy
          },
          timestamp: new Date().toISOString()
        }
      )

      // Auto-unblock after duration if specified
      if (duration) {
        setTimeout(() => {
          this.unblockIPAddress(ipAddress, 'Auto-unblock after duration')
        }, duration * 1000)
      }

    } catch (error) {
      logger.error('Error blocking IP address', error, { ipAddress, reason })
    }
  }

  /**
   * Unblock IP address
   * Requirements: 10.4
   */
  async unblockIPAddress(ipAddress: string, reason: string, unblockedBy?: string): Promise<void> {
    try {
      this.blockedIPs.delete(ipAddress)
      
      logger.info('IP address unblocked', {
        ip_address: ipAddress,
        reason,
        unblocked_by: unblockedBy,
        timestamp: new Date().toISOString()
      })

      // Log security event
      await reservationAuditService.logSecurityEvent(
        `ip_unblock_${Date.now()}`,
        {
          event_type: 'suspicious_activity',
          severity: 'low',
          ip_address: ipAddress,
          details: {
            action: 'ip_unblocked',
            reason,
            unblocked_by: unblockedBy
          },
          timestamp: new Date().toISOString()
        }
      )

    } catch (error) {
      logger.error('Error unblocking IP address', error, { ipAddress, reason })
    }
  }

  /**
   * Generate security report
   * Requirements: 10.4
   */
  async generateSecurityReport(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<{
    summary: SecurityMetrics
    top_threats: SecurityThreat[]
    blocked_ips: string[]
    recommendations: string[]
    trend_analysis: Array<{ date: string; threats: number; blocked: number }>
  }> {
    try {
      const summary = this.getSecurityMetrics(timeRange)
      
      const hours = this.getHoursFromTimeRange(timeRange)
      const cutoffTime = Date.now() - (hours * 60 * 60 * 1000)
      
      const recentThreats = Array.from(this.threatStore.values())
        .filter(threat => new Date(threat.detection_time).getTime() > cutoffTime)
        .sort((a, b) => b.risk_score - a.risk_score)
        .slice(0, 20)

      const trendAnalysis = this.calculateSecurityTrend(recentThreats, hours)
      const recommendations = this.generateSecurityRecommendations(summary, recentThreats)

      return {
        summary,
        top_threats: recentThreats,
        blocked_ips: Array.from(this.blockedIPs),
        recommendations,
        trend_analysis: trendAnalysis
      }

    } catch (error) {
      logger.error('Error generating security report', error)
      throw error
    }
  }

  /**
   * Private threat detection methods
   */

  private async detectBruteForceAttacks(context: any): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = []
    
    if (context.endpoint?.includes('/auth/') && context.ip_address) {
      const key = `auth_attempts_${context.ip_address}`
      const attempts = this.rateLimitCounters.get(key)
      
      if (attempts && attempts.count > 10) {
        threats.push({
          threat_id: `brute_force_${Date.now()}`,
          threat_type: 'brute_force_attack',
          severity: 'high',
          ip_address: context.ip_address,
          user_agent: context.user_agent,
          detection_time: new Date().toISOString(),
          indicators: ['excessive_auth_attempts', 'failed_logins'],
          risk_score: 80,
          blocked: true,
          mitigation_actions: ['block_ip', 'rate_limit']
        })
      }
    }
    
    return threats
  }

  private async detectPaymentFraud(context: any): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = []
    
    if (context.endpoint?.includes('/payment') && context.request_body) {
      const indicators: string[] = []
      let riskScore = 0
      
      // Check for multiple payment methods
      if (context.user_id) {
        const userPaymentAttempts = this.getUserPaymentAttempts(context.user_id)
        if (userPaymentAttempts > 5) {
          indicators.push('multiple_payment_methods')
          riskScore += 30
        }
      }
      
      // Check for suspicious amounts
      const amount = context.request_body?.amount
      if (amount && (amount > 10000 || amount < 1)) {
        indicators.push('suspicious_amount')
        riskScore += 25
      }
      
      if (riskScore > 40) {
        threats.push({
          threat_id: `payment_fraud_${Date.now()}`,
          threat_type: 'payment_fraud',
          severity: riskScore > 60 ? 'critical' : 'high',
          user_id: context.user_id,
          ip_address: context.ip_address,
          reservation_id: context.reservation_id,
          detection_time: new Date().toISOString(),
          indicators,
          risk_score: riskScore,
          blocked: riskScore > 70,
          mitigation_actions: ['manual_review', 'additional_verification']
        })
      }
    }
    
    return threats
  }

  private async detectBookingFraud(context: any): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = []
    
    if (context.endpoint?.includes('/reservations') && context.user_id) {
      const indicators: string[] = []
      let riskScore = 0
      
      // Check for rapid booking attempts
      const userBookingAttempts = this.getUserBookingAttempts(context.user_id)
      if (userBookingAttempts > 10) {
        indicators.push('excessive_booking_attempts')
        riskScore += 40
      }
      
      // Check for suspicious booking patterns
      if (context.request_body?.check_in_date && context.request_body?.check_out_date) {
        const checkIn = new Date(context.request_body.check_in_date)
        const checkOut = new Date(context.request_body.check_out_date)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        
        if (nights > 365) {
          indicators.push('unusually_long_stay')
          riskScore += 30
        }
      }
      
      if (riskScore > 35) {
        threats.push({
          threat_id: `booking_fraud_${Date.now()}`,
          threat_type: 'booking_fraud',
          severity: riskScore > 60 ? 'high' : 'medium',
          user_id: context.user_id,
          ip_address: context.ip_address,
          reservation_id: context.reservation_id,
          detection_time: new Date().toISOString(),
          indicators,
          risk_score: riskScore,
          blocked: riskScore > 70,
          mitigation_actions: ['manual_review', 'identity_verification']
        })
      }
    }
    
    return threats
  }

  private async detectDataScraping(context: any): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = []
    
    if (context.ip_address) {
      const key = `requests_${context.ip_address}`
      const requests = this.rateLimitCounters.get(key)
      
      // Check for bot-like user agents
      const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i]
      const isBotUserAgent = botPatterns.some(pattern => 
        pattern.test(context.user_agent || '')
      )
      
      if (requests && requests.count > 200 && isBotUserAgent) {
        threats.push({
          threat_id: `scraping_${Date.now()}`,
          threat_type: 'data_scraping',
          severity: 'medium',
          ip_address: context.ip_address,
          user_agent: context.user_agent,
          detection_time: new Date().toISOString(),
          indicators: ['excessive_requests', 'bot_user_agent'],
          risk_score: 60,
          blocked: true,
          mitigation_actions: ['block_ip', 'captcha_challenge']
        })
      }
    }
    
    return threats
  }

  private async detectInjectionAttacks(context: any): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = []
    
    const requestString = JSON.stringify(context.request_body || {}) + (context.endpoint || '')
    
    // SQL injection patterns
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b)/i,
      /(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/i
    ]
    
    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ]
    
    const indicators: string[] = []
    let riskScore = 0
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(requestString)) {
        indicators.push('sql_injection_attempt')
        riskScore += 70
        break
      }
    }
    
    for (const pattern of xssPatterns) {
      if (pattern.test(requestString)) {
        indicators.push('xss_attempt')
        riskScore += 60
        break
      }
    }
    
    if (indicators.length > 0) {
      threats.push({
        threat_id: `injection_${Date.now()}`,
        threat_type: 'injection_attack',
        severity: 'critical',
        user_id: context.user_id,
        ip_address: context.ip_address,
        user_agent: context.user_agent,
        detection_time: new Date().toISOString(),
        indicators,
        risk_score: riskScore,
        blocked: true,
        mitigation_actions: ['block_request', 'block_ip', 'security_alert']
      })
    }
    
    return threats
  }

  private async checkRateLimits(context: any): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = []
    
    for (const rule of this.defaultRateLimits) {
      if (!rule.enabled) continue
      
      const violation = this.checkRuleViolation(rule, context)
      if (violation.violated) {
        threats.push({
          threat_id: `rate_limit_${Date.now()}`,
          threat_type: 'rate_limit_violation',
          severity: 'medium',
          user_id: context.user_id,
          ip_address: context.ip_address,
          detection_time: new Date().toISOString(),
          indicators: ['rate_limit_exceeded'],
          risk_score: 40,
          blocked: true,
          mitigation_actions: ['rate_limit', 'temporary_block']
        })
      }
    }
    
    return threats
  }

  private async detectSuspiciousBehavior(context: any): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = []
    
    // This would implement more sophisticated behavioral analysis
    // For now, return empty array
    
    return threats
  }

  /**
   * Private helper methods
   */

  private async processThreat(threat: SecurityThreat): Promise<void> {
    try {
      // Store threat
      this.threatStore.set(threat.threat_id, threat)
      
      // Log threat
      logger.warn(`[SECURITY THREAT] ${threat.threat_type}`, {
        threat_id: threat.threat_id,
        severity: threat.severity,
        risk_score: threat.risk_score,
        indicators: threat.indicators,
        blocked: threat.blocked
      })
      
      // Log to audit service
      if (threat.reservation_id) {
        await reservationAuditService.logSecurityEvent(
          threat.reservation_id,
          {
            event_type: threat.threat_type,
            severity: threat.severity,
            user_id: threat.user_id,
            ip_address: threat.ip_address,
            user_agent: threat.user_agent,
            details: {
              threat_id: threat.threat_id,
              indicators: threat.indicators,
              risk_score: threat.risk_score,
              mitigation_actions: threat.mitigation_actions
            },
            timestamp: threat.detection_time
          }
        )
      }
      
      // Execute mitigation actions
      await this.executeMitigationActions(threat)
      
      // Send alerts for high-severity threats
      if (threat.severity === 'critical' || threat.severity === 'high') {
        await this.sendSecurityAlert(threat)
      }
      
    } catch (error) {
      logger.error('Error processing security threat', error, { threat })
    }
  }

  private async executeMitigationActions(threat: SecurityThreat): Promise<void> {
    for (const action of threat.mitigation_actions) {
      try {
        switch (action) {
          case 'block_ip':
            if (threat.ip_address) {
              await this.blockIPAddress(
                threat.ip_address,
                `Security threat: ${threat.threat_type}`,
                3600 // 1 hour
              )
            }
            break
          
          case 'block_request':
            // Request is already blocked by returning blocked: true
            break
          
          case 'rate_limit':
            // Rate limiting is handled by the rate limit system
            break
          
          case 'security_alert':
            await this.sendSecurityAlert(threat)
            break
          
          default:
            logger.debug('Unknown mitigation action', { action, threat_id: threat.threat_id })
        }
      } catch (error) {
        logger.error('Error executing mitigation action', error, { action, threat })
      }
    }
  }

  private async sendSecurityAlert(threat: SecurityThreat): Promise<void> {
    try {
      // Track in error monitoring for immediate notification
      trackError(`Security threat detected: ${threat.threat_type}`, {
        action: 'security_threat_alert',
        additionalData: {
          threat_id: threat.threat_id,
          threat_type: threat.threat_type,
          severity: threat.severity,
          risk_score: threat.risk_score,
          indicators: threat.indicators
        }
      }, threat.severity === 'critical' ? 'error' : 'warning')
      
    } catch (error) {
      logger.error('Failed to send security alert', error)
    }
  }

  private checkRateLimit(key: string, limit: number, windowMinutes: number): boolean {
    const now = Date.now()
    const windowMs = windowMinutes * 60 * 1000
    const counter = this.rateLimitCounters.get(key)
    
    if (!counter || counter.reset_time < now) {
      this.rateLimitCounters.set(key, { count: 1, reset_time: now + windowMs })
      return false
    }
    
    counter.count++
    return counter.count > limit
  }

  private checkRateLimitViolation(context: any): { violated: boolean; rule_id?: string; threat_id?: string } {
    for (const rule of this.defaultRateLimits) {
      if (!rule.enabled) continue
      
      const violation = this.checkRuleViolation(rule, context)
      if (violation.violated) {
        return {
          violated: true,
          rule_id: rule.rule_id,
          threat_id: `rate_limit_${Date.now()}`
        }
      }
    }
    
    return { violated: false }
  }

  private checkRuleViolation(rule: RateLimitRule, context: any): { violated: boolean } {
    if (!context.endpoint?.match(rule.endpoint_pattern.replace('*', '.*'))) {
      return { violated: false }
    }
    
    let key = rule.rule_id
    if (rule.user_based && context.user_id) {
      key += `_user_${context.user_id}`
    }
    if (rule.ip_based && context.ip_address) {
      key += `_ip_${context.ip_address}`
    }
    
    return {
      violated: this.checkRateLimit(key, rule.max_requests, rule.time_window_minutes)
    }
  }

  private getUserPaymentAttempts(userId: string): number {
    // This would query actual data - returning mock for now
    return Math.floor(Math.random() * 10)
  }

  private getUserBookingAttempts(userId: string): number {
    // This would query actual data - returning mock for now
    return Math.floor(Math.random() * 15)
  }

  private calculateSecurityTrend(threats: SecurityThreat[], hours: number): Array<{ date: string; threats: number; blocked: number }> {
    const trend: Record<string, { threats: number; blocked: number }> = {}
    const now = new Date()
    
    // Initialize all hours with 0
    for (let i = 0; i < hours; i++) {
      const date = new Date(now.getTime() - (i * 60 * 60 * 1000))
      const hourKey = date.toISOString().substring(0, 13)
      trend[hourKey] = { threats: 0, blocked: 0 }
    }
    
    // Count threats by hour
    threats.forEach(threat => {
      const hourKey = new Date(threat.detection_time).toISOString().substring(0, 13)
      if (trend[hourKey]) {
        trend[hourKey].threats++
        if (threat.blocked) {
          trend[hourKey].blocked++
        }
      }
    })
    
    return Object.entries(trend)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private generateSecurityRecommendations(metrics: SecurityMetrics, threats: SecurityThreat[]): string[] {
    const recommendations: string[] = []
    
    if (metrics.total_threats > 50) {
      recommendations.push('Consider implementing additional security measures due to high threat volume')
    }
    
    if (metrics.threats_by_severity.critical > 0) {
      recommendations.push('Immediate attention required for critical security threats')
    }
    
    if (metrics.blocked_requests > 100) {
      recommendations.push('Review blocked requests to ensure legitimate users are not affected')
    }
    
    const injectionThreats = threats.filter(t => t.threat_type === 'injection_attack').length
    if (injectionThreats > 0) {
      recommendations.push('Strengthen input validation and sanitization to prevent injection attacks')
    }
    
    const bruteForceThreats = threats.filter(t => t.threat_type === 'brute_force_attack').length
    if (bruteForceThreats > 0) {
      recommendations.push('Implement stronger authentication measures and account lockout policies')
    }
    
    return recommendations
  }

  private getHoursFromTimeRange(timeRange: string): number {
    switch (timeRange) {
      case '1h': return 1
      case '24h': return 24
      case '7d': return 168
      case '30d': return 720
      default: return 24
    }
  }
}

// Export singleton instance
export const reservationSecurityMonitoringService = new ReservationSecurityMonitoringService()