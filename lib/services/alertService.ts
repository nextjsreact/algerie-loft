/**
 * Alert Service
 * 
 * Service d'envoi d'alertes par email via Resend API.
 * Gère les alertes de conflits et les échecs Playwright.
 */

import { Resend } from 'resend';

/**
 * Interface pour un conflit
 */
interface Conflict {
  id: string;
  loft_id: string;
  loft_name: string;
  booking1_id: string;
  booking2_id: string;
  booking1_guest?: string;
  booking2_guest?: string;
  overlap_start: Date;
  overlap_end: Date;
  severity: string;
  created_at: Date;
}

/**
 * Interface pour les détails d'échec Playwright
 */
interface PlaywrightFailure {
  consecutive_failures: number;
  last_failure_date: Date;
  error_message: string;
  sync_log_ids: string[];
}

/**
 * Résultat d'envoi d'email
 */
interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  attempts: number;
}

/**
 * Configuration du service
 */
const CONFIG = {
  FROM_EMAIL: process.env.ALERT_FROM_EMAIL || 'alerts@votredomaine.com',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@votredomaine.com',
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000], // 1s, 2s, 4s
};

/**
 * Service d'alertes
 */
export class AlertService {
  private resend: Resend;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.RESEND_API_KEY;
    
    if (!key) {
      throw new Error('RESEND_API_KEY est requis');
    }

    this.resend = new Resend(key);
  }

  /**
   * Envoie un email avec retry automatique
   */
  private async sendEmailWithRetry(
    to: string,
    subject: string,
    html: string
  ): Promise<SendResult> {
    let lastError: string | null = null;

    for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: CONFIG.FROM_EMAIL,
          to,
          subject,
          html,
        });

        if (error) {
          lastError = error.message;
          console.error(`Tentative ${attempt + 1} échouée:`, error);

          // Attendre avant de réessayer
          if (attempt < CONFIG.MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAYS[attempt]));
          }
          continue;
        }

        return {
          success: true,
          messageId: data?.id,
          attempts: attempt + 1,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(`Tentative ${attempt + 1} échouée:`, error);

        // Attendre avant de réessayer
        if (attempt < CONFIG.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAYS[attempt]));
        }
      }
    }

    return {
      success: false,
      error: lastError || 'Échec après toutes les tentatives',
      attempts: CONFIG.MAX_RETRIES,
    };
  }

  /**
   * Envoie une alerte pour un conflit unique
   */
  async sendConflictAlert(conflict: Conflict): Promise<SendResult> {
    const subject = `🚨 Conflit de réservation détecté - ${conflict.loft_name}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .conflict-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #dc2626; font-size: 18px; margin-top: 0; }
            .label { font-weight: bold; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Conflit de Réservation Détecté</h1>
            </div>
            
            <div class="content">
              <p>Un conflit de réservation a été détecté pour le loft suivant :</p>
              
              <div class="conflict-box">
                <h2>${conflict.loft_name}</h2>
                
                <p><span class="label">Période de chevauchement :</span><br>
                Du ${this.formatDate(conflict.overlap_start)} au ${this.formatDate(conflict.overlap_end)}</p>
                
                <p><span class="label">Réservation 1 :</span><br>
                ${conflict.booking1_guest || 'Guest'} (ID: ${conflict.booking1_id.substring(0, 8)}...)</p>
                
                <p><span class="label">Réservation 2 :</span><br>
                ${conflict.booking2_guest || 'Guest'} (ID: ${conflict.booking2_id.substring(0, 8)}...)</p>
                
                <p><span class="label">Sévérité :</span> ${conflict.severity}</p>
                
                <p><span class="label">Détecté le :</span> ${this.formatDate(conflict.created_at)}</p>
              </div>
              
              <p><strong>Action requise :</strong> Veuillez vérifier et résoudre ce conflit dans le système.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/calendar" class="button">
                Voir le Calendrier
              </a>
            </div>
            
            <div class="footer">
              <p>Système de Synchronisation Airbnb - Alertes Automatiques</p>
              <p>Cet email a été envoyé automatiquement. Ne pas répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmailWithRetry(CONFIG.ADMIN_EMAIL, subject, html);
  }

  /**
   * Envoie une alerte pour plusieurs conflits (batch)
   */
  async sendBatchConflictAlert(conflicts: Conflict[]): Promise<SendResult> {
    if (conflicts.length === 0) {
      return { success: true, attempts: 0 };
    }

    if (conflicts.length === 1) {
      return this.sendConflictAlert(conflicts[0]);
    }

    const subject = `🚨 ${conflicts.length} conflits de réservation détectés`;

    const conflictsHtml = conflicts.map(conflict => `
      <div class="conflict-box">
        <h3>${conflict.loft_name}</h3>
        <p><span class="label">Période :</span> ${this.formatDate(conflict.overlap_start)} - ${this.formatDate(conflict.overlap_end)}</p>
        <p><span class="label">Réservations :</span> ${conflict.booking1_guest || 'Guest 1'} vs ${conflict.booking2_guest || 'Guest 2'}</p>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .conflict-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #dc2626; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            h1 { margin: 0; font-size: 24px; }
            h3 { color: #dc2626; font-size: 16px; margin: 0 0 10px 0; }
            .label { font-weight: bold; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Conflits de Réservation Multiples</h1>
            </div>
            
            <div class="content">
              <p><strong>${conflicts.length} conflits</strong> ont été détectés lors de la dernière synchronisation :</p>
              
              ${conflictsHtml}
              
              <p><strong>Action requise :</strong> Veuillez vérifier et résoudre ces conflits dans le système.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/calendar" class="button">
                Voir le Calendrier
              </a>
            </div>
            
            <div class="footer">
              <p>Système de Synchronisation Airbnb - Alertes Automatiques</p>
              <p>Cet email a été envoyé automatiquement. Ne pas répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmailWithRetry(CONFIG.ADMIN_EMAIL, subject, html);
  }

  /**
   * Envoie une alerte pour échecs Playwright consécutifs
   */
  async sendPlaywrightFailureAlert(failure: PlaywrightFailure): Promise<SendResult> {
    const subject = `🚨 Échecs Playwright consécutifs (${failure.consecutive_failures}x)`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ea580c; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .error-box { background-color: #fef2f2; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; border-radius: 4px; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            h1 { margin: 0; font-size: 24px; }
            .label { font-weight: bold; color: #4b5563; }
            .code { background-color: #1f2937; color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Échecs Playwright Consécutifs</h1>
            </div>
            
            <div class="content">
              <p>Le système d'export automatique Playwright a échoué <strong>${failure.consecutive_failures} fois consécutivement</strong>.</p>
              
              <div class="error-box">
                <p><span class="label">Dernier échec :</span> ${this.formatDate(failure.last_failure_date)}</p>
                
                <p><span class="label">Message d'erreur :</span></p>
                <div class="code">${this.escapeHtml(failure.error_message)}</div>
              </div>
              
              <p><strong>Actions recommandées :</strong></p>
              <ul>
                <li>Vérifier les credentials Airbnb dans GitHub Secrets</li>
                <li>Vérifier si Airbnb a détecté un comportement suspect (CAPTCHA)</li>
                <li>Consulter les logs GitHub Actions pour plus de détails</li>
                <li>Désactiver temporairement le toggle Playwright si nécessaire</li>
              </ul>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/sync-logs" class="button">
                Voir les Logs
              </a>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/airbnb-sync" class="button" style="background-color: #dc2626;">
                Désactiver Playwright
              </a>
            </div>
            
            <div class="footer">
              <p>Système de Synchronisation Airbnb - Alertes Automatiques</p>
              <p>Cet email a été envoyé automatiquement. Ne pas répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmailWithRetry(CONFIG.ADMIN_EMAIL, subject, html);
  }

  /**
   * Formate une date pour l'affichage
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  }

  /**
   * Échappe le HTML pour éviter les injections
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

/**
 * Crée une instance du service d'alertes
 */
export function createAlertService(apiKey?: string): AlertService {
  return new AlertService(apiKey);
}

/**
 * Instance singleton pour usage global
 */
let alertServiceInstance: AlertService | null = null;

export function getAlertService(): AlertService {
  if (!alertServiceInstance) {
    alertServiceInstance = new AlertService();
  }
  return alertServiceInstance;
}
