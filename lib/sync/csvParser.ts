/**
 * CSV Parser - Parse les fichiers CSV exportés depuis Airbnb
 * 
 * Ce module parse les fichiers CSV Airbnb et extrait les détails complets
 * des réservations (nom, email, téléphone, montant, etc.)
 */

import { parse } from 'csv-parse/sync';

/**
 * Interface pour une réservation complète (CSV)
 */
export interface CompleteReservation {
  listing_name: string;        // Nom du loft (à mapper vers loft_id)
  confirmation_code: string;   // Code de confirmation Airbnb
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in_date: Date;
  check_out_date: Date;
  nights: number;
  guests: number;
  status: string;              // Confirmed, Cancelled, etc.
  amount: number;
  currency: string;
  payout_amount?: number;
  listing_id?: string;         // ID Airbnb du listing
  raw_data?: any;              // Données brutes pour debugging
}

/**
 * Résultat du parsing CSV
 */
export interface CSVParseResult {
  success: boolean;
  reservations: CompleteReservation[];
  errors: Array<{ line: number; error: string }>;
  total_lines: number;
  parsed_lines: number;
}

/**
 * Mapping des colonnes CSV Airbnb vers nos champs
 * Format CSV Airbnb peut varier, on supporte plusieurs variantes
 */
const COLUMN_MAPPINGS = {
  // Nom du loft
  listing_name: ['Listing', 'Listing Name', 'Property', 'Property Name', 'Annonce'],
  
  // Code de confirmation
  confirmation_code: ['Confirmation Code', 'Code', 'Reservation Code', 'Code de confirmation'],
  
  // Informations client
  guest_name: ['Guest', 'Guest Name', 'Name', 'Nom', 'Voyageur'],
  guest_email: ['Email', 'Guest Email', 'E-mail'],
  guest_phone: ['Phone', 'Guest Phone', 'Phone Number', 'Téléphone'],
  
  // Dates
  check_in: ['Check In', 'Check-in', 'Start Date', 'Arrival', 'Arrivée', 'Date d\'arrivée'],
  check_out: ['Check Out', 'Check-out', 'End Date', 'Departure', 'Départ', 'Date de départ'],
  
  // Détails séjour
  nights: ['Nights', 'Number of Nights', 'Nuits', 'Nombre de nuits'],
  guests: ['Guests', 'Number of Guests', 'Voyageurs', 'Nombre de voyageurs'],
  
  // Statut
  status: ['Status', 'Reservation Status', 'Statut'],
  
  // Montants
  amount: ['Amount', 'Total', 'Earnings', 'Payout', 'Montant', 'Total Amount'],
  currency: ['Currency', 'Devise'],
  payout: ['Payout', 'Payout Amount', 'Net Earnings', 'Revenus nets'],
  
  // ID Airbnb
  listing_id: ['Listing ID', 'Property ID', 'ID Annonce'],
};

/**
 * Trouve le nom de colonne correspondant dans le CSV
 */
function findColumn(headers: string[], possibleNames: string[]): string | null {
  const normalizedHeaders = headers.map(h => h.trim());
  
  for (const name of possibleNames) {
    const index = normalizedHeaders.findIndex(
      h => h.toLowerCase() === name.toLowerCase()
    );
    if (index !== -1) {
      return headers[index];
    }
  }
  
  return null;
}

/**
 * Parse une date depuis le CSV
 * Supporte plusieurs formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const cleaned = dateStr.trim();
  
  // Format ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    const date = new Date(cleaned);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Format: DD/MM/YYYY
  const ddmmyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Format: MM/DD/YYYY (US)
  const mmddyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Fallback: essayer new Date()
  const date = new Date(cleaned);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse un montant depuis le CSV
 * Supporte: "1234.56", "$1,234.56", "1 234,56 €", etc.
 */
function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null;
  
  // Nettoyer: enlever symboles monétaires, espaces, etc.
  const cleaned = amountStr
    .replace(/[$€£¥]/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '.');
  
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
}

/**
 * Parse un nombre entier depuis le CSV
 */
function parseInt(str: string): number | null {
  if (!str) return null;
  const num = Number.parseInt(str.trim(), 10);
  return isNaN(num) ? null : num;
}

/**
 * Normalise le statut de réservation
 */
function normalizeStatus(status: string): string {
  const normalized = status.toLowerCase().trim();
  
  if (normalized.includes('confirm')) return 'confirmed';
  if (normalized.includes('cancel')) return 'cancelled';
  if (normalized.includes('pending')) return 'pending';
  if (normalized.includes('accept')) return 'confirmed';
  
  return 'confirmed'; // Par défaut
}

/**
 * Parse le contenu CSV Airbnb
 * 
 * @param csvContent - Contenu du fichier CSV
 * @param options - Options de parsing
 * @returns Résultat avec réservations parsées et erreurs
 * 
 * @example
 * ```typescript
 * const csvContent = fs.readFileSync('airbnb-export.csv', 'utf-8');
 * const result = parseAirbnbCSV(csvContent);
 * console.log(`${result.parsed_lines} réservations parsées`);
 * ```
 */
export function parseAirbnbCSV(
  csvContent: string,
  options: {
    skipEmptyLines?: boolean;
    trim?: boolean;
  } = {}
): CSVParseResult {
  const {
    skipEmptyLines = true,
    trim = true,
  } = options;

  const errors: Array<{ line: number; error: string }> = [];
  const reservations: CompleteReservation[] = [];

  try {
    // Parser le CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: skipEmptyLines,
      trim,
      relax_quotes: true,
      relax_column_count: true,
      bom: true, // Support UTF-8 BOM
    });

    if (records.length === 0) {
      return {
        success: true,
        reservations: [],
        errors: [],
        total_lines: 0,
        parsed_lines: 0,
      };
    }

    // Identifier les colonnes
    const headers = Object.keys(records[0]);
    
    const listingNameCol = findColumn(headers, COLUMN_MAPPINGS.listing_name);
    const confirmationCodeCol = findColumn(headers, COLUMN_MAPPINGS.confirmation_code);
    const guestNameCol = findColumn(headers, COLUMN_MAPPINGS.guest_name);
    const guestEmailCol = findColumn(headers, COLUMN_MAPPINGS.guest_email);
    const guestPhoneCol = findColumn(headers, COLUMN_MAPPINGS.guest_phone);
    const checkInCol = findColumn(headers, COLUMN_MAPPINGS.check_in);
    const checkOutCol = findColumn(headers, COLUMN_MAPPINGS.check_out);
    const nightsCol = findColumn(headers, COLUMN_MAPPINGS.nights);
    const guestsCol = findColumn(headers, COLUMN_MAPPINGS.guests);
    const statusCol = findColumn(headers, COLUMN_MAPPINGS.status);
    const amountCol = findColumn(headers, COLUMN_MAPPINGS.amount);
    const currencyCol = findColumn(headers, COLUMN_MAPPINGS.currency);
    const payoutCol = findColumn(headers, COLUMN_MAPPINGS.payout);
    const listingIdCol = findColumn(headers, COLUMN_MAPPINGS.listing_id);

    // Vérifier les colonnes requises
    if (!listingNameCol) {
      return {
        success: false,
        reservations: [],
        errors: [{ line: 0, error: 'Colonne "Listing Name" non trouvée' }],
        total_lines: records.length,
        parsed_lines: 0,
      };
    }

    if (!checkInCol || !checkOutCol) {
      return {
        success: false,
        reservations: [],
        errors: [{ line: 0, error: 'Colonnes de dates non trouvées' }],
        total_lines: records.length,
        parsed_lines: 0,
      };
    }

    // Parser chaque ligne
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const lineNumber = i + 2; // +2 car ligne 1 = headers

      try {
        // Extraire les champs
        const listing_name = record[listingNameCol]?.trim();
        const confirmation_code = confirmationCodeCol ? record[confirmationCodeCol]?.trim() : '';
        const guest_name = guestNameCol ? record[guestNameCol]?.trim() : '';
        const guest_email = guestEmailCol ? record[guestEmailCol]?.trim() : undefined;
        const guest_phone = guestPhoneCol ? record[guestPhoneCol]?.trim() : undefined;
        const check_in_str = record[checkInCol]?.trim();
        const check_out_str = record[checkOutCol]?.trim();
        const nights_str = nightsCol ? record[nightsCol]?.trim() : '0';
        const guests_str = guestsCol ? record[guestsCol]?.trim() : '1';
        const status_str = statusCol ? record[statusCol]?.trim() : 'confirmed';
        const amount_str = amountCol ? record[amountCol]?.trim() : '0';
        const currency_str = currencyCol ? record[currencyCol]?.trim() : 'EUR';
        const payout_str = payoutCol ? record[payoutCol]?.trim() : undefined;
        const listing_id = listingIdCol ? record[listingIdCol]?.trim() : undefined;

        // Valider les champs requis
        if (!listing_name) {
          errors.push({ line: lineNumber, error: 'Listing name manquant' });
          continue;
        }

        if (!check_in_str || !check_out_str) {
          errors.push({ line: lineNumber, error: 'Dates manquantes' });
          continue;
        }

        // Parser les dates
        const check_in_date = parseDate(check_in_str);
        const check_out_date = parseDate(check_out_str);

        if (!check_in_date || !check_out_date) {
          errors.push({ line: lineNumber, error: `Dates invalides: ${check_in_str} - ${check_out_str}` });
          continue;
        }

        // Valider que check_in < check_out
        if (check_in_date >= check_out_date) {
          errors.push({ line: lineNumber, error: 'Check-in doit être avant check-out' });
          continue;
        }

        // Parser les autres champs
        const nights = parseInt(nights_str) || 0;
        const guests = parseInt(guests_str) || 1;
        const status = normalizeStatus(status_str);
        const amount = parseAmount(amount_str) || 0;
        const currency = currency_str || 'EUR';
        const payout_amount = payout_str ? parseAmount(payout_str) : undefined;

        // Créer la réservation
        const reservation: CompleteReservation = {
          listing_name,
          confirmation_code: confirmation_code || `CSV-${lineNumber}`,
          guest_name: guest_name || 'Unknown Guest',
          guest_email,
          guest_phone,
          check_in_date,
          check_out_date,
          nights,
          guests,
          status,
          amount,
          currency,
          payout_amount,
          listing_id,
          raw_data: record,
        };

        reservations.push(reservation);
      } catch (error) {
        errors.push({
          line: lineNumber,
          error: error instanceof Error ? error.message : 'Erreur de parsing',
        });
      }
    }

    return {
      success: errors.length === 0,
      reservations,
      errors,
      total_lines: records.length,
      parsed_lines: reservations.length,
    };
  } catch (error) {
    return {
      success: false,
      reservations: [],
      errors: [{
        line: 0,
        error: error instanceof Error ? error.message : 'Erreur de parsing CSV',
      }],
      total_lines: 0,
      parsed_lines: 0,
    };
  }
}

/**
 * Valide un fichier CSV avant parsing complet
 * Vérifie juste les headers et le format
 */
export function validateCSVFormat(csvContent: string): {
  valid: boolean;
  error?: string;
  headers?: string[];
} {
  try {
    const records = parse(csvContent, {
      columns: true,
      to_line: 2, // Lire seulement 2 lignes
      skip_empty_lines: true,
      bom: true,
    });

    if (records.length === 0) {
      return { valid: false, error: 'Fichier CSV vide' };
    }

    const headers = Object.keys(records[0]);

    // Vérifier qu'on a au moins les colonnes essentielles
    const hasListingName = findColumn(headers, COLUMN_MAPPINGS.listing_name) !== null;
    const hasCheckIn = findColumn(headers, COLUMN_MAPPINGS.check_in) !== null;
    const hasCheckOut = findColumn(headers, COLUMN_MAPPINGS.check_out) !== null;

    if (!hasListingName) {
      return { valid: false, error: 'Colonne "Listing Name" non trouvée' };
    }

    if (!hasCheckIn || !hasCheckOut) {
      return { valid: false, error: 'Colonnes de dates non trouvées' };
    }

    return { valid: true, headers };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Format CSV invalide',
    };
  }
}

/**
 * Génère un CSV depuis des réservations (pour export)
 */
export function generateCSV(reservations: CompleteReservation[]): string {
  if (reservations.length === 0) {
    return 'Listing Name,Confirmation Code,Guest Name,Guest Email,Guest Phone,Check In,Check Out,Nights,Guests,Status,Amount,Currency\n';
  }

  const headers = [
    'Listing Name',
    'Confirmation Code',
    'Guest Name',
    'Guest Email',
    'Guest Phone',
    'Check In',
    'Check Out',
    'Nights',
    'Guests',
    'Status',
    'Amount',
    'Currency',
  ];

  const rows = reservations.map(r => [
    r.listing_name,
    r.confirmation_code,
    r.guest_name,
    r.guest_email || '',
    r.guest_phone || '',
    r.check_in_date.toISOString().split('T')[0],
    r.check_out_date.toISOString().split('T')[0],
    r.nights.toString(),
    r.guests.toString(),
    r.status,
    r.amount.toFixed(2),
    r.currency,
  ]);

  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ];

  return csvLines.join('\n');
}
