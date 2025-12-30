'use server';

import { createClient } from '@/utils/supabase/server';

// Type definitions for Customer based on the actual database schema
export type Customer = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

// Function to fetch all customers
export async function getCustomers(): Promise<Customer[]> {
  const supabase = createClient();
  const client = await supabase;
  const { data, error } = await client.from('customers').select('*');
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  return data;
}

// Function to fetch a single customer by ID
export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = createClient();
  const client = await supabase;
  const { data, error } = await client.from('customers').select('*').eq('id', id).single();
  if (error) {
    console.error(`Error fetching customer with ID ${id}:`, error);
    return null;
  }
  return data;
}

// Function to create a new customer
export async function createCustomer(formData: FormData): Promise<{ success: boolean; message?: string }> {
  const { revalidatePath } = await import('next/cache');
  const { redirect } = await import('next/navigation');
  const supabase = createClient();
  const client = await supabase;

  const email = formData.get('email') as string;
  const full_name = formData.get('full_name') as string | undefined;
  const phone = formData.get('phone') as string | undefined;
  const address = formData.get('address') as string | undefined;

  const { error } = await client.from('customers').insert({
    email,
    full_name: full_name || null,
    phone: phone || null,
    address: address || null,
  });

  if (error) {
    console.error('Error creating customer:', error);
    return { success: false, message: error.message };
  }

  revalidatePath('/customers');
  redirect('/customers');
  return { success: true }; // Should not be reached due to redirect
}

// Function to update an existing customer
export async function updateCustomer(id: string, formData: FormData): Promise<{ success: boolean; message?: string }> {
  const { revalidatePath } = await import('next/cache');
  const { redirect } = await import('next/navigation');
  const supabase = createClient();
  const client = await supabase;

  const email = formData.get('email') as string;
  const full_name = formData.get('full_name') as string | undefined;
  const phone = formData.get('phone') as string | undefined;
  const address = formData.get('address') as string | undefined;

  const { error } = await client.from('customers').update({
    email,
    full_name: full_name || null,
    phone: phone || null,
    address: address || null,
  }).eq('id', id);

  if (error) {
    console.error(`Error updating customer with ID ${id}:`, error);
    return { success: false, message: error.message };
  }

  revalidatePath('/customers');
  redirect('/customers');
  return { success: true }; // Should not be reached due to redirect
}

// Function to delete a customer
export async function deleteCustomer(id: string): Promise<{ success: boolean; message?: string }> {
  const { revalidatePath } = await import('next/cache');
  const { redirect } = await import('next/navigation');
  const supabase = createClient();
  const client = await supabase;
  const { error } = await client.from('customers').delete().eq('id', id);

  if (error) {
    console.error(`Error deleting customer with ID ${id}:`, error);
    return { success: false, message: error.message };
  }

  revalidatePath('/customers');
  redirect('/customers');
  return { success: true }; // Should not be reached due to redirect
}