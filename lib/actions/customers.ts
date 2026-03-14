'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: 'prospect' | 'active' | 'former';
  notes: string | null;
  current_loft_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  return data;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
  if (error) {
    console.error(`Error fetching customer ${id}:`, error);
    return null;
  }
  return data;
}

export async function createCustomer(formData: FormData): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  const first_name = formData.get('first_name') as string;
  const last_name = formData.get('last_name') as string;
  const email = formData.get('email') as string;
  const phone = (formData.get('phone') as string) || null;
  const status = (formData.get('status') as string) || 'prospect';
  const notes = (formData.get('notes') as string) || null;

  const { error } = await supabase.from('customers').insert({
    first_name,
    last_name,
    email,
    phone,
    status,
    notes,
  });

  if (error) {
    console.error('Error creating customer:', error);
    return { success: false, message: error.message };
  }

  revalidatePath('/customers');
  return { success: true };
}

export async function updateCustomer(id: string, formData: FormData): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  const first_name = formData.get('first_name') as string;
  const last_name = formData.get('last_name') as string;
  const email = formData.get('email') as string;
  const phone = (formData.get('phone') as string) || null;
  const status = (formData.get('status') as string) || 'prospect';
  const notes = (formData.get('notes') as string) || null;

  const { error } = await supabase.from('customers').update({
    first_name,
    last_name,
    email,
    phone,
    status,
    notes,
  }).eq('id', id);

  if (error) {
    console.error(`Error updating customer ${id}:`, error);
    return { success: false, message: error.message };
  }

  revalidatePath('/customers');
  return { success: true };
}

export async function deleteCustomer(id: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('customers').delete().eq('id', id);

  if (error) {
    console.error(`Error deleting customer ${id}:`, error);
    return { success: false, message: error.message };
  }

  revalidatePath('/customers');
  return { success: true };
}
