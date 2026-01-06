-- ============================================
-- Multi-Currency Support Migration
-- ============================================
-- Adds exchange rate tracking to invoices and expenses
-- Creates exchange rate cache table for Frankfurter API
-- ============================================

-- Add exchange rate fields to invoices
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(12,6),
  ADD COLUMN IF NOT EXISTS amount_in_account_currency DECIMAL(12,2);

-- Add exchange rate fields to expenses
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(12,6),
  ADD COLUMN IF NOT EXISTS amount_in_account_currency DECIMAL(12,2);

-- Create exchange rate cache table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate DECIMAL(12,6) NOT NULL,
  date DATE NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(base_currency, target_currency, date)
);

-- Enable RLS on exchange_rates
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read and write exchange rates (they're public data)
DROP POLICY IF EXISTS "Anyone can read exchange rates" ON exchange_rates;
CREATE POLICY "Anyone can read exchange rates"
  ON exchange_rates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update exchange rates
DROP POLICY IF EXISTS "Authenticated users can manage exchange rates" ON exchange_rates;
CREATE POLICY "Authenticated users can manage exchange rates"
  ON exchange_rates FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup 
  ON exchange_rates(base_currency, target_currency, date DESC);

