-- Fix RLS policies for admission submissions
-- Run this in Supabase SQL Editor

-- Allow anonymous INSERT on admission_submissions
DROP POLICY IF EXISTS "Anyone can submit admissions" ON admission_submissions;
DROP POLICY IF EXISTS "Allow public insert on admission_submissions" ON admission_submissions;

CREATE POLICY "Allow anon insert on admission_submissions"
  ON admission_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated SELECT/UPDATE on admission_submissions
DROP POLICY IF EXISTS "Authenticated read admissions" ON admission_submissions;
DROP POLICY IF EXISTS "Authenticated update admissions" ON admission_submissions;

CREATE POLICY "Authenticated read admissions" ON admission_submissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated update admissions" ON admission_submissions
  FOR UPDATE TO authenticated USING (true);

-- Ensure branches and plans are readable by anon
DROP POLICY IF EXISTS "Public read branches" ON branches;
DROP POLICY IF EXISTS "Allow public read on branches" ON branches;
CREATE POLICY "Anon read branches" ON branches FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read plans" ON plans;
DROP POLICY IF EXISTS "Allow public read on plans" ON plans;
CREATE POLICY "Anon read plans" ON plans FOR SELECT TO anon USING (true);

-- Members: authenticated full access
DROP POLICY IF EXISTS "Authenticated read members" ON members;
DROP POLICY IF EXISTS "Authenticated insert members" ON members;
DROP POLICY IF EXISTS "Authenticated update members" ON members;
DROP POLICY IF EXISTS "Authenticated delete members" ON members;

CREATE POLICY "Authenticated read members" ON members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert members" ON members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update members" ON members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete members" ON members FOR DELETE TO authenticated USING (true);

-- Attendance: authenticated full access
DROP POLICY IF EXISTS "Authenticated read attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated insert attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated update attendance" ON attendance;

CREATE POLICY "Authenticated read attendance" ON attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update attendance" ON attendance FOR UPDATE TO authenticated USING (true);

-- Payments: authenticated full access
DROP POLICY IF EXISTS "Authenticated read payments" ON payments;
DROP POLICY IF EXISTS "Authenticated insert payments" ON payments;
DROP POLICY IF EXISTS "Authenticated update payments" ON payments;

CREATE POLICY "Authenticated read payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update payments" ON payments FOR UPDATE TO authenticated USING (true);

-- Trainers: authenticated full access
DROP POLICY IF EXISTS "Authenticated read trainers" ON trainers;
DROP POLICY IF EXISTS "Authenticated insert trainers" ON trainers;
DROP POLICY IF EXISTS "Authenticated update trainers" ON trainers;
DROP POLICY IF EXISTS "Authenticated delete trainers" ON trainers;

CREATE POLICY "Authenticated read trainers" ON trainers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert trainers" ON trainers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update trainers" ON trainers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete trainers" ON trainers FOR DELETE TO authenticated USING (true);

-- Employees: authenticated full access
DROP POLICY IF EXISTS "Authenticated read employees" ON employees;
DROP POLICY IF EXISTS "Authenticated insert employees" ON employees;
DROP POLICY IF EXISTS "Authenticated update employees" ON employees;
DROP POLICY IF EXISTS "Authenticated delete employees" ON employees;

CREATE POLICY "Authenticated read employees" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert employees" ON employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update employees" ON employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete employees" ON employees FOR DELETE TO authenticated USING (true);

-- Diet Plans: authenticated full access
DROP POLICY IF EXISTS "Authenticated read diet_plans" ON diet_plans;
DROP POLICY IF EXISTS "Authenticated insert diet_plans" ON diet_plans;
DROP POLICY IF EXISTS "Authenticated update diet_plans" ON diet_plans;
DROP POLICY IF EXISTS "Authenticated delete diet_plans" ON diet_plans;

CREATE POLICY "Authenticated read diet_plans" ON diet_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert diet_plans" ON diet_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update diet_plans" ON diet_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete diet_plans" ON diet_plans FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read diet_plan_meals" ON diet_plan_meals;
DROP POLICY IF EXISTS "Authenticated insert diet_plan_meals" ON diet_plan_meals;
DROP POLICY IF EXISTS "Authenticated delete diet_plan_meals" ON diet_plan_meals;

CREATE POLICY "Authenticated read diet_plan_meals" ON diet_plan_meals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert diet_plan_meals" ON diet_plan_meals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated delete diet_plan_meals" ON diet_plan_meals FOR DELETE TO authenticated USING (true);
