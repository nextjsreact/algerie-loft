-- Create user roles enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member');
    END IF;
END$$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category VARCHAR(50),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample users
INSERT INTO users (id, email, full_name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@loftmanager.com', 'System Admin', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440002', 'manager@loftmanager.com', 'Property Manager', 'manager'),
  ('550e8400-e29b-41d4-a716-446655440003', 'member@loftmanager.com', 'Team Member', 'member')
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (id, amount, description, transaction_type, status, user_id) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', 2500.00, 'Monthly rent - Downtown Loft A1', 'income', 'completed', '550e8400-e29b-41d4-a716-446655440001'),
  ('aa0e8400-e29b-41d4-a716-446655440002', -150.00, 'Heating repair costs', 'expense', 'completed', '550e8400-e29b-41d4-a716-446655440003'),
  ('aa0e8400-e29b-41d4-a716-446655440003', 3200.00, 'Monthly rent - Riverside Loft B2', 'income', 'pending', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;
