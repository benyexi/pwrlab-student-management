-- ============================================
-- PWRLab Student Management - Schema Update
-- Kanban Projects + Student Q&A
-- ============================================

-- 1. ALTER TABLE projects: add new columns
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS stage_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS advisor_notes TEXT,
  ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id);

-- Backfill stage_entered_at for existing rows
UPDATE projects
SET stage_entered_at = COALESCE(updated_at, created_at, now())
WHERE stage_entered_at IS NULL;

-- 2. CREATE TABLE questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '待回复'
    CHECK (status IN ('待回复', '已回复', '已关闭')),
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE TABLE question_replies
CREATE TABLE IF NOT EXISTS question_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'student'
    CHECK (author_role IN ('admin', 'student')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_student_id ON questions(student_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_question_replies_question_id ON question_replies(question_id);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(stage);
CREATE INDEX IF NOT EXISTS idx_projects_site_id ON projects(site_id);

-- 4. RLS Policies

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_replies ENABLE ROW LEVEL SECURITY;

-- questions: everyone can read all questions
CREATE POLICY "questions_select_all" ON questions
  FOR SELECT USING (true);

-- questions: students can insert their own questions
CREATE POLICY "questions_insert_student" ON questions
  FOR INSERT WITH CHECK (
    auth.uid()::text = student_id::text
  );

-- questions: admin can update any question (status changes)
CREATE POLICY "questions_update_admin" ON questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN profiles p ON p.id = u.id
      WHERE u.id = auth.uid() AND p.role = 'admin'
    )
  );

-- question_replies: everyone can read
CREATE POLICY "replies_select_all" ON question_replies
  FOR SELECT USING (true);

-- question_replies: authenticated users can insert replies
CREATE POLICY "replies_insert_auth" ON question_replies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- projects: update policy for new columns (if not exists)
-- Assumes existing RLS on projects allows admin updates
