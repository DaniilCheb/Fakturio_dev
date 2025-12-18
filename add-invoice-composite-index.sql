-- ============================================
-- Add Composite Index for Invoice Lookups
-- ============================================
-- This migration adds a composite index on invoices(id, user_id)
-- to optimize queries that filter by both id and user_id (RLS pattern)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_invoices_id_user_id ON invoices(id, user_id);

-- This index optimizes queries like:
-- SELECT * FROM invoices WHERE id = ? AND user_id = ?
-- Which is the pattern used by getInvoiceById and similar functions


