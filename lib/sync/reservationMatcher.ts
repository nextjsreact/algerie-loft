/**
 * Reservation Matcher - Match les réservations CSV avec les réservations iCal
 * 
 * Ce module implémente la logique de matching intelligent entre:
 * - Réservations partielles (iCal) : dates uniquement
 * - Réservations complètes (CSV) : dates + détails client
 * 
 * Stratégies de matching:
 * 1. Exact match: loft_id + check_in + check_out identiques
 * 2. Fuzzy match: loft_id + dates ±1 jour (check_in ET check_out)
 * 3. No match: créer nouvelle réservation avec flag csv_only
 */

import { addDays, subDays, isSameDay, isWithinInterval } from 'date-fns';
import { CompleteReservation } from './csvParser';
import { AirbnbBooking, BookingRepository } from '../repositories/bookingRepository';

/**
 * Résultat d'un matching
 */
export interface MatchResult {
  type: 'exact' | 'fuzzy' | 'none';
  confidence: number; // 0-100
  ical_booking?: AirbnbBooking;
  csv_entry: CompleteReservation;
  loft_id?: string;
  reason?: string;
}

/**
 * Résultat du processus de matching complet
 */
export interface MatchingReport {
  total_csv_entries: number;
  exact_matches: number;
  fuzzy_matches: number;
  no_matches: number;
  errors: number;
  matches: MatchResult[];
  error_details: Array<{ csv_entry: CompleteReservation; error: string }>;
}

/**
 * Options pour le matcher
 */
export interface MatcherOptions {
  fuzzy_tolerance_days?: number; // Défaut: 1 jour
  allow_fuzzy_match?: boolean;   // Défaut: true
  require_both_dates_fuzzy?: boolean; // Défaut: true (check_in ET check_out doivent matcher)
}

/**
 * Classe pour le matching de réservations
 */
export class ReservationMatcher {
  private repository: BookingRepository;
  private loftNameToIdMap: Map<string, string> = new Map();

  constructor(repository: BookingRepository) {
    this.repository = repository;
  }

  /**
   * Charge le mapping "Listing Name" → loft_id depuis la table lofts
   * Doit être appelé avant le matching
   */
  async loadLoftMapping(supabase: any): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('lofts')
        .select('id, name');

      if (error) {
        throw new Error(`Erreur lors du chargement des lofts: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Aucun loft trouvé dans la base de données');
      }

      // Créer le mapping (insensible à la casse et aux espaces)
      this.loftNameToIdMap.clear();
      for (const loft of data) {
        const normalizedName = this.normalizeLoftName(loft.name);
        this.loftNameToIdMap.set(normalizedName, loft.id);
      }

      console.log(`✅ ${this.loftNameToIdMap.size} lofts chargés pour le matching`);
    } catch (error) {
      throw new Error(
        `Impossible de charger les lofts: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }

  /**
   * Normalise un nom de loft pour le matching
   * Enlève espaces, accents, casse
   */
  private normalizeLoftName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever accents
      .replace(/\s+/g, ' '); // Normaliser espaces
  }

  /**
   * Trouve le loft_id correspondant au listing_name CSV
   */
  private findLoftId(listing_name: string): string | null {
    const normalized = this.normalizeLoftName(listing_name);
    return this.loftNameToIdMap.get(normalized) || null;
  }

  /**
   * Vérifie si deux dates sont identiques (même jour)
   */
  private isSameDate(date1: Date, date2: Date): boolean {
    return isSameDay(date1, date2);
  }

  /**
   * Vérifie si date1 est dans la tolérance de date2 (±N jours)
   */
  private isWithinTolerance(date1: Date, date2: Date, toleranceDays: number): boolean {
    const start = subDays(date2, toleranceDays);
    const end = addDays(date2, toleranceDays);
    return isWithinInterval(date1, { start, end });
  }

  /**
   * Trouve un exact match: loft_id + check_in + check_out identiques
   */
  private async findExactMatch(
    loft_id: string,
    check_in: Date,
    check_out: Date
  ): Promise<AirbnbBooking | null> {
    return await this.repository.findByLoftAndDates(loft_id, check_in, check_out);
  }

  /**
   * Trouve un fuzzy match: loft_id + dates ±1 jour
   */
  private async findFuzzyMatch(
    loft_id: string,
    check_in: Date,
    check_out: Date,
    options: MatcherOptions
  ): Promise<{ booking: AirbnbBooking; confidence: number } | null> {
    const toleranceDays = options.fuzzy_tolerance_days || 1;
    const requireBothDates = options.require_both_dates_fuzzy !== false;

    // Récupérer toutes les réservations du loft dans une fenêtre large
    const searchStart = subDays(check_in, toleranceDays + 1);
    const searchEnd = addDays(check_out, toleranceDays + 1);

    const bookings = await this.repository.getBookingsByDateRange(
      loft_id,
      searchStart,
      searchEnd
    );

    if (bookings.length === 0) {
      return null;
    }

    // Chercher le meilleur match
    let bestMatch: { booking: AirbnbBooking; confidence: number } | null = null;

    for (const booking of bookings) {
      const checkInMatch = this.isWithinTolerance(check_in, booking.check_in_date, toleranceDays);
      const checkOutMatch = this.isWithinTolerance(check_out, booking.check_out_date, toleranceDays);

      // Si on requiert les deux dates
      if (requireBothDates) {
        if (checkInMatch && checkOutMatch) {
          // Calculer la confiance (100 = exact, diminue avec la distance)
          const checkInDiff = Math.abs(
            (check_in.getTime() - booking.check_in_date.getTime()) / (1000 * 60 * 60 * 24)
          );
          const checkOutDiff = Math.abs(
            (check_out.getTime() - booking.check_out_date.getTime()) / (1000 * 60 * 60 * 24)
          );
          const avgDiff = (checkInDiff + checkOutDiff) / 2;
          const confidence = Math.max(0, 100 - (avgDiff * 20)); // -20% par jour de différence

          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { booking, confidence };
          }
        }
      } else {
        // Au moins une date doit matcher
        if (checkInMatch || checkOutMatch) {
          const checkInDiff = Math.abs(
            (check_in.getTime() - booking.check_in_date.getTime()) / (1000 * 60 * 60 * 24)
          );
          const checkOutDiff = Math.abs(
            (check_out.getTime() - booking.check_out_date.getTime()) / (1000 * 60 * 60 * 24)
          );
          const avgDiff = (checkInDiff + checkOutDiff) / 2;
          const confidence = Math.max(0, 80 - (avgDiff * 15)); // Confiance plus basse

          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { booking, confidence };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Match une entrée CSV avec les réservations iCal existantes
   */
  async matchCSVEntry(
    csvEntry: CompleteReservation,
    options: MatcherOptions = {}
  ): Promise<MatchResult> {
    // 1. Trouver le loft_id
    const loft_id = this.findLoftId(csvEntry.listing_name);

    if (!loft_id) {
      return {
        type: 'none',
        confidence: 0,
        csv_entry: csvEntry,
        reason: `Loft non trouvé: "${csvEntry.listing_name}"`,
      };
    }

    // 2. Chercher exact match
    const exactMatch = await this.findExactMatch(
      loft_id,
      csvEntry.check_in_date,
      csvEntry.check_out_date
    );

    if (exactMatch) {
      return {
        type: 'exact',
        confidence: 100,
        ical_booking: exactMatch,
        csv_entry: csvEntry,
        loft_id,
        reason: 'Match exact sur loft_id + dates',
      };
    }

    // 3. Chercher fuzzy match (si activé)
    if (options.allow_fuzzy_match !== false) {
      const fuzzyMatch = await this.findFuzzyMatch(
        loft_id,
        csvEntry.check_in_date,
        csvEntry.check_out_date,
        options
      );

      if (fuzzyMatch && fuzzyMatch.confidence >= 60) {
        return {
          type: 'fuzzy',
          confidence: fuzzyMatch.confidence,
          ical_booking: fuzzyMatch.booking,
          csv_entry: csvEntry,
          loft_id,
          reason: `Match fuzzy (confiance: ${fuzzyMatch.confidence.toFixed(0)}%)`,
        };
      }
    }

    // 4. Aucun match trouvé
    return {
      type: 'none',
      confidence: 0,
      csv_entry: csvEntry,
      loft_id,
      reason: 'Aucune réservation iCal correspondante trouvée',
    };
  }

  /**
   * Match plusieurs entrées CSV avec les réservations iCal
   */
  async matchCSVEntries(
    csvEntries: CompleteReservation[],
    options: MatcherOptions = {}
  ): Promise<MatchingReport> {
    const report: MatchingReport = {
      total_csv_entries: csvEntries.length,
      exact_matches: 0,
      fuzzy_matches: 0,
      no_matches: 0,
      errors: 0,
      matches: [],
      error_details: [],
    };

    for (const csvEntry of csvEntries) {
      try {
        const matchResult = await this.matchCSVEntry(csvEntry, options);
        report.matches.push(matchResult);

        switch (matchResult.type) {
          case 'exact':
            report.exact_matches++;
            break;
          case 'fuzzy':
            report.fuzzy_matches++;
            break;
          case 'none':
            report.no_matches++;
            break;
        }
      } catch (error) {
        report.errors++;
        report.error_details.push({
          csv_entry: csvEntry,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return report;
  }

  /**
   * Enrichit une réservation partielle (iCal) avec les détails CSV
   */
  async enrichPartialReservation(
    matchResult: MatchResult
  ): Promise<{ success: boolean; error?: string }> {
    if (!matchResult.ical_booking || !matchResult.ical_booking.id) {
      return { success: false, error: 'Pas de réservation iCal à enrichir' };
    }

    if (matchResult.type === 'none') {
      return { success: false, error: 'Aucun match trouvé' };
    }

    try {
      const result = await this.repository.enrichBooking(
        matchResult.ical_booking.id,
        {
          guest_name: matchResult.csv_entry.guest_name,
          guest_email: matchResult.csv_entry.guest_email,
          guest_phone: matchResult.csv_entry.guest_phone,
          amount: matchResult.csv_entry.amount,
          currency: matchResult.csv_entry.currency,
          external_id: matchResult.csv_entry.confirmation_code,
        }
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Crée une nouvelle réservation depuis une entrée CSV (no match)
   */
  async createFromCSV(
    csvEntry: CompleteReservation,
    loft_id: string
  ): Promise<{ success: boolean; booking?: AirbnbBooking; error?: string }> {
    try {
      const result = await this.repository.createBooking({
        loft_id,
        source: 'airbnb_csv',
        external_id: csvEntry.confirmation_code,
        status: csvEntry.status as any,
        check_in_date: csvEntry.check_in_date,
        check_out_date: csvEntry.check_out_date,
        guest_name: csvEntry.guest_name,
        guest_email: csvEntry.guest_email,
        guest_phone: csvEntry.guest_phone,
        amount: csvEntry.amount,
        currency: csvEntry.currency,
        is_complete: true,
        csv_only_flag: true, // Flag pour indiquer que cette réservation vient uniquement du CSV
        raw_data: csvEntry.raw_data,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Traite un rapport de matching complet:
   * - Enrichit les exact/fuzzy matches
   * - Crée les nouvelles réservations pour les no matches
   */
  async processMatchingReport(
    report: MatchingReport
  ): Promise<{
    enriched: number;
    created: number;
    errors: number;
    error_details: Array<{ match: MatchResult; error: string }>;
  }> {
    let enriched = 0;
    let created = 0;
    let errors = 0;
    const error_details: Array<{ match: MatchResult; error: string }> = [];

    for (const match of report.matches) {
      try {
        if (match.type === 'exact' || match.type === 'fuzzy') {
          // Enrichir la réservation existante
          const result = await this.enrichPartialReservation(match);
          if (result.success) {
            enriched++;
          } else {
            errors++;
            error_details.push({ match, error: result.error || 'Erreur inconnue' });
          }
        } else if (match.type === 'none' && match.loft_id) {
          // Créer une nouvelle réservation
          const result = await this.createFromCSV(match.csv_entry, match.loft_id);
          if (result.success) {
            created++;
          } else {
            errors++;
            error_details.push({ match, error: result.error || 'Erreur inconnue' });
          }
        }
      } catch (error) {
        errors++;
        error_details.push({
          match,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return { enriched, created, errors, error_details };
  }

  /**
   * Fonction helper pour logger les résultats de matching
   */
  logMatchingReport(report: MatchingReport): void {
    console.log('\n📊 Rapport de Matching CSV ↔ iCal');
    console.log('═'.repeat(50));
    console.log(`Total entrées CSV: ${report.total_csv_entries}`);
    console.log(`✅ Exact matches: ${report.exact_matches}`);
    console.log(`🔍 Fuzzy matches: ${report.fuzzy_matches}`);
    console.log(`❌ No matches: ${report.no_matches}`);
    console.log(`⚠️  Erreurs: ${report.errors}`);
    console.log('═'.repeat(50));

    if (report.error_details.length > 0) {
      console.log('\n⚠️  Détails des erreurs:');
      for (const error of report.error_details) {
        console.log(`  - ${error.csv_entry.listing_name}: ${error.error}`);
      }
    }
  }
}

/**
 * Crée une instance du matcher
 */
export function createReservationMatcher(repository: BookingRepository): ReservationMatcher {
  return new ReservationMatcher(repository);
}
