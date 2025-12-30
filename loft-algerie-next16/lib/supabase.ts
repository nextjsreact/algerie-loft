import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for your database tables
export interface Loft {
  id: string
  name: string
  description: string
  price: number
  location: string
  capacity: number
  amenities: string[]
  images: string[]
  available: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'client' | 'partner' | 'admin'
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  loft_id: string
  user_id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  updated_at: string
}