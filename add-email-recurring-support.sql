-- ============================================
-- Email & Recurring Invoice Support
-- ============================================
-- Adds view token support for public invoice viewing
-- and recurring invoice functionality
-- ============================================

-- Add view token and email tracking to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS view_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS view_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_invoices_view_token ON invoices(view_token);

-- ============================================
-- RECURRING INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  
  -- Template data (same structure as invoices)
  currency TEXT DEFAULT 'CHF' NOT NULL,
  from_info JSONB NOT NULL,
  to_info JSONB NOT NULL,
  items JSONB DEFAULT '[]' NOT NULL,
  notes TEXT,
  payment_terms TEXT NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL,
  subtotal DECIMAL(12,2) DEFAULT 0 NOT NULL,
  vat_amount DECIMAL(12,2) DEFAULT 0 NOT NULL,
  total DECIMAL(12,2) DEFAULT 0 NOT NULL,
  
  -- Recurrence settings
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  next_run_date DATE NOT NULL,
  end_date DATE,
  
  -- Status and settings
  is_active BOOLEAN DEFAULT TRUE,
  auto_send BOOLEAN DEFAULT FALSE,
  
  -- Tracking
  last_run_date DATE,
  invoices_created INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_invoices
DROP POLICY IF EXISTS "Users can manage own recurring_invoices" ON recurring_invoices;
CREATE POLICY "Users can manage own recurring_invoices"
  ON recurring_invoices FOR ALL
  USING (auth.jwt() ->> 'sub' = user_id);

-- Indexes for recurring_invoices
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_user_id ON recurring_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_run_date ON recurring_invoices(next_run_date);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_is_active ON recurring_invoices(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recurring_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_recurring_invoices_updated_at ON recurring_invoices;
CREATE TRIGGER trigger_update_recurring_invoices_updated_at
  BEFORE UPDATE ON recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_invoices_updated_at();




