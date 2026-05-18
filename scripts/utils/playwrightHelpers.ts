/**
 * Playwright Helper Functions
 * 
 * Fonctions utilitaires pour automatiser Airbnb de manière sûre et naturelle.
 */

import { Page } from 'playwright';

/**
 * Délai aléatoire pour simuler un comportement humain
 */
export async function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * User agents aléatoires pour éviter la détection
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

/**
 * Retourne un user agent aléatoire
 */
export function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Détecte si un CAPTCHA est présent sur la page
 */
export async function detectCaptcha(page: Page): Promise<boolean> {
  const captchaSelectors = [
    'iframe[src*="recaptcha"]',
    'iframe[src*="captcha"]',
    '[class*="captcha"]',
    '[id*="captcha"]',
    'div[data-testid="captcha"]',
  ];

  for (const selector of captchaSelectors) {
    const element = await page.locator(selector).first();
    if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
      return true;
    }
  }

  return false;
}

/**
 * Attend qu'un téléchargement soit terminé
 */
export async function waitForDownload(
  page: Page,
  timeoutMs: number = 60000
): Promise<string | null> {
  try {
    const download = await page.waitForEvent('download', { timeout: timeoutMs });
    const path = await download.path();
    return path;
  } catch {
    return null;
  }
}

/**
 * Scroll progressif pour simuler un comportement humain
 */
export async function humanScroll(page: Page, distance: number = 500): Promise<void> {
  const scrollSteps = 5;
  const stepDistance = distance / scrollSteps;

  for (let i = 0; i < scrollSteps; i++) {
    await page.evaluate((step) => {
      window.scrollBy(0, step);
    }, stepDistance);
    await randomDelay(100, 300);
  }
}

/**
 * Tape du texte de manière progressive (comme un humain)
 */
export async function humanType(page: Page, selector: string, text: string): Promise<void> {
  const input = await page.locator(selector).first();
  
  for (const char of text) {
    await input.type(char);
    await randomDelay(50, 150);
  }
}

/**
 * Vérifie si la page contient une erreur
 */
export async function detectError(page: Page): Promise<string | null> {
  const errorSelectors = [
    '[class*="error"]',
    '[class*="alert"]',
    '[role="alert"]',
    '[data-testid="error"]',
  ];

  for (const selector of errorSelectors) {
    const element = await page.locator(selector).first();
    if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
      const text = await element.textContent();
      return text || 'Erreur détectée';
    }
  }

  return null;
}

/**
 * Prend une capture d'écran pour debugging
 */
export async function takeDebugScreenshot(
  page: Page,
  name: string,
  dir: string = 'temp/screenshots'
): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(dir, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot sauvegardé: ${filename}`);
}
