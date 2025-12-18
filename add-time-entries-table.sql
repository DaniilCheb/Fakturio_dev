-- ============================================
-- TIME_ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Time tracking
  description TEXT,                   -- Optional note for the session
  date DATE NOT NULL,                 -- Date of the work
  start_time TIMESTAMPTZ,             -- For timer mode: when started
  end_time TIMESTAMPTZ,               -- For timer mode: when stopped
  duration_minutes INTEGER NOT NULL,  -- Total duration in minutes
  
  -- Billing (snapshot rate at time of entry)
  hourly_rate DECIMAL(10,2) NOT NULL, -- Copied from project.hourly_rate
  is_billable BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'unbilled' CHECK (status IN ('unbilled', 'invoiced', 'paid')),
  
  -- Timer state (for active timers)
  is_running BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_invoice_id ON time_entries(invoice_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_running ON time_entries(user_id, is_running) WHERE is_running = TRUE;

-- RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own time_entries" ON time_entries;
CREATE POLICY "Users can manage own time_entries"
  ON time_entries FOR ALL
  USING (auth.jwt() ->> 'sub' = user_id);

-- Trigger
DROP TRIGGER IF EXISTS update_time_entries_updated_at ON time_entries;
CREATE TRIGGER update_time_entries_updated_at 
  BEFORE UPDATE ON time_entries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

