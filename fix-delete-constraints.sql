-- ============================================
-- Fix DELETE Constraints for Contacts and Bank Accounts
-- ============================================
-- This migration fixes the constraint violation when deleting contacts or bank accounts
-- The issue: contact_id and bank_account_id were NOT NULL but had ON DELETE SET NULL
-- Solution: Make these columns nullable to allow deletion
-- ============================================

-- Fix contact_id constraint
ALTER TABLE invoices 
  ALTER COLUMN contact_id DROP NOT NULL;

-- Fix bank_account_id constraint  
ALTER TABLE invoices 
  ALTER COLUMN bank_account_id DROP NOT NULL;

-- Verify the changes
-- You can run these queries to check:
-- SELECT column_name, is_nullable, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'invoices' 
-- AND column_name IN ('contact_id', 'bank_account_id');

