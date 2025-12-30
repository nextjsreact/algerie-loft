/**
 * Utilitaires pour le formatage des devises
 * Devise par défaut: Dinar Algérien (DZD)
 */

export const DEFAULT_CURRENCY = 'DZD';
export const DEFAULT_LOCALE = 'ar-DZ'; // Algérie

/**
 * Formate un montant avec la devise
 * @param amount - Montant à formater
 * @param currency - Code devise (DZD par défaut)
 * @param locale - Locale pour le formatage (ar-DZ par défaut)
 * @returns Montant formaté avec symbole de devise
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formate un montant de manière compacte (sans décimales)
 * @param amount - Montant à formater
 * @param currency - Code devise (DZD par défaut)
 * @param locale - Locale pour le formatage (ar-DZ par défaut)
 * @returns Montant formaté sans décimales
 */
export function formatCurrencyCompact(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Obtient le symbole de la devise
 * @param currency - Code devise (DZD par défaut)
 * @param locale - Locale pour le formatage (ar-DZ par défaut)
 * @returns Symbole de la devise (ex: "DA", "€", "$")
 */
export function getCurrencySymbol(
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(0);
  
  // Extraire le symbole (enlever les chiffres et espaces)
  return formatted.replace(/[\d\s.,]/g, '').trim();
}
