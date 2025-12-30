import { User, UserRole, Loft, LoftStatus } from "@/lib/types";
import { createClient } from '@/utils/supabase/server'; // Import the new createClient

export async function ensureUsersTable() {
  console.log('ensureUsersTable function (now checks for profiles) was called');
  const supabase = await createClient();

  // Check if the 'profiles' table exists by trying to select from it
  const { error: selectError } = await supabase.from('profiles').select('id').limit(1);

  if (selectError && typeof selectError.message === 'string' && selectError.message.includes('relation "profiles" does not exist')) {
    // If the table does not exist, create it
    console.log('Profiles table does not exist, creating it...');
    const createTableQuery = `
      CREATE TABLE profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'member',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    const { error: createError } = await supabase.rpc('execute_sql', { sql: createTableQuery });

    if (createError) {
      console.error('Error creating profiles table:', createError);
      throw createError;
    }
    console.log('Profiles table created successfully.');
    
    const rlsQuery = `
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
      CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
      CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
    `;
    const { error: rlsError } = await supabase.rpc('execute_sql', { sql: rlsQuery });
    if (rlsError) {
        console.error('Error setting up RLS for profiles table:', rlsError);
    } else {
        console.log('RLS policies for profiles table created successfully.');
    }

  } else if (selectError) {
    // Handle other types of select errors
    console.error('Error ensuring profiles table exists:', selectError);
    throw selectError;
  } else {
    console.log('Profiles table already exists.');
  }
}

export async function createUser(
  email: string,
  password_hash: string,
  full_name?: string,
) {
  const supabase = await createClient(); // Create client here
  const { data, error } = await supabase.auth.signUp({
    email,
    password: password_hash,
    options: {
      data: {
        full_name,
        role: 'member',
      },
    },
  });

  if (error) {
    console.error('Error creating user:', error)
    throw error
  }

  return data
}

export async function getUserWithRelations(email: string) {
  const supabase = await createClient(); // Create client here
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('Error getting user by email:', error)
    throw error
  }

  return data as User | undefined
}

export async function getAllLofts() {
  const supabase = await createClient(); // Create client here
  const { data, error } = await supabase
    .from('lofts')
    .select('*')

  if (error) {
    console.error('Error getting all lofts:', error)
    throw error
  }

  return data as Loft[] | undefined
}

export async function getOwnerLofts(ownerId: string) {
  const supabase = await createClient(); // Create client here
  const { data, error } = await supabase
    .from('lofts')
    .select('*')
    .eq('owner_id', ownerId)

  if (error) {
    console.error('Error getting owner lofts:', error)
    throw error
  }

  return data as Loft[] | undefined
}
