-- Add entry_fee column to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS entry_fee TEXT;

-- Update RLS policies for judge_applications to ensure applicants can insert/update their own applications
-- This fixes the issue where the modal might get stuck if the user doesn't have permissions
DROP POLICY IF EXISTS "Applicants can manage their own applications" ON judge_applications;

CREATE POLICY "Applicants can manage their own applications" ON judge_applications
    FOR ALL
    USING (auth.uid() = applicant_id);

-- Ensure profiles are updateable by owners (for status changes)
CREATE POLICY "Users can update own profile judge status" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
