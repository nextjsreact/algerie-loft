/**
 * Integration Tests: CSV Import
 * 
 * Tests du système d'import CSV manuel
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { parseAirbnbCSV } from '@/lib/sync/csvParser';

describe('CSV Import Integration Tests', () => {
  describe('CSV Parsing', () => {
    it('should parse valid Airbnb CSV format', () => {
      const csvContent = `Confirmation Code,Start Date,End Date,Nights,Guest,Listing,Status,Payout,Currency
ABC123,2026-06-01,2026-06-05,4,John Doe,Loft Alger Centre,confirmed,€400.00,EUR
DEF456,2026-06-10,2026-06-15,5,Jane Smith,Loft Oran,confirmed,€500.00,EUR`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.parsed_lines).toBe(2);
      expect(result.reservations).toHaveLength(2);

      const firstReservation = result.reservations[0];
      expect(firstReservation).toMatchObject({
        confirmation_code: 'ABC123',
        guest_name: 'John Doe',
        status: 'confirmed',
        total_amount: 400,
        currency: 'EUR',
      });
    });

    it('should handle different date formats', () => {
      const csvContent = `Confirmation Code,Start Date,End Date,Nights,Guest,Listing,Status,Payout,Currency
ABC123,01/06/2026,05/06/2026,4,John Doe,Loft Test,confirmed,€400.00,EUR
DEF456,2026-06-10,2026-06-15,5,Jane Smith,Loft Test 2,confirmed,€500.00,EUR`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.parsed_lines).toBe(2);
      expect(result.reservations).toHaveLength(2);
    });

    it('should handle parsing errors gracefully', () => {
      const csvContent = `Confirmation Code,Start Date,End Date,Nights,Guest,Listing,Status,Payout,Currency
ABC123,invalid-date,2026-06-05,4,John Doe,Loft Test,confirmed,€400.00,EUR
DEF456,2026-06-10,2026-06-15,5,Jane Smith,Loft Test 2,confirmed,€500.00,EUR`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('ligne 2');
    });

    it('should normalize status values', () => {
      const csvContent = `Confirmation Code,Start Date,End Date,Nights,Guest,Listing,Status,Payout,Currency
ABC123,2026-06-01,2026-06-05,4,John Doe,Loft Test,Confirmed,€400.00,EUR
DEF456,2026-06-10,2026-06-15,5,Jane Smith,Loft Test 2,CANCELLED,€500.00,EUR
GHI789,2026-06-20,2026-06-25,5,Bob Johnson,Loft Test 3,Pending,€600.00,EUR`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.reservations[0].status).toBe('confirmed');
      expect(result.reservations[1].status).toBe('cancelled');
      expect(result.reservations[2].status).toBe('pending');
    });

    it('should parse amounts with different currency symbols', () => {
      const csvContent = `Confirmation Code,Start Date,End Date,Nights,Guest,Listing,Status,Payout,Currency
ABC123,2026-06-01,2026-06-05,4,John Doe,Loft Test,confirmed,$400.00,USD
DEF456,2026-06-10,2026-06-15,5,Jane Smith,Loft Test 2,confirmed,£500.00,GBP
GHI789,2026-06-20,2026-06-25,5,Bob Johnson,Loft Test 3,confirmed,€600.00,EUR`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.reservations[0].total_amount).toBe(400);
      expect(result.reservations[0].currency).toBe('USD');
      expect(result.reservations[1].total_amount).toBe(500);
      expect(result.reservations[1].currency).toBe('GBP');
      expect(result.reservations[2].total_amount).toBe(600);
      expect(result.reservations[2].currency).toBe('EUR');
    });
  });

  describe('CSV Validation', () => {
    it('should reject CSV with missing required columns', () => {
      const csvContent = `Confirmation Code,Start Date,End Date
ABC123,2026-06-01,2026-06-05`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty CSV', () => {
      const csvContent = `Confirmation Code,Start Date,End Date,Nights,Guest,Listing,Status,Payout,Currency`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.parsed_lines).toBe(0);
      expect(result.reservations).toHaveLength(0);
    });

    it('should handle UTF-8 with BOM', () => {
      const csvContent = '\uFEFF' + `Confirmation Code,Start Date,End Date,Nights,Guest,Listing,Status,Payout,Currency
ABC123,2026-06-01,2026-06-05,4,John Doe,Loft Test,confirmed,€400.00,EUR`;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.parsed_lines).toBe(1);
    });
  });

  describe('Large CSV Files', () => {
    it('should handle CSV with 1000 reservations', () => {
      const header = `Confirmation Code,Start Date,End Date,Nights,Guest,Listing,Status,Payout,Currency\n`;
      const rows = Array.from({ length: 1000 }, (_, i) => 
        `ABC${i},2026-06-01,2026-06-05,4,Guest ${i},Loft ${i},confirmed,€400.00,EUR`
      ).join('\n');
      const csvContent = header + rows;

      const result = parseAirbnbCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.parsed_lines).toBe(1000);
      expect(result.reservations).toHaveLength(1000);
    });
  });
});
