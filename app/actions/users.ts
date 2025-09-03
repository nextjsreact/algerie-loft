"use server"

import { createClient } from '@/utils/supabase/server'
import type { User } from '@/lib/types'

export async function getUsers(): Promise<User[]> {
  const supabase = await createClient()
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')

  if (error) {
    console.error('Error getting users:', error)
    // Instead of throwing, return an empty array to prevent client-side errors
    return []
  }

  return users as User[]
}
