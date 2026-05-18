/**
 * API Route: Test Alerts
 * 
 * Permet de tester l'envoi d'alertes manuellement.
 * 
 * POST /api/alerts/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAlertService } from '@/lib/services/alertService';

/**
 * Vérifie que l'utilisateur est authentifié et admin
 */
async function verifyAdmin(request: NextRequest): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Token manquant' };
    }

    // Vérification simplifiée pour les tests
    // À adapter selon votre système d'authentification
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erreur d\'authentification',
    };
  }
}

/**
 * POST /api/alerts/test
 * Envoie une alerte de test
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Type d\'alerte requis (conflict ou playwright)' },
        { status: 400 }
      );
    }

    const alertService = createAlertService();

    if (type === 'conflict') {
      // Alerte de conflit de test
      const testConflict = {
        id: 'test-conflict-id',
        loft_id: 'test-loft-id',
        loft_name: 'Loft Test Alger Centre',
        booking1_id: 'booking-1-id',
        booking2_id: 'booking-2-id',
        booking1_guest: 'John Doe',
        booking2_guest: 'Jane Smith',
        overlap_start: new Date('2026-06-01'),
        overlap_end: new Date('2026-06-05'),
        severity: 'critical',
        created_at: new Date(),
      };

      const result = await alertService.sendConflictAlert(testConflict);

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? 'Alerte de conflit envoyée avec succès'
          : 'Échec de l\'envoi de l\'alerte',
        messageId: result.messageId,
        attempts: result.attempts,
        error: result.error,
      });
    } else if (type === 'playwright') {
      // Alerte d'échec Playwright de test
      const testFailure = {
        consecutive_failures: 3,
        last_failure_date: new Date(),
        error_message: 'Login failed: CAPTCHA detected',
        sync_log_ids: ['log-1', 'log-2', 'log-3'],
      };

      const result = await alertService.sendPlaywrightFailureAlert(testFailure);

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? 'Alerte Playwright envoyée avec succès'
          : 'Échec de l\'envoi de l\'alerte',
        messageId: result.messageId,
        attempts: result.attempts,
        error: result.error,
      });
    } else {
      return NextResponse.json(
        { error: 'Type d\'alerte invalide. Utilisez "conflict" ou "playwright"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'alerte de test:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
