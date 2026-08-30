-- COMPREHENSIVE FIX: Grants + RLS policies
-- Run this in Supabase SQL Editor

-- 1. Grant schema usage to anon
GRANT USAGE ON SCHEMA public TO anon;

-- 2. Grant table permissions
GRANT INSERT ON admission_submissions TO anon;
GRANT SELECT ON branches TO anon;
GRANT SELECT ON plans TO anon;
GRANT SELECT ON members TO authenticated;
GRANT SELECT ON attendance TO authenticated;
GRANT SELECT ON payments TO authenticated;
GRANT SELECT ON trainers TO authenticated;
GRANT SELECT ON employees TO authenticated;
GRANT SELECT ON diet_plans TO authenticated;
GRANT SELECT ON diet_plan_meals TO authenticated;

-- 3. Grant sequence usage (needed for SERIAL/BIGSERIAL columns)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Drop ALL existing policies on admission_submissions to start fresh
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'admission_submissions'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON admission_submissions';
  END LOOP;
END $$;

-- 5. Create clean policies
-- Anonymous can INSERT
CREATE POLICY "anon_insert_admissions"
  ON admission_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated can read all
CREATE POLICY "auth_read_admissions"
  ON admission_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated can update (for approve/reject)
CREATE POLICY "auth_update_admissions"
  ON admission_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
