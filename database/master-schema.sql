-- =====================================================
-- LOFT MANAGEMENT SYSTEM - MASTER DATABASE SCHEMA
-- =====================================================
-- This script creates the complete database schema for the Loft Management System
-- Run this script in your Supabase SQL editor to set up the entire database

-- =====================================================
-- SECTION 1: CLEANUP (Drop existing objects to avoid conflicts)
-- =====================================================

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS trigger_update_bill_dates ON transactions;
DROP TRIGGER IF EXISTS trigger_check_transaction_amount ON transactions;
DROP TRIGGER IF EXISTS notification_update_trigger ON notifications;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_next_due_date(DATE, TEXT);
DROP FUNCTION IF EXISTS update_next_bill_dates();
DROP FUNCTION IF EXISTS get_upcoming_bills(INTEGER);
DROP FUNCTION IF EXISTS get_overdue_bills();
DROP FUNCTION IF EXISTS check_transaction_amount_vs_reference();
DROP FUNCTION IF EXISTS get_transaction_category_references();
DROP FUNCTION IF EXISTS update_transaction_reference_amount(VARCHAR, VARCHAR, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS get_transactions_over_reference(INTEGER);
DROP FUNCTION IF EXISTS update_notification_count();

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS transaction_category_references;

-- =====================================================
-- SECTION 2: CORE TABLES UPDATES
-- =====================================================

-- Update notifications table to support enhanced notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Ensure link column is TEXT, not UUID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'link'
  ) THEN
    ALTER TABLE notifications ALTER COLUMN link TYPE TEXT;
  ELSE
    ALTER TABLE notifications ADD COLUMN link TEXT;
  END IF;
END $$;

-- Add avatar_url column to profiles if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add bill frequency and due date columns to lofts table
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_eau VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_eau DATE;
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_energie VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_energie DATE;
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_telephone VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_telephone DATE;
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_internet VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_internet DATE;

-- =====================================================
-- SECTION 3: NEW TABLES
-- =====================================================

-- Create transaction category reference amounts table
CREATE TABLE transaction_category_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  reference_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'DZD',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, transaction_type)
);

-- =====================================================
-- SECTION 4: SEED DATA
-- =====================================================

-- Insert default reference amounts for transaction categories
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
('utilities', 'expense', 4000.00, 'Factures utilitaires (eau, gaz, électricité)'),
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
('other', 'income', 20000.00, 'Autres revenus');

-- =====================================================
-- SECTION 5: FUNCTIONS
-- =====================================================

-- Function to calculate next due date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_due_date(due_date DATE, frequency TEXT)
RETURNS DATE AS $$
BEGIN
  CASE LOWER(frequency)
    WHEN 'monthly' THEN
      RETURN due_date + INTERVAL '1 month';
    WHEN 'mensuel' THEN
      RETURN due_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN due_date + INTERVAL '3 months';
    WHEN 'trimestriel' THEN
      RETURN due_date + INTERVAL '3 months';
    WHEN 'semi-annual' THEN
      RETURN due_date + INTERVAL '6 months';
    WHEN 'semestriel' THEN
      RETURN due_date + INTERVAL '6 months';
    WHEN 'annual' THEN
      RETURN due_date + INTERVAL '1 year';
    WHEN 'annuel' THEN
      RETURN due_date + INTERVAL '1 year';
    WHEN 'bi-monthly' THEN
      RETURN due_date + INTERVAL '2 months';
    WHEN 'bimestriel' THEN
      RETURN due_date + INTER