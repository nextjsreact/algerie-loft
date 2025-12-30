"use server";

import { createClient } from '@/utils/supabase/server';
import { InternetConnectionType } from '@/lib/types';

export async function getInternetConnectionTypes(): Promise<{ data: InternetConnectionType[] | null, error: any }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('internet_connection_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message || 'Failed to fetch internet connection types' };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred while fetching internet connection types' };
  }
}

export async function getInternetConnectionTypeById(id: string): Promise<{ data: InternetConnectionType | null, error: any }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('internet_connection_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Don't use console.error in server components as it can cause issues
      return { data: null, error: error.message || 'Failed to fetch internet connection type' };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred while fetching the internet connection type' };
  }
}

export async function createInternetConnectionType(
  type: string,
  speed?: string | null,
  provider?: string | null,
  status?: string | null,
  cost?: number | null
): Promise<{ data: InternetConnectionType | null; error: any }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('internet_connection_types')
      .insert([{ type, speed, provider, status, cost }])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message || 'Failed to create internet connection type' };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred while creating the internet connection type' };
  }
}

export async function updateInternetConnectionType(
  id: string,
  updates: Partial<Omit<InternetConnectionType, 'id'>>
): Promise<{ data: InternetConnectionType | null; error: any }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('internet_connection_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message || 'Failed to update internet connection type' };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred while updating the internet connection type' };
  }
}

export async function deleteInternetConnectionType(id: string): Promise<{ error: any }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('internet_connection_types')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message || 'Failed to delete internet connection type' };
    }
    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred while deleting the internet connection type' };
  }
}
