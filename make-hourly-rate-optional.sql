-- ============================================
-- MIGRATION: Make hourly_rate optional in time_entries
-- ============================================
-- This migration makes hourly_rate nullable so that time tracking
-- can be started without requiring an hourly rate to be set.

ALTER TABLE time_entries 
  ALTER COLUMN hourly_rate DROP NOT NULL;





