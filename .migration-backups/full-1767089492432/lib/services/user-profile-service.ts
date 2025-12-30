'use server';

import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

// User profile schema for validation
const userProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name is too long"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  nationality: z.string().min(2, "Please select your nationality"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  emergencyContact: z.object({
    name: z.string().min(2, "Emergency contact name is required"),
    phone: z.string().min(10, "Emergency contact phone is required"),
    relationship: z.string().min(1, "Relationship is required")
  }).optional(),
  preferences: z.object({
    language: z.string().default('fr'),
    currency: z.string().default('EUR'),
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      marketing: z.boolean().default(false)
    })
  })
});

// User preference schema
const userPreferencesSchema = z.object({
  language: z.string().default('fr'),
  currency: z.string().default('EUR'),
  notifications: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    marketing: z.boolean().default(false)
  }),
  bookingDefaults: z.object({
    arrivalTime: z.string().optional(),
    specialRequests: z.string().optional(),
    accessibilityNeeds: z.string().optional(),
    dietaryRestrictions: z.string().optional()
  }).optional()
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<ServiceResult<UserProfile>> {
  try {
    const supabase = await createClient();
    
    // Get user data from auth.users and customers table
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Try to get customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', userId)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Error fetching customer profile:', customerError);
      return { success: false, error: 'Failed to fetch user profile' };
    }

    // Construct profile from available data
    const profile: UserProfile = {
      firstName: customer?.first_name || user.user.user_metadata?.first_name || '',
      lastName: customer?.last_name || user.user.user_metadata?.last_name || '',
      email: customer?.email || user.user.email || '',
      phone: customer?.phone || user.user.user_metadata?.phone || '',
      nationality: customer?.nationality || '',
      dateOfBirth: customer?.date_of_birth || '',
      emergencyContact: customer?.emergency_contact || undefined,
      preferences: customer?.preferences || {
        language: 'fr',
        currency: 'EUR',
        notifications: {
          email: true,
          sms: false,
          marketing: false
        }
      }
    };

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<ServiceResult<UserProfile>> {
  try {
    const supabase = await createClient();
    
    // Validate the profile data
    const validatedData = userProfileSchema.partial().parse(profileData);
    
    // Check if customer record exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', userId)
      .single();

    const customerData = {
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      nationality: validatedData.nationality,
      date_of_birth: validatedData.dateOfBirth,
      emergency_contact: validatedData.emergencyContact,
      preferences: validatedData.preferences,
      updated_at: new Date().toISOString()
    };

    if (existingCustomer) {
      // Update existing customer
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating customer profile:', updateError);
        return { success: false, error: 'Failed to update profile' };
      }

      return { success: true, data: validatedData as UserProfile };
    } else {
      // Create new customer record
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          id: userId,
          ...customerData,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating customer profile:', createError);
        return { success: false, error: 'Failed to create profile' };
      }

      return { success: true, data: validatedData as UserProfile };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Invalid profile data: ' + error.issues.map(i => i.message).join(', ')
      };
    }
    
    console.error('Error in updateUserProfile:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<ServiceResult<UserPreferences>> {
  try {
    const supabase = await createClient();
    
    const { data: customer, error } = await supabase
      .from('customers')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user preferences:', error);
      return { success: false, error: 'Failed to fetch preferences' };
    }

    const preferences: UserPreferences = customer?.preferences || {
      language: 'fr',
      currency: 'EUR',
      notifications: {
        email: true,
        sms: false,
        marketing: false
      }
    };

    return { success: true, data: preferences };
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<ServiceResult<UserPreferences>> {
  try {
    const supabase = await createClient();
    
    // Validate preferences
    const validatedPreferences = userPreferencesSchema.partial().parse(preferences);
    
    // Get current preferences
    const currentResult = await getUserPreferences(userId);
    if (!currentResult.success) {
      return currentResult;
    }

    // Merge with current preferences
    const updatedPreferences = {
      ...currentResult.data,
      ...validatedPreferences
    };

    // Update in database
    const { error } = await supabase
      .from('customers')
      .update({ 
        preferences: updatedPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user preferences:', error);
      return { success: false, error: 'Failed to update preferences' };
    }

    return { success: true, data: updatedPreferences };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Invalid preferences data: ' + error.issues.map(i => i.message).join(', ')
      };
    }
    
    console.error('Error in updateUserPreferences:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get user booking history
 */
export async function getUserBookingHistory(userId: string, filters?: {
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}): Promise<ServiceResult<any[]>> {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('reservations')
      .select(`
        id,
        loft_id,
        check_in_date,
        check_out_date,
        guest_count,
        status,
        payment_status,
        total_amount,
        booking_reference,
        special_requests,
        created_at,
        lofts (
          id,
          name,
          address
        )
      `)
      .eq('guest_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }
    
    if (filters?.dateFrom) {
      query = query.gte('check_in_date', filters.dateFrom);
    }
    
    if (filters?.dateTo) {
      query = query.lte('check_out_date', filters.dateTo);
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching booking history:', error);
      return { success: false, error: 'Failed to fetch booking history' };
    }

    // Transform data to match expected format
    const transformedBookings = bookings?.map(booking => ({
      id: booking.id,
      loft: {
        id: booking.loft_id,
        name: booking.lofts?.name || 'Unknown Loft',
        address: booking.lofts?.address || 'Unknown Address'
      },
      checkIn: booking.check_in_date,
      checkOut: booking.check_out_date,
      guests: booking.guest_count,
      nights: Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)),
      status: booking.status,
      paymentStatus: booking.payment_status,
      totalAmount: booking.total_amount || 0,
      currency: 'EUR',
      bookingReference: booking.booking_reference,
      createdAt: booking.created_at,
      specialRequests: booking.special_requests
    })) || [];

    return { success: true, data: transformedBookings };
  } catch (error) {
    console.error('Error in getUserBookingHistory:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Pre-fill booking form with user profile data
 */
export async function getBookingFormPreFillData(userId: string): Promise<ServiceResult<any>> {
  try {
    const profileResult = await getUserProfile(userId);
    
    if (!profileResult.success || !profileResult.data) {
      return { success: false, error: 'Failed to get profile data' };
    }

    const profile = profileResult.data;
    
    // Transform profile data to booking form format
    const preFillData = {
      primaryGuest: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        nationality: profile.nationality,
        dateOfBirth: profile.dateOfBirth,
        emergencyContact: profile.emergencyContact
      },
      preferences: profile.preferences?.bookingDefaults || {}
    };

    return { success: true, data: preFillData };
  } catch (error) {
    console.error('Error in getBookingFormPreFillData:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Update booking defaults from completed booking
 */
export async function updateBookingDefaults(userId: string, bookingData: {
  arrivalTime?: string;
  specialRequests?: string;
  accessibilityNeeds?: string;
  dietaryRestrictions?: string;
}): Promise<ServiceResult<void>> {
  try {
    const preferencesResult = await getUserPreferences(userId);
    
    if (!preferencesResult.success) {
      return preferencesResult;
    }

    const currentPreferences = preferencesResult.data!;
    
    // Update booking defaults
    const updatedPreferences = {
      ...currentPreferences,
      bookingDefaults: {
        ...currentPreferences.bookingDefaults,
        ...bookingData
      }
    };

    return await updateUserPreferences(userId, updatedPreferences);
  } catch (error) {
    console.error('Error in updateBookingDefaults:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get user statistics for profile dashboard
 */
export async function getUserStatistics(userId: string): Promise<ServiceResult<{
  totalBookings: number;
  completedBookings: number;
  totalSpent: number;
  averageRating: number;
  favoriteDestinations: string[];
}>> {
  try {
    const supabase = await createClient();
    
    // Get booking statistics
    const { data: bookings, error: bookingsError } = await supabase
      .from('reservations')
      .select('status, total_amount, lofts(address)')
      .eq('guest_id', userId);

    if (bookingsError) {
      console.error('Error fetching booking statistics:', bookingsError);
      return { success: false, error: 'Failed to fetch statistics' };
    }

    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    const totalSpent = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    
    // Calculate favorite destinations (simplified)
    const destinations = bookings?.map(b => b.lofts?.address).filter(Boolean) || [];
    const destinationCounts = destinations.reduce((acc: Record<string, number>, dest) => {
      acc[dest] = (acc[dest] || 0) + 1;
      return acc;
    }, {});
    
    const favoriteDestinations = Object.entries(destinationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([dest]) => dest);

    const statistics = {
      totalBookings,
      completedBookings,
      totalSpent,
      averageRating: 0, // Would need reviews table
      favoriteDestinations
    };

    return { success: true, data: statistics };
  } catch (error) {
    console.error('Error in getUserStatistics:', error);
    return { success: false, error: 'Internal server error' };
  }
}