-- Add frequency and depreciation_years columns to expenses table
-- For recurring expenses: frequency (Weekly, Monthly, Quarterly, Yearly, Other)
-- For asset expenses: depreciation_years (number of years for depreciation)

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS frequency TEXT CHECK (frequency IN ('Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Other')),
ADD COLUMN IF NOT EXISTS depreciation_years INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN expenses.frequency IS 'Frequency for recurring expenses: Weekly, Monthly, Quarterly, Yearly, or Other';
COMMENT ON COLUMN expenses.depreciation_years IS 'Number of years for asset depreciation (only used for asset type expenses)';


