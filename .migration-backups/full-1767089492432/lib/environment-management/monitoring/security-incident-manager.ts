/**
 * Security Incident Manager
 * 
 * Manages security incidents, alerts, and threat detection
 */

import { SecurityIncident, AlertRule, AlertCondition, AlertAction } from './types'

export class SecurityIncidentManager {
  private incidents: Map<string, SecurityIncident> = new Map()
  private alertRules: Map<string, AlertRule> = new Map()
  private incidentCounter = 0

  constructor() {
    this.initializeDefaultAlertRules()
  }

  /**
   * Reports a new security incident
   */
  public reportIncident(incident: Omit<SecurityIncident, 'id' | 'timestamp' | 'resolved'>): SecurityIncident {
    const incidentId = this.generateIncidentId()
    
    const fullIncident: SecurityIncident = {
      id: incidentId,
      timestamp: new Date(),
      resolved: false,
      ...incident
    }

    this.incidents.set(incidentId, fullIncident)
    
    // Log incident immediately
    this.logIncident(fullIncident)
    
    // Check alert rules
    this.checkAlertRules(fullIncident)
    
    // Auto-escalate critical incidents
    if (fullIncident.severity === 'critical') {
      this.escalateCriticalIncident(fullIncident)
    }

    return fullIncident
  }

  /**
   * Resolves a security incident
   */
  public resolveIncident(
    incidentId: string, 
    resolution: string, 
    resolvedBy: string
  ): void {
    const incident = this.incidents.get(incidentId)
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`)
    }

    incident.resolved = true
    incident.resolvedAt = new Date()
    incident.resolvedBy = resolvedBy
    incident.resolution = resolution

    console.log(`🔒 Security incident resolved: ${incidentId} by ${resolvedBy}`)
    console.log(`   Resolution: ${resolution}`)
  }

  /**
   * Gets incident by ID
   */
  public getIncident(incidentId: string): SecurityIncident | undefined {
    return this.incidents.get(incidentId)
  }

  /**
   * Gets all incidents
   */
  public getAllIncidents(): SecurityIncident[] {
    return Array.from(this.incidents.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Gets unresolved incidents
   */
  public getUnresolvedIncidents(): SecurityIncident[] {
    return this.getAllIncidents().filter(incident => !incident.resolved)
  }

  /**
   * Gets incidents by severity
   */
  public getIncidentsBySeverity(severity: SecurityIncident['severity']): SecurityIncident[] {
    return this.getAllIncidents().filter(incident => incident.severity === severity)
  }

  /**
   * Gets critical incidents
   */
  public getCriticalIncidents(): SecurityIncident[] {
    return this.getIncidentsBySeverity('critical')
  }

  /**
   * Gets incidents for a specific environment
   */
  public getIncidentsForEnvironment(environmentId: string): SecurityIncident[] {
    return this.getAllIncidents().filter(incident => incident.environmentId === environmentId)
  }

  /**
   * Gets incidents for a specific user
   */
  public getIncidentsForUser(userId: string): SecurityIncident[] {
    return this.getAllIncidents().filter(incident => incident.userId === userId)
  }

  /**
   * Gets recent incidents (last 24 hours)
   */
  public getRecentIncidents(hours: number = 24): SecurityIncident[] {
    const cutoff = new Date()
    cutoff.setHours(cutoff.getHours() - hours)
    
    return this.getAllIncidents().filter(incident => incident.timestamp > cutoff)
  }

  /**
   * Generates security report
   */
  public generateSecurityReport(days: number = 7): string {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    
    const incidents = this.getAllIncidents().filter(incident => incident.timestamp > cutoff)
    const criticalIncidents = incidents.filter(i => i.severity === 'critical')
    const highIncidents = incidents.filter(i => i.severity === 'high')
    const unresolvedIncidents = incidents.filter(i => !i.resolved)
    
    const incidentsByType = this.groupIncidentsByType(incidents)
    const incidentsByEnvironment = this.groupIncidentsByEnvironment(incidents)
    
    const report = [
      `=== Security Report (Last ${days} days) ===`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `=== Summary ===`,
      `Total Incidents: ${incidents.length}`,
      `Critical: ${criticalIncidents.length}`,
      `High: ${highIncidents.length}`,
      `Medium: ${incidents.filter(i => i.severity === 'medium').length}`,
      `Low: ${incidents.filter(i => i.severity === 'low').length}`,
      `Unresolved: ${unresolvedIncidents.length}`,
      ``,
      `=== Incidents by Type ===`,
      ...Object.entries(incidentsByType).map(([type, count]) => `${type}: ${count}`),
      ``,
      `=== Incidents by Environment ===`,
      ...Object.entries(incidentsByEnvironment).map(([env, count]) => `${env || 'Unknown'}: ${count}`),
      ``,
      `=== Critical Incidents ===`,
      ...criticalIncidents.map(incident => 
        `- ${incident.timestamp.toISOString()}: ${incident.description} (${incident.resolved ? 'RESOLVED' : 'OPEN'})`
      ),
      ``,
      `=== Unresolved Incidents ===`,
      ...unresolvedIncidents.map(incident => 
        `- [${incident.severity.toUpperCase()}] ${incident.description} (${incident.timestamp.toISOString()})`
      )
    ].join('\n')

    return report
  }

  /**
   * Adds custom alert rule
   */
  public addAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullRule: AlertRule = {
      id: ruleId,
      ...rule
    }
    
    this.alertRules.set(ruleId, fullRule)
    console.log(`📋 Alert rule added: ${rule.name}`)
    
    return fullRule
  }

  /**
   * Removes alert rule
   */
  public removeAlertRule(ruleId: string): void {
    const rule = this.alertRules.get(ruleId)
    if (rule) {
      this.alertRules.delete(ruleId)
      console.log(`🗑️ Alert rule removed: ${rule.name}`)
    }
  }

  /**
   * Gets all alert rules
   */
  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values())
  }

  /**
   * Private helper methods
   */
  private generateIncidentId(): string {
    this.incidentCounter++
    const timestamp = Date.now()
    return `incident_${timestamp}_${this.incidentCounter.toString().padStart(4, '0')}`
  }

  private logIncident(incident: SecurityIncident): void {
    const severityEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    }

    const typeEmoji = {
      unauthorized_access: '🚫',
      production_access_attempt: '⚠️',
      configuration_tampering: '🔧',
      suspicious_activity: '👁️',
      system_error: '💥'
    }

    console.log(`${severityEmoji[incident.severity]} ${typeEmoji[incident.type]} SECURITY INCIDENT: ${incident.description}`)
    console.log(`   ID: ${incident.id}`)
    console.log(`   Severity: ${incident.severity.toUpperCase()}`)
    console.log(`   Type: ${incident.type}`)
    console.log(`   Timestamp: ${incident.timestamp.toISOString()}`)
    if (incident.environmentId) console.log(`   Environment: ${incident.environmentId}`)
    if (incident.userId) console.log(`   User: ${incident.userId}`)
    if (incident.operationId) console.log(`   Operation: ${incident.operationId}`)
    if (incident.component) console.log(`   Component: ${incident.component}`)
    if (incident.metadata) console.log(`   Metadata:`, incident.metadata)
  }

  private checkAlertRules(incident: SecurityIncident): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue
      
      // Check cooldown period
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime()
        if (timeSinceLastTrigger < rule.cooldownPeriod) {
          continue
        }
      }

      // Check if incident matches rule conditions
      if (this.incidentMatchesRule(incident, rule)) {
        this.triggerAlert(rule, incident)
      }
    }
  }

  private incidentMatchesRule(incident: SecurityIncident, rule: AlertRule): boolean {
    return rule.conditions.every(condition => {
      const value = this.getIncidentValue(incident, condition.metric)
      return this.evaluateCondition(value, condition)
    })
  }

  private getIncidentValue(incident: SecurityIncident, metric: string): any {
    switch (metric) {
      case 'severity':
        return incident.severity
      case 'type':
        return incident.type
      case 'environmentId':
        return incident.environmentId
      case 'userId':
        return incident.userId
      case 'component':
        return incident.component
      default:
        return incident.metadata?.[metric]
    }
  }

  private evaluateCondition(value: any, condition: AlertCondition): boolean {
    switch (condition.operator) {
      case 'eq':
        return value === condition.threshold
      case 'gt':
        return value > condition.threshold
      case 'lt':
        return value < condition.threshold
      case 'gte':
        return value >= condition.threshold
      case 'lte':
        return value <= condition.threshold
      case 'contains':
        return String(value).includes(String(condition.threshold))
      default:
        return false
    }
  }

  private triggerAlert(rule: AlertRule, incident: SecurityIncident): void {
    rule.lastTriggered = new Date()
    
    console.log(`🚨 ALERT TRIGGERED: ${rule.name}`)
    console.log(`   Rule: ${rule.description}`)
    console.log(`   Incident: ${incident.id}`)
    
    // Execute alert actions
    for (const action of rule.actions) {
      this.executeAlertAction(action, rule, incident)
    }
  }

  private executeAlertAction(action: AlertAction, rule: AlertRule, incident: SecurityIncident): void {
    switch (action.type) {
      case 'log':
        console.log(`📝 ALERT LOG: ${rule.name} - ${incident.description}`)
        break
      
      case 'emergency_stop':
        console.log(`🛑 EMERGENCY STOP TRIGGERED by rule: ${rule.name}`)
        // In a real implementation, this would stop all operations
        break
      
      case 'email':
        console.log(`📧 EMAIL ALERT: ${rule.name} (would send to ${action.config.recipients})`)
        // In a real implementation, this would send actual emails
        break
      
      case 'webhook':
        console.log(`🔗 WEBHOOK ALERT: ${rule.name} (would call ${action.config.url})`)
        // In a real implementation, this would make HTTP requests
        break
      
      default:
        console.log(`❓ Unknown alert action: ${action.type}`)
    }
  }

  private escalateCriticalIncident(incident: SecurityIncident): void {
    console.log(`🚨 CRITICAL INCIDENT ESCALATION: ${incident.id}`)
    console.log(`   Description: ${incident.description}`)
    console.log(`   Immediate action required!`)
    
    // In a real implementation, this would:
    // - Send immediate notifications to administrators
    // - Create high-priority tickets
    // - Potentially trigger emergency procedures
  }

  private groupIncidentsByType(incidents: SecurityIncident[]): Record<string, number> {
    const groups: Record<string, number> = {}
    
    for (const incident of incidents) {
      groups[incident.type] = (groups[incident.type] || 0) + 1
    }
    
    return groups
  }

  private groupIncidentsByEnvironment(incidents: SecurityIncident[]): Record<string, number> {
    const groups: Record<string, number> = {}
    
    for (const incident of incidents) {
      const env = incident.environmentId || 'unknown'
      groups[env] = (groups[env] || 0) + 1
    }
    
    return groups
  }

  private initializeDefaultAlertRules(): void {
    // Critical production access attempts
    this.addAlertRule({
      name: 'Critical Production Access',
      description: 'Alert on any critical production access attempt',
      enabled: true,
      conditions: [
        { metric: 'severity', operator: 'eq', threshold: 'critical' },
        { metric: 'type', operator: 'eq', threshold: 'production_access_attempt' }
      ],
      actions: [
        { type: 'log', config: {} },
        { type: 'emergency_stop', config: {} }
      ],
      cooldownPeriod: 60000 // 1 minute
    })

    // Multiple failed operations
    this.addAlertRule({
      name: 'System Error Pattern',
      description: 'Alert on system errors',
      enabled: true,
      conditions: [
        { metric: 'type', operator: 'eq', threshold: 'system_error' },
        { metric: 'severity', operator: 'eq', threshold: 'high' }
      ],
      actions: [
        { type: 'log', config: {} }
      ],
      cooldownPeriod: 300000 // 5 minutes
    })

    // Suspicious activity
    this.addAlertRule({
      name: 'Suspicious Activity',
      description: 'Alert on suspicious user activity',
      enabled: true,
      conditions: [
        { metric: 'type', operator: 'eq', threshold: 'suspicious_activity' }
      ],
      actions: [
        { type: 'log', config: {} }
      ],
      cooldownPeriod: 600000 // 10 minutes
    })
  }
}