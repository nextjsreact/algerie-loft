-- Insert sample users
-- Note: This script should be run after the initial schema setup.
-- The passwords for all users are "password123".

-- Admin user
-- Admin user
-- Admin user
INSERT INTO auth.users (id, email, encrypted_password, role, raw_user_meta_data)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'admin@loftmanager.com', crypt('password123', gen_salt('bf')), 'authenticated', jsonb_build_object('full_name', 'System Admin', 'role', 'admin'))
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, raw_user_meta_data = EXCLUDED.raw_user_meta_data;
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'admin@loftmanager.com', 'System Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- Manager user
INSERT INTO auth.users (id, email, encrypted_password, role, raw_user_meta_data)
VALUES ('550e8400-e29b-41d4-a716-446655440002', 'manager@loftmanager.com', crypt('password123', gen_salt('bf')), 'authenticated', jsonb_build_object('full_name', 'Property Manager', 'role', 'manager'))
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, raw_user_meta_data = EXCLUDED.raw_user_meta_data;
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('550e8400-e29b-41d4-a716-446655440002', 'manager@loftmanager.com', 'Property Manager', 'manager')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- Member user
INSERT INTO auth.users (id, email, encrypted_password, role, raw_user_meta_data)
VALUES ('550e8400-e29b-41d4-a716-446655440003', 'member@loftmanager.com', crypt('password123', gen_salt('bf')), 'authenticated', jsonb_build_object('full_name', 'Team Member', 'role', 'member'))
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, raw_user_meta_data = EXCLUDED.raw_user_meta_data;
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('550e8400-e29b-41d4-a716-446655440003', 'member@loftmanager.com', 'Team Member', 'member')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;
