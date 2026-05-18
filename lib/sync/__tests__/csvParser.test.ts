/**
 * Tests pour CSV Parser
 * 
 * Note: Ces tests nécessitent le package 'csv-parse'
 * Installation: npm install csv-parse
 */

import { describe, it, expect } from 'vitest';
import {
  parseAirbnbCSV,
  validateCSVFormat,
  generateCSV,
  type CompleteReservation,
} from '../csvParser';

describe('csvParser', () => {
  describe('parseAirbnbCSV', () => {
    it('devrait parser un CSV Airbnb valide', () => {
      const csvContent = `Listing,Confirmation Code,Guest,Email,Phone,Check In,Check Out,Nights,Guests,Status,Amount,Currency
"Loft Paradise","HM123456","John Doe","john@example.com","+33612345678","2026-06-01","2026-06-05",4,2,"Confirmed","450.00","EUR"
"Loft Sunset","HM789012","Jane Smith","jane@example.com","+33698765432","2026-06-10","2026-06-15",5,3,"Confirmed","600.00","EUR"`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.reservations).toHaveLength(2);
      expect(result.parsed_lines).toBe(2);
      expect(result.errors).toHaveLength(0);

      const first = result.reservations[0];
      expect(first.listing_name).toBe('Loft Paradise');
      expect(first.confirmation_code).toBe('HM123456');
      expect(first.guest_name).toBe('John Doe');
      expect(first.guest_email).toBe('john@example.com');
      expect(first.guest_phone).toBe('+33612345678');
      expect(first.check_in_date).toEqual(new Date('2026-06-01'));
      expect(first.check_out_date).toEqual(new Date('2026-06-05'));
      expect(first.nights).toBe(4);
      expect(first.guests).toBe(2);
      expect(first.status).toBe('confirmed');
      expect(first.amount).toBe(450.00);
      expect(first.currency).toBe('EUR');
    });

    it('devrait gérer un CSV vide', () => {
      const csvContent = `Listing,Check In,Check Out
`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.reservations).toHaveLength(0);
      expect(result.parsed_lines).toBe(0);
    });

    it('devrait détecter les colonnes manquantes', () => {
      const csvContent = `Guest,Amount
"John Doe","450.00"`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Listing Name');
    });

    it('devrait gérer les dates invalides', () => {
      const csvContent = `Listing,Check In,Check Out
"Loft Paradise","invalid-date","2026-06-05"`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Dates invalides');
    });

    it('devrait valider que check_in < check_out', () => {
      const csvContent = `Listing,Check In,Check Out
"Loft Paradise","2026-06-10","2026-06-05"`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Check-in doit être avant check-out');
    });

    it('devrait parser différents formats de dates', () => {
      const testCases = [
        { input: '2026-06-01', expected: new Date('2026-06-01') },
        { input: '01/06/2026', expected: new Date(2026, 5, 1) },
        { input: '06/01/2026', expected: new Date(2026, 5, 1) },
      ];

      for (const { input, expected } of testCases) {
        const csvContent = `Listing,Check In,Check Out
"Loft Paradise","${input}","2026-06-05"`;

        const result = parseAirbnbCSV(csvContent);

        if (result.success && result.reservations.length > 0) {
          expect(result.reservations[0].check_in_date.getTime()).toBe(expected.getTime());
        }
      }
    });

    it('devrait parser différents formats de montants', () => {
      const testCases = [
        { input: '450.00', expected: 450.00 },
        { input: '$450.00', expected: 450.00 },
        { input: '1,234.56', expected: 1234.56 },
        { input: '1 234.56', expected: 1234.56 },
        { input: '450,00', expected: 450.00 },
      ];

      for (const { input, expected } of testCases) {
        const csvContent = `Listing,Check In,Check Out,Amount
"Loft Paradise","2026-06-01","2026-06-05","${input}"`;

        const result = parseAirbnbCSV(csvContent);

        if (result.success && result.reservations.length > 0) {
          expect(result.reservations[0].amount).toBe(expected);
        }
      }
    });

    it('devrait normaliser les statuts', () => {
      const testCases = [
        { input: 'Confirmed', expected: 'confirmed' },
        { input: 'CONFIRMED', expected: 'confirmed' },
        { input: 'Cancelled', expected: 'cancelled' },
        { input: 'Pending', expected: 'pending' },
        { input: 'Accepted', expected: 'confirmed' },
      ];

      for (const { input, expected } of testCases) {
        const csvContent = `Listing,Check In,Check Out,Status
"Loft Paradise","2026-06-01","2026-06-05","${input}"`;

        const result = parseAirbnbCSV(csvContent);

        if (result.success && result.reservations.length > 0) {
          expect(result.reservations[0].status).toBe(expected);
        }
      }
    });

    it('devrait gérer les champs optionnels manquants', () => {
      const csvContent = `Listing,Check In,Check Out
"Loft Paradise","2026-06-01","2026-06-05"`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.reservations).toHaveLength(1);

      const reservation = result.reservations[0];
      expect(reservation.guest_email).toBeUndefined();
      expect(reservation.guest_phone).toBeUndefined();
      expect(reservation.amount).toBe(0);
      expect(reservation.currency).toBe('EUR');
    });

    it('devrait supporter les noms de colonnes en français', () => {
      const csvContent = `Annonce,Date d'arrivée,Date de départ,Voyageur,Montant,Devise
"Loft Paradise","2026-06-01","2026-06-05","Jean Dupont","450.00","EUR"`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.reservations).toHaveLength(1);
      expect(result.reservations[0].listing_name).toBe('Loft Paradise');
      expect(result.reservations[0].guest_name).toBe('Jean Dupont');
    });

    it('devrait gérer les caractères UTF-8', () => {
      const csvContent = `Listing,Check In,Check Out,Guest
"Loft Élégant","2026-06-01","2026-06-05","François Müller"`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.reservations).toHaveLength(1);
      expect(result.reservations[0].listing_name).toBe('Loft Élégant');
      expect(result.reservations[0].guest_name).toBe('François Müller');
    });

    it('devrait continuer après une ligne invalide', () => {
      const csvContent = `Listing,Check In,Check Out
"Loft Paradise","invalid-date","2026-06-05"
"Loft Sunset","2026-06-10","2026-06-15"`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.reservations).toHaveLength(1); // Seule la 2ème ligne est parsée
      expect(result.errors).toHaveLength(1);
      expect(result.reservations[0].listing_name).toBe('Loft Sunset');
    });

    it('devrait inclure les données brutes pour debugging', () => {
      const csvContent = `Listing,Check In,Check Out,Custom Field
"Loft Paradise","2026-06-01","2026-06-05","Custom Value"`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.reservations[0].raw_data).toBeDefined();
      expect(result.reservations[0].raw_data['Custom Field']).toBe('Custom Value');
    });
  });

  describe('validateCSVFormat', () => {
    it('devrait valider un CSV correct', () => {
      const csvContent = `Listing,Check In,Check Out
"Loft Paradise","2026-06-01","2026-06-05"`;

      const result = validateCSVFormat(csvContent);

      expect(result.valid).toBe(true);
      expect(result.headers).toBeDefined();
      expect(result.headers).toContain('Listing');
    });

    it('devrait rejeter un CSV vide', () => {
      const csvContent = '';

      const result = validateCSVFormat(csvContent);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter un CSV sans colonnes requises', () => {
      const csvContent = `Guest,Amount
"John Doe","450.00"`;

      const result = validateCSVFormat(csvContent);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Listing Name');
    });

    it('devrait rejeter un CSV sans colonnes de dates', () => {
      const csvContent = `Listing,Guest
"Loft Paradise","John Doe"`;

      const result = validateCSVFormat(csvContent);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('dates');
    });
  });

  describe('generateCSV', () => {
    it('devrait générer un CSV depuis des réservations', () => {
      const reservations: CompleteReservation[] = [
        {
          listing_name: 'Loft Paradise',
          confirmation_code: 'HM123456',
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          guest_phone: '+33612345678',
          check_in_date: new Date('2026-06-01'),
          check_out_date: new Date('2026-06-05'),
          nights: 4,
          guests: 2,
          status: 'confirmed',
          amount: 450.00,
          currency: 'EUR',
        },
      ];

      const csv = generateCSV(reservations);

      expect(csv).toContain('Listing Name');
      expect(csv).toContain('Loft Paradise');
      expect(csv).toContain('HM123456');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('2026-06-01');
    });

    it('devrait générer un CSV vide avec headers', () => {
      const csv = generateCSV([]);

      expect(csv).toContain('Listing Name');
      expect(csv).toContain('Check In');
      expect(csv).toContain('Check Out');
    });

    it('devrait échapper les guillemets dans les valeurs', () => {
      const reservations: CompleteReservation[] = [
        {
          listing_name: 'Loft "Paradise"',
          confirmation_code: 'HM123456',
          guest_name: 'John Doe',
          check_in_date: new Date('2026-06-01'),
          check_out_date: new Date('2026-06-05'),
          nights: 4,
          guests: 2,
          status: 'confirmed',
          amount: 450.00,
          currency: 'EUR',
        },
      ];

      const csv = generateCSV(reservations);

      expect(csv).toContain('"Loft "Paradise""');
    });
  });

  describe('Round-trip property', () => {
    it('devrait maintenir l\'intégrité des données après parse → generate → parse', () => {
      const original: CompleteReservation[] = [
        {
          listing_name: 'Loft Paradise',
          confirmation_code: 'HM123456',
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          guest_phone: '+33612345678',
          check_in_date: new Date('2026-06-01'),
          check_out_date: new Date('2026-06-05'),
          nights: 4,
          guests: 2,
          status: 'confirmed',
          amount: 450.00,
          currency: 'EUR',
        },
      ];

      // Generate CSV
      const csv = generateCSV(original);

      // Parse back
      const result = parseAirbnbCSV(csv);

      expect(result.success).toBe(true);
      expect(result.reservations).toHaveLength(1);

      const parsed = result.reservations[0];
      expect(parsed.listing_name).toBe(original[0].listing_name);
      expect(parsed.confirmation_code).toBe(original[0].confirmation_code);
      expect(parsed.guest_name).toBe(original[0].guest_name);
      expect(parsed.check_in_date.toISOString()).toBe(original[0].check_in_date.toISOString());
      expect(parsed.check_out_date.toISOString()).toBe(original[0].check_out_date.toISOString());
      expect(parsed.amount).toBe(original[0].amount);
    });
  });
});
