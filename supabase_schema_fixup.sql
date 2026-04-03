-- ================================================
-- Schema Fixup Migration
-- Run in Supabase SQL Editor to patch mismatches
-- ================================================

-- 1. Fix students.degree_type CHECK: '博后' -> '博士后'
ALTER TABLE students
  DROP CONSTRAINT IF EXISTS students_degree_type_check;
ALTER TABLE students
  ADD CONSTRAINT students_degree_type_check
    CHECK (degree_type IN ('硕士', '博士', '博士后'));
-- Backfill any existing '博后' rows
UPDATE students SET degree_type = '博士后' WHERE degree_type = '博后';

-- 2. Fix milestones: add notes column + allow '已逾期' status
ALTER TABLE milestones
  ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE milestones
  DROP CONSTRAINT IF EXISTS milestones_status_check;
ALTER TABLE milestones
  ADD CONSTRAINT milestones_status_check
    CHECK (status IN ('未开始', '进行中', '已完成', '已逾期'));

-- 3. Fix reports: add missing next_week_plan column
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS next_week_plan TEXT;

-- 4. Fix projects.site_id type (if UUID was applied instead of TEXT)
-- Only needed if site_id column currently has type UUID:
-- ALTER TABLE projects ALTER COLUMN site_id TYPE TEXT USING site_id::text;
-- DROP CONSTRAINT IF EXISTS projects_site_id_fkey;
-- ALTER TABLE projects ADD CONSTRAINT projects_site_id_fkey
--   FOREIGN KEY (site_id) REFERENCES sites(id);
