-- =====================================================
-- LOFT MANAGEMENT SYSTEM - SAMPLE SEED DATA
-- =====================================================
-- This script provides sample data for the Loft Management System.
-- It consolidates all INSERT statements from the various SQL scripts and
-- the SEED DATA section of database/complete-schema.sql.
-- Ensure the schema is created before running this script.
-- =====================================================

-- Seed Zone Areas
INSERT INTO zone_areas (name) VALUES ('Algiers'), ('Oran'), ('Constantine') ON CONFLICT (name) DO NOTHING;

-- Seed Internet Connection Types
INSERT INTO internet_connection_types (name, description, type, speed, provider, status, cost) VALUES
('Fiber', 'High-speed fiber optic connection', 'Fiber', '100 Mbps', 'Algerie Telecom', 'active', 2500.00),
('ADSL', 'Standard ADSL connection', 'ADSL', '20 Mbps', 'Algerie Telecom', 'active', 1600.00),
('4G/5G', 'Mobile internet connection', '4G', '50 Mbps', 'Djezzy', 'active', 3000.00),
('Satellite', 'Satellite internet connection', '4G', '75 Mbps', 'Ooredoo', 'active', 3500.00),
('Fiber', 'High-speed fiber optic connection', 'Fiber', '300 Mbps', 'Algerie Telecom', 'active', 5000.00)
ON CONFLICT (name) DO NOTHING;

-- Seed Categories
INSERT INTO categories (name, description, type) VALUES
('Rent', 'Monthly rent income', 'income'),
('Deposit', 'Security deposits', 'income'),
('Late Fees', 'Late payment fees', 'income'),
('Maintenance', 'Property maintenance', 'expense'),
('Utilities', 'Water, gas, electricity', 'expense'),
('Insurance', 'Property insurance', 'expense'),
('Taxes', 'Property taxes', 'expense'),
('Cleaning', 'Cleaning services', 'expense')
ON CONFLICT (name) DO NOTHING;

-- Seed Currencies
INSERT INTO currencies (code, name, symbol, is_default, ratio) VALUES
('DZD', 'Algerian Dinar', 'DA', true, 1.0),
('EUR', 'Euro', '€', false, 0.0075),
('USD', 'US Dollar', '$', false, 0.0074)
ON CONFLICT (code) DO NOTHING;

-- Seed Payment Methods
INSERT INTO payment_methods (name, type, details) VALUES
('Cash', 'cash', null),
('Bank Transfer', 'bank_transfer', '{"bank": "CPA", "account_number": "123456789"}'),
('Check', 'check', null),
('Credit Card', 'credit_card', null)
ON CONFLICT (name) DO NOTHING;

-- Seed Loft Owners
INSERT INTO loft_owners (name, email, phone, address, ownership_type) VALUES
('Loft Algerie', 'contact@loftalgerie.com', '021234567', 'Algiers, Algeria', 'company'),
('Property Management Co.', 'info@propmanage.dz', '021345678', 'Oran, Algeria', 'company')
ON CONFLICT (name) DO NOTHING;

-- Seed Transaction Category References
INSERT INTO transaction_category_references (category, transaction_type, reference_amount, description) VALUES
-- Expense categories
('maintenance', 'expense', 5000.00, 'Maintenance générale des lofts'),
('cleaning', 'expense', 2000.00, 'Nettoyage et entretien'),
('repair', 'expense', 8000.00, 'Réparations diverses'),
('plumbing', 'expense', 6000.00, 'Plomberie'),
('electrical', 'expense', 7000.00, 'Électricité'),
('painting', 'expense', 4000.00, 'Peinture et décoration'),
('security', 'expense', 3000.00, 'Sécurité'),
('inspection', 'expense', 1500.00, 'Inspections'),
('utilities', 'expense', 4000.00, 'Factures utilitaires'),
('insurance', 'expense', 10000.00, 'Assurances'),
('taxes', 'expense', 15000.00, 'Taxes et impôts'),
('supplies', 'expense', 2500.00, 'Fournitures et matériaux'),
('other', 'expense', 3000.00, 'Autres dépenses'),
-- Income categories
('rent', 'income', 50000.00, 'Loyers mensuels'),
('deposit', 'income', 100000.00, 'Cautions et dépôts'),
('late_fees', 'income', 5000.00, 'Frais de retard'),
('parking', 'income', 5000.00, 'Frais de parking'),
('services', 'income', 10000.00, 'Services additionnels'),
('other', 'income', 20000.00, 'Autres revenus')
ON CONFLICT (category, transaction_type) DO NOTHING;

-- Insert sample users (from 00-init.sql)
INSERT INTO profiles (id, email, full_name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@loftmanager.com', 'System Admin', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440002', 'manager@loftmanager.com', 'Property Manager', 'manager'),
  ('550e8400-e29b-41d4-a716-446655440003', 'member@loftmanager.com', 'Team Member', 'member')
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions (from 00-init.sql)
-- Note: loft_id and currency_id are placeholders as lofts and currencies might not exist yet or have different IDs.
-- These should be adjusted based on actual loft and currency IDs after they are created.
INSERT INTO transactions (id, amount, description, transaction_type, status, user_id, category) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', 2500.00, 'Monthly rent - Downtown Loft A1', 'income', 'completed', '550e8400-e29b-41d4-a716-446655440001', 'Rent'),
  ('aa0e8400-e29b-41d4-a716-446655440002', -150.00, 'Heating repair costs', 'expense', 'completed', '550e8400-e29b-41d4-a716-446655440003', 'Maintenance'),
  ('aa0e8400-e29b-41d4-a716-446655440003', 3200.00, 'Monthly rent - Riverside Loft B2', 'income', 'pending', '550e8400-e29b-41d4-a716-446655440002', 'Rent')
ON CONFLICT (id) DO NOTHING;
