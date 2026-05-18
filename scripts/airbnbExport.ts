/**
 * Airbnb CSV Export Automation Script
 * 
 * Ce script utilise Playwright pour automatiser l'export CSV depuis Airbnb.
 * Il se connecte à Airbnb, navigue vers la page d'export, télécharge le CSV,
 * puis le traite avec le système de matching pour enrichir les réservations.
 * 
 * Usage:
 *   tsx scripts/airbnbExport.ts
 * 
 * Variables d'environnement requises:
 *   - AIRBNB_EMAIL: Email du compte Airbnb
 *   - AIRBNB_PASSWORD: Mot de passe du compte Airbnb
 *   - NEXT_PUBLIC_SUPABASE_URL: URL Supabase
 *   - SUPABASE_SERVICE_ROLE_KEY: Clé service role Supabase
 *   - API_SECRET: Secret pour vérifier le toggle Playwright
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { parseAirbnbCSV } from '../lib/sync/csvParser';
import { createReservationMatcher } from '../lib/sync/reservationMatcher';
import { createBookingRepository } from '../lib/repositories/bookingRepository';
import { createClient } from '@supabase/supabase-js';
import { getAlertService } from '../lib/services/alertService';
import {
  randomDelay,
  randomUserAgent,
  detectCaptcha,
  waitForDownload,
} from './utils/playwrightHelpers';

/**
 * Configuration du script
 */
const CONFIG = {
  AIRBNB_LOGIN_URL: 'https://www.airbnb.com/login',
  AIRBNB_RESERVATIONS_URL: 'https://www.airbnb.com/hosting/reservations',
  DOWNLOAD_DIR: path.join(process.cwd(), 'temp', 'airbnb-exports'),
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
  HEADLESS: process.env.PLAYWRIGHT_HEADLESS !== 'false',
};

/**
 * Résultat de l'export
 */
interface ExportResult {
  success: boolean;
  metrics?: {
    csv_file: string;
    total_lines: number;
    parsed_lines: number;
    exact_matches: number;
    fuzzy_matches: number;
    no_matches: number;
    enriched: number;
    created: number;
    errors: number;
    duration_ms: number;
  };
  error?: string;
}

/**
 * Vérifie si le toggle Playwright est activé
 */
async function checkPlaywrightToggle(): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '');
    const response = await fetch(`${apiUrl}/api/settings/playwright-toggle`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_SECRET}`,
      },
    });

    if (!response.ok) {
      console.error('❌ Erreur lors de la vérification du toggle:', response.statusText);
      return false;
    }

    const data = await response.json();
    return data.enabled === true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du toggle:', error);
    return false;
  }
}

/**
 * Se connecte à Airbnb
 */
async function loginToAirbnb(page: Page): Promise<boolean> {
  try {
    console.log('🔐 Connexion à Airbnb...');

    await page.goto(CONFIG.AIRBNB_LOGIN_URL, { waitUntil: 'networkidle' });
    await randomDelay(2000, 4000);

    // Vérifier CAPTCHA
    if (await detectCaptcha(page)) {
      console.error('❌ CAPTCHA détecté - impossible de continuer');
      return false;
    }

    // Remplir l'email
    const emailInput = await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 10000,
    });
    await emailInput.fill(process.env.AIRBNB_EMAIL!);
    await randomDelay(1000, 2000);

    // Cliquer sur "Continuer"
    const continueButton = await page.locator('button[type="submit"]').first();
    await continueButton.click();
    await randomDelay(2000, 3000);

    // Remplir le mot de passe
    const passwordInput = await page.waitForSelector('input[type="password"], input[name="password"]', {
      timeout: 10000,
    });
    await passwordInput.fill(process.env.AIRBNB_PASSWORD!);
    await randomDelay(1000, 2000);

    // Cliquer sur "Se connecter"
    const loginButton = await page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Attendre la redirection
    await page.waitForURL('**/hosting/**', { timeout: 30000 });
    await randomDelay(2000, 3000);

    console.log('✅ Connexion réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    return false;
  }
}

/**
 * Navigue vers la page d'export et télécharge le CSV
 */
async function downloadCSV(page: Page): Promise<string | null> {
  try {
    console.log('📥 Navigation vers la page d\'export...');

    // Aller sur la page des réservations
    await page.goto(CONFIG.AIRBNB_RESERVATIONS_URL, { waitUntil: 'networkidle' });
    await randomDelay(3000, 5000);

    // Chercher le bouton d'export (peut varier selon la langue)
    const exportButtonSelectors = [
      'button:has-text("Export")',
      'button:has-text("Exporter")',
      'a:has-text("Export")',
      'a:has-text("Exporter")',
      '[data-testid="export-button"]',
    ];

    let exportButton = null;
    for (const selector of exportButtonSelectors) {
      exportButton = await page.locator(selector).first();
      if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        break;
      }
    }

    if (!exportButton) {
      console.error('❌ Bouton d\'export non trouvé');
      return null;
    }

    // Configurer le téléchargement
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    // Cliquer sur le bouton d'export
    await exportButton.click();
    await randomDelay(2000, 3000);

    // Attendre le téléchargement
    console.log('⏳ Téléchargement du CSV...');
    const download = await downloadPromise;

    // Sauvegarder le fichier
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `airbnb-export-${timestamp}.csv`;
    const filepath = path.join(CONFIG.DOWNLOAD_DIR, filename);

    // Créer le dossier si nécessaire
    if (!fs.existsSync(CONFIG.DOWNLOAD_DIR)) {
      fs.mkdirSync(CONFIG.DOWNLOAD_DIR, { recursive: true });
    }

    await download.saveAs(filepath);
    console.log(`✅ CSV téléchargé: ${filename}`);

    return filepath;
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error);
    return null;
  }
}

/**
 * Traite le CSV téléchargé
 */
async function processCSV(filepath: string): Promise<ExportResult> {
  const startTime = Date.now();

  try {
    console.log('📊 Traitement du CSV...');

    // Lire le fichier
    const csvContent = fs.readFileSync(filepath, 'utf-8');

    // Parser le CSV
    const parseResult = parseAirbnbCSV(csvContent);

    if (!parseResult.success) {
      return {
        success: false,
        error: `Erreur de parsing: ${parseResult.errors.length} erreurs`,
      };
    }

    console.log(`✅ ${parseResult.parsed_lines} réservations parsées`);

    // Créer le repository et le matcher
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const repository = createBookingRepository({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const matcher = createReservationMatcher(repository);

    // Charger le mapping des lofts
    await matcher.loadLoftMapping(supabase);

    // Matcher les entrées CSV
    console.log('🔍 Matching des réservations...');
    const matchingReport = await matcher.matchCSVEntries(parseResult.reservations, {
      allow_fuzzy_match: true,
      fuzzy_tolerance_days: 1,
      require_both_dates_fuzzy: true,
    });

    console.log(`✅ Exact matches: ${matchingReport.exact_matches}`);
    console.log(`🔍 Fuzzy matches: ${matchingReport.fuzzy_matches}`);
    console.log(`❌ No matches: ${matchingReport.no_matches}`);

    // Traiter le rapport de matching
    console.log('💾 Enregistrement dans Supabase...');
    const processResult = await matcher.processMatchingReport(matchingReport);

    console.log(`✅ ${processResult.enriched} réservations enrichies`);
    console.log(`✅ ${processResult.created} réservations créées`);

    if (processResult.errors > 0) {
      console.warn(`⚠️  ${processResult.errors} erreurs lors du traitement`);
    }

    // Logger dans sync_logs
    const duration = Date.now() - startTime;

    await supabase.from('airbnb_sync_logs').insert({
      sync_type: 'csv_auto',
      status: processResult.errors > 0 ? 'partial_success' : 'success',
      properties_synced: matchingReport.total_csv_entries,
      bookings_created: processResult.created,
      bookings_updated: processResult.enriched,
      conflicts_detected: 0,
      errors_count: processResult.errors,
      duration_ms: duration,
      metadata: {
        csv_file: path.basename(filepath),
        exact_matches: matchingReport.exact_matches,
        fuzzy_matches: matchingReport.fuzzy_matches,
        no_matches: matchingReport.no_matches,
        parse_errors: parseResult.errors.length,
      },
    });

    // Vérifier les échecs consécutifs (après un succès, pour nettoyer l'état)
    await checkConsecutiveFailures();

    return {
      success: true,
      metrics: {
        csv_file: path.basename(filepath),
        total_lines: parseResult.total_lines,
        parsed_lines: parseResult.parsed_lines,
        exact_matches: matchingReport.exact_matches,
        fuzzy_matches: matchingReport.fuzzy_matches,
        no_matches: matchingReport.no_matches,
        enriched: processResult.enriched,
        created: processResult.created,
        errors: processResult.errors,
        duration_ms: duration,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Vérifie les échecs consécutifs et envoie une alerte si nécessaire
 */
async function checkConsecutiveFailures(): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer les 5 derniers logs de type csv_auto
    const { data: logs, error } = await supabase
      .from('airbnb_sync_logs')
      .select('id, status, created_at, metadata')
      .eq('sync_type', 'csv_auto')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erreur lors de la récupération des logs:', error);
      return;
    }

    if (!logs || logs.length < 3) {
      console.log('ℹ️  Pas assez de logs pour vérifier les échecs consécutifs');
      return;
    }

    // Vérifier si les 3 derniers sont des échecs
    const recentLogs = logs.slice(0, 3);
    const allFailed = recentLogs.every(log => log.status === 'error');

    if (!allFailed) {
      console.log('✅ Pas de 3 échecs consécutifs détectés');
      return;
    }

    console.log('⚠️  3 échecs consécutifs détectés - envoi d\'alerte...');

    // Préparer les détails de l'échec
    const lastLog = recentLogs[0];
    const errorMessage = lastLog.metadata?.error || 'Erreur inconnue';

    const alertService = getAlertService();
    const result = await alertService.sendPlaywrightFailureAlert({
      consecutive_failures: 3,
      last_failure_date: new Date(lastLog.created_at),
      error_message: errorMessage,
      sync_log_ids: recentLogs.map(log => log.id),
    });

    if (result.success) {
      console.log(`✅ Alerte d'échec Playwright envoyée (${result.attempts} tentative(s))`);
    } else {
      console.error(`❌ Échec d'envoi d'alerte: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des échecs consécutifs:', error);
  }
}

/**
 * Fonction principale
 */
async function main(): Promise<ExportResult> {
  let browser: Browser | null = null;

  try {
    // Vérifier les variables d'environnement
    if (!process.env.AIRBNB_EMAIL || !process.env.AIRBNB_PASSWORD) {
      return {
        success: false,
        error: 'Variables AIRBNB_EMAIL et AIRBNB_PASSWORD requises',
      };
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: false,
        error: 'Variables Supabase requises',
      };
    }

    // Vérifier le toggle Playwright
    console.log('🔍 Vérification du toggle Playwright...');
    const isEnabled = await checkPlaywrightToggle();

    if (!isEnabled) {
      console.log('⏸️  Playwright désactivé - export annulé');
      return {
        success: false,
        error: 'Playwright désactivé via toggle',
      };
    }

    console.log('✅ Playwright activé - démarrage de l\'export');

    // Lancer le navigateur
    console.log('🚀 Lancement du navigateur...');
    browser = await chromium.launch({
      headless: CONFIG.HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      userAgent: randomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'fr-FR',
    });

    const page = await context.newPage();

    // Tentatives avec retry
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
      console.log(`\n🔄 Tentative ${attempt}/${CONFIG.MAX_RETRIES}`);

      try {
        // Se connecter
        const loginSuccess = await loginToAirbnb(page);
        if (!loginSuccess) {
          lastError = 'Échec de connexion';
          if (attempt < CONFIG.MAX_RETRIES) {
            console.log(`⏳ Nouvelle tentative dans ${CONFIG.RETRY_DELAY_MS / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
            continue;
          }
          break;
        }

        // Télécharger le CSV
        const csvPath = await downloadCSV(page);
        if (!csvPath) {
          lastError = 'Échec du téléchargement CSV';
          if (attempt < CONFIG.MAX_RETRIES) {
            console.log(`⏳ Nouvelle tentative dans ${CONFIG.RETRY_DELAY_MS / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
            continue;
          }
          break;
        }

        // Traiter le CSV
        const result = await processCSV(csvPath);

        // Nettoyer le fichier temporaire
        fs.unlinkSync(csvPath);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(`❌ Erreur tentative ${attempt}:`, lastError);

        if (attempt < CONFIG.MAX_RETRIES) {
          console.log(`⏳ Nouvelle tentative dans ${CONFIG.RETRY_DELAY_MS / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
        }
      }
    }

    return {
      success: false,
      error: lastError || 'Échec après toutes les tentatives',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    // Logger l'échec dans sync_logs
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase.from('airbnb_sync_logs').insert({
        sync_type: 'csv_auto',
        status: 'error',
        properties_synced: 0,
        bookings_created: 0,
        bookings_updated: 0,
        conflicts_detected: 0,
        errors_count: 1,
        duration_ms: 0,
        metadata: {
          error: errorMessage,
        },
      });

      // Vérifier les échecs consécutifs
      await checkConsecutiveFailures();
    } catch (logError) {
      console.error('❌ Erreur lors du logging:', logError);
    }

    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Exécuter le script
if (require.main === module) {
  main()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Export Airbnb réussi !');
        console.log('📊 Métriques:', JSON.stringify(result.metrics, null, 2));
        process.exit(0);
      } else {
        console.error('\n❌ Export Airbnb échoué:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { main as runAirbnbExport };
