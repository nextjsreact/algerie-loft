/**
 * Booking Repository - Gestion des réservations Airbnb dans Supabase
 * 
 * Ce module gère toutes les opérations CRUD sur la table airbnb_bookings.
 * Il valide les données, gère les contraintes uniques, et maintient l'intégrité.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { addDays, isBefore, isAfter, subDays } from 'date-fns';

/**
 * Interface pour une réservation Airbnb
 */
export interface AirbnbBooking {
  id?: string;
  loft_id: string;
  source: 'airbnb_ical' | 'airbnb_csv' | 'manual';
  external_id?: string;
  status: 'confirmed' | 'cancelled' | 'pending' | 'checked_in' | 'checked_out';
  check_in_date: Date;
  check_out_date: Date;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  amount?: number;
  currency?: string;
  is_complete: boolean;
  csv_only_flag: boolean;
  raw_data?: any;
  created_at?: Date;
  updated_at?: Date;
  synced_at?: Date;
}

/**
 * Interface pour les filtres de recherche
 */
export interface BookingFilters {
  loft_id?: string;
  loft_ids?: string[];
  source?: AirbnbBooking['source'];
  status?: AirbnbBooking['status'];
  is_complete?: boolean;
  csv_only_flag?: boolean;
  date_from?: Date;
  date_to?: Date;
  external_id?: string;
}

/**
 * Résultat d'une opération de création/mise à jour
 */
export interface BookingOperationResult {
  success: boolean;
  booking?: AirbnbBooking;
  error?: string;
  isDuplicate?: boolean;
}

/**
 * Options pour le repository
 */
export interface BookingRepositoryOptions {
  supabaseUrl?: string;
  supabaseKey?: string;
  supabaseClient?: SupabaseClient;
}

/**
 * Repository pour les réservations Airbnb
 */
export class BookingRepository {
  private supabase: SupabaseClient;

  constructor(options: BookingRepositoryOptions = {}) {
    if (options.supabaseClient) {
      this.supabase = options.supabaseClient;
    } else {
      const url = options.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = options.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!url || !key) {
        throw new Error('Supabase URL and key are required');
      }

      this.supabase = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  /**
   * Valide une réservation avant insertion/mise à jour
   */
  private validateBooking(booking: Partial<AirbnbBooking>): { valid: boolean; error?: string } {
    // Vérifier les champs requis
    if (!booking.loft_id) {
      return { valid: false, error: 'loft_id est requis' };
    }

    if (!booking.check_in_date || !booking.check_out_date) {
      return { valid: false, error: 'check_in_date et check_out_date sont requis' };
    }

    // Vérifier que check_in < check_out
    if (!isBefore(booking.check_in_date, booking.check_out_date)) {
      return { valid: false, error: 'check_in_date doit être avant check_out_date' };
    }

    // Vérifier que check_in n'est pas trop dans le passé (30 jours max)
    const thirtyDaysAgo = subDays(new Date(), 30);
    if (isBefore(booking.check_in_date, thirtyDaysAgo)) {
      return { valid: false, error: 'check_in_date ne peut pas être plus de 30 jours dans le passé' };
    }

    // Vérifier le statut
    const validStatuses = ['confirmed', 'cancelled', 'pending', 'checked_in', 'checked_out'];
    if (booking.status && !validStatuses.includes(booking.status)) {
      return { valid: false, error: `status invalide: ${booking.status}` };
    }

    // Vérifier la source
    const validSources = ['airbnb_ical', 'airbnb_csv', 'manual'];
    if (booking.source && !validSources.includes(booking.source)) {
      return { valid: false, error: `source invalide: ${booking.source}` };
    }

    return { valid: true };
  }

  /**
   * Convertit une date en format ISO pour Supabase
   */
  private toISODate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Convertit un objet DB en AirbnbBooking
   */
  private fromDB(row: any): AirbnbBooking {
    return {
      ...row,
      check_in_date: new Date(row.check_in_date),
      check_out_date: new Date(row.check_out_date),
      created_at: row.created_at ? new Date(row.created_at) : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
      synced_at: row.synced_at ? new Date(row.synced_at) : undefined,
    };
  }

  /**
   * Crée une nouvelle réservation
   */
  async createBooking(booking: Omit<AirbnbBooking, 'id'>): Promise<BookingOperationResult> {
    // Valider
    const validation = this.validateBooking(booking);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      const { data, error } = await this.supabase
        .from('airbnb_bookings')
        .insert({
          loft_id: booking.loft_id,
          source: booking.source,
          external_id: booking.external_id,
          status: booking.status || 'confirmed',
          check_in_date: this.toISODate(booking.check_in_date),
          check_out_date: this.toISODate(booking.check_out_date),
          guest_name: booking.guest_name,
          guest_email: booking.guest_email,
          guest_phone: booking.guest_phone,
          amount: booking.amount,
          currency: booking.currency,
          is_complete: booking.is_complete || false,
          csv_only_flag: booking.csv_only_flag || false,
          raw_data: booking.raw_data,
          synced_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // Vérifier si c'est une erreur de contrainte unique
        if (error.code === '23505') {
          return {
            success: false,
            error: 'Une réservation existe déjà pour ces dates',
            isDuplicate: true,
          };
        }
        return { success: false, error: error.message };
      }

      return {
        success: true,
        booking: this.fromDB(data),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Met à jour une réservation existante
   * Préserve created_at et met à jour updated_at automatiquement
   */
  async updateBooking(
    id: string,
    updates: Partial<Omit<AirbnbBooking, 'id' | 'created_at'>>
  ): Promise<BookingOperationResult> {
    // Valider les updates
    if (updates.check_in_date || updates.check_out_date) {
      const validation = this.validateBooking(updates as any);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    try {
      const updateData: any = {};

      if (updates.loft_id) updateData.loft_id = updates.loft_id;
      if (updates.source) updateData.source = updates.source;
      if (updates.external_id !== undefined) updateData.external_id = updates.external_id;
      if (updates.status) updateData.status = updates.status;
      if (updates.check_in_date) updateData.check_in_date = this.toISODate(updates.check_in_date);
      if (updates.check_out_date) updateData.check_out_date = this.toISODate(updates.check_out_date);
      if (updates.guest_name !== undefined) updateData.guest_name = updates.guest_name;
      if (updates.guest_email !== undefined) updateData.guest_email = updates.guest_email;
      if (updates.guest_phone !== undefined) updateData.guest_phone = updates.guest_phone;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.is_complete !== undefined) updateData.is_complete = updates.is_complete;
      if (updates.csv_only_flag !== undefined) updateData.csv_only_flag = updates.csv_only_flag;
      if (updates.raw_data !== undefined) updateData.raw_data = updates.raw_data;

      const { data, error } = await this.supabase
        .from('airbnb_bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Réservation non trouvée' };
      }

      return {
        success: true,
        booking: this.fromDB(data),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Enrichit une réservation partielle (iCal) avec les détails CSV
   * Met à jour source vers 'airbnb_csv' et is_complete vers true
   */
  async enrichBooking(
    id: string,
    csvDetails: {
      guest_name?: string;
      guest_email?: string;
      guest_phone?: string;
      amount?: number;
      currency?: string;
      external_id?: string;
    }
  ): Promise<BookingOperationResult> {
    return this.updateBooking(id, {
      ...csvDetails,
      source: 'airbnb_csv',
      is_complete: true,
    });
  }

  /**
   * Récupère une réservation par ID
   */
  async getBookingById(id: string): Promise<AirbnbBooking | null> {
    try {
      const { data, error } = await this.supabase
        .from('airbnb_bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return this.fromDB(data);
    } catch {
      return null;
    }
  }

  /**
   * Recherche des réservations avec filtres
   */
  async getBookings(filters: BookingFilters = {}): Promise<AirbnbBooking[]> {
    try {
      let query = this.supabase.from('airbnb_bookings').select('*');

      if (filters.loft_id) {
        query = query.eq('loft_id', filters.loft_id);
      }

      if (filters.loft_ids && filters.loft_ids.length > 0) {
        query = query.in('loft_id', filters.loft_ids);
      }

      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.is_complete !== undefined) {
        query = query.eq('is_complete', filters.is_complete);
      }

      if (filters.csv_only_flag !== undefined) {
        query = query.eq('csv_only_flag', filters.csv_only_flag);
      }

      if (filters.external_id) {
        query = query.eq('external_id', filters.external_id);
      }

      if (filters.date_from) {
        query = query.gte('check_out_date', this.toISODate(filters.date_from));
      }

      if (filters.date_to) {
        query = query.lte('check_in_date', this.toISODate(filters.date_to));
      }

      query = query.order('check_in_date', { ascending: true });

      const { data, error } = await query;

      if (error || !data) return [];

      return data.map(row => this.fromDB(row));
    } catch {
      return [];
    }
  }

  /**
   * Récupère les réservations pour une plage de dates
   */
  async getBookingsByDateRange(
    loft_id: string,
    startDate: Date,
    endDate: Date
  ): Promise<AirbnbBooking[]> {
    return this.getBookings({
      loft_id,
      date_from: startDate,
      date_to: endDate,
    });
  }

  /**
   * Trouve une réservation par loft_id et dates exactes
   */
  async findByLoftAndDates(
    loft_id: string,
    check_in_date: Date,
    check_out_date: Date
  ): Promise<AirbnbBooking | null> {
    try {
      const { data, error } = await this.supabase
        .from('airbnb_bookings')
        .select('*')
        .eq('loft_id', loft_id)
        .eq('check_in_date', this.toISODate(check_in_date))
        .eq('check_out_date', this.toISODate(check_out_date))
        .single();

      if (error || !data) return null;

      return this.fromDB(data);
    } catch {
      return null;
    }
  }

  /**
   * Supprime une réservation
   */
  async deleteBooking(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('airbnb_bookings')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Compte le nombre de réservations avec filtres
   */
  async countBookings(filters: BookingFilters = {}): Promise<number> {
    try {
      let query = this.supabase
        .from('airbnb_bookings')
        .select('*', { count: 'exact', head: true });

      if (filters.loft_id) query = query.eq('loft_id', filters.loft_id);
      if (filters.source) query = query.eq('source', filters.source);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.is_complete !== undefined) query = query.eq('is_complete', filters.is_complete);

      const { count, error } = await query;

      if (error) return 0;

      return count || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Crée plusieurs réservations en bulk
   */
  async createBookingsBulk(
    bookings: Omit<AirbnbBooking, 'id'>[]
  ): Promise<{
    success: boolean;
    created: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    const errors: Array<{ index: number; error: string }> = [];
    let created = 0;

    for (let i = 0; i < bookings.length; i++) {
      const result = await this.createBooking(bookings[i]);
      if (result.success) {
        created++;
      } else {
        errors.push({ index: i, error: result.error || 'Erreur inconnue' });
      }
    }

    return {
      success: errors.length === 0,
      created,
      errors,
    };
  }
}

/**
 * Crée une instance du repository avec les credentials par défaut
 */
export function createBookingRepository(options?: BookingRepositoryOptions): BookingRepository {
  return new BookingRepository(options);
}
