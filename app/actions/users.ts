"use server"

import { createClient } from '@/utils/supabase/server'
import type { User } from '@/lib/types'

export async function getUsers(): Promise<User[]> {
  const supabase = await createClient(true)
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')

  if (error) {
    console.error('Error getting users:', error)
    return []
  }

  return users as User[]
}

// Returns only confirmed staff members (is_staff = true, role = member)
// Used for task assignment dropdowns
export async function getStaffUsers(): Promise<User[]> {
  const supabase = await createClient(true)
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, team')
    .eq('role', 'member')
    .eq('is_staff', true)
    .order('full_name')

  if (error) {
    console.error('Error getting staff users:', error)
    return []
  }

  return users as User[]
}
