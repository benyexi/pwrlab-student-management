-- =========================================================
-- PWRLab RLS Hardening
-- 目标:
-- 1) 清理过宽 authenticated 全开策略
-- 2) 区分 admin / student
-- 3) student 仅访问自身记录, admin 全权限
-- 可重复执行: 使用 CREATE OR REPLACE + 动态 DROP POLICY
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- Helper functions (SECURITY DEFINER, stable)
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_profile_name()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.name FROM public.profiles p WHERE p.id = auth.uid()),
    ''
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_owner_by_name(target_student_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(target_student_name, '') <> ''
     AND target_student_name = public.current_profile_name()
$$;

CREATE OR REPLACE FUNCTION public.is_owner_by_student_ref(target_student_id TEXT, target_student_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      COALESCE(target_student_id, '') <> ''
      AND (
        target_student_id = auth.uid()::text
        OR EXISTS (
          SELECT 1
          FROM public.students s
          WHERE s.id::text = target_student_id
            AND (
              s.name = public.current_profile_name()
              OR s.student_id = auth.uid()::text
            )
        )
      )
    )
    OR public.is_owner_by_name(target_student_name)
$$;

CREATE OR REPLACE FUNCTION public.is_owner_in_authors(authors_text TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_profile_name(), '') <> ''
     AND POSITION(public.current_profile_name() IN COALESCE(authors_text, '')) > 0
$$;

GRANT EXECUTE ON FUNCTION public.current_profile_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner_by_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner_by_student_ref(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner_in_authors(TEXT) TO authenticated;

-- ---------------------------------------------------------
-- Ensure RLS is enabled
-- ---------------------------------------------------------

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.weather_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.field_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.paper_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.question_replies ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- Drop all existing policies on target tables
-- ---------------------------------------------------------

DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'profiles',
        'students',
        'sites',
        'weather_records',
        'field_observations',
        'projects',
        'papers',
        'paper_timeline',
        'reports',
        'milestones',
        'instruments',
        'reservations',
        'files',
        'questions',
        'question_replies'
      ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------
-- profiles
-- ---------------------------------------------------------

CREATE POLICY rls_profiles_select
ON public.profiles
FOR SELECT
USING (public.is_admin() OR id = auth.uid());

CREATE POLICY rls_profiles_insert
ON public.profiles
FOR INSERT
WITH CHECK (public.is_admin() OR id = auth.uid());

CREATE POLICY rls_profiles_update
ON public.profiles
FOR UPDATE
USING (public.is_admin() OR id = auth.uid())
WITH CHECK (public.is_admin() OR id = auth.uid());

CREATE POLICY rls_profiles_delete
ON public.profiles
FOR DELETE
USING (public.is_admin());

-- ---------------------------------------------------------
-- students (student 仅可读自己的条目; admin 全权限)
-- ---------------------------------------------------------

CREATE POLICY rls_students_select
ON public.students
FOR SELECT
USING (
  public.is_admin()
  OR public.is_owner_by_student_ref(id::text, name)
);

CREATE POLICY rls_students_insert
ON public.students
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY rls_students_update
ON public.students
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY rls_students_delete
ON public.students
FOR DELETE
USING (public.is_admin());

-- ---------------------------------------------------------
-- sites / instruments (所有登录用户可读, admin 写)
-- ---------------------------------------------------------

CREATE POLICY rls_sites_select
ON public.sites
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY rls_sites_insert
ON public.sites
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY rls_sites_update
ON public.sites
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY rls_sites_delete
ON public.sites
FOR DELETE
USING (public.is_admin());

CREATE POLICY rls_instruments_select
ON public.instruments
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY rls_instruments_insert
ON public.instruments
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY rls_instruments_update
ON public.instruments
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY rls_instruments_delete
ON public.instruments
FOR DELETE
USING (public.is_admin());

-- ---------------------------------------------------------
-- projects / reports / milestones / reservations
-- ---------------------------------------------------------

CREATE POLICY rls_projects_select
ON public.projects
FOR SELECT
USING (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
);

CREATE POLICY rls_projects_insert
ON public.projects
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY rls_projects_update
ON public.projects
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY rls_projects_delete
ON public.projects
FOR DELETE
USING (public.is_admin());

CREATE POLICY rls_reports_select
ON public.reports
FOR SELECT
USING (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
);

CREATE POLICY rls_reports_insert
ON public.reports
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
);

CREATE POLICY rls_reports_update
ON public.reports
FOR UPDATE
USING (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
)
WITH CHECK (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
);

CREATE POLICY rls_reports_delete
ON public.reports
FOR DELETE
USING (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
);

CREATE POLICY rls_milestones_select
ON public.milestones
FOR SELECT
USING (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
);

CREATE POLICY rls_milestones_insert
ON public.milestones
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY rls_milestones_update
ON public.milestones
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY rls_milestones_delete
ON public.milestones
FOR DELETE
USING (public.is_admin());

CREATE POLICY rls_reservations_select
ON public.reservations
FOR SELECT
USING (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
);

CREATE POLICY rls_reservations_insert
ON public.reservations
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
);

CREATE POLICY rls_reservations_update
ON public.reservations
FOR UPDATE
USING (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
)
WITH CHECK (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
);

CREATE POLICY rls_reservations_delete
ON public.reservations
FOR DELETE
USING (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
);

-- ---------------------------------------------------------
-- papers / paper_timeline
-- ---------------------------------------------------------

CREATE POLICY rls_papers_select
ON public.papers
FOR SELECT
USING (
  public.is_admin()
  OR public.is_owner_by_name(student_name)
  OR public.is_owner_in_authors(authors)
);

CREATE POLICY rls_papers_insert
ON public.papers
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY rls_papers_update
ON public.papers
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY rls_papers_delete
ON public.papers
FOR DELETE
USING (public.is_admin());

CREATE POLICY rls_timeline_select
ON public.paper_timeline
FOR SELECT
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.papers p
    WHERE p.id = paper_id
      AND (
        public.is_owner_by_name(p.student_name)
        OR public.is_owner_in_authors(p.authors)
      )
  )
);

CREATE POLICY rls_timeline_insert
ON public.paper_timeline
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY rls_timeline_update
ON public.paper_timeline
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY rls_timeline_delete
ON public.paper_timeline
FOR DELETE
USING (public.is_admin());

-- ---------------------------------------------------------
-- questions / question_replies
-- ---------------------------------------------------------

CREATE POLICY rls_questions_select
ON public.questions
FOR SELECT
USING (
  public.is_admin()
  OR student_id::text = auth.uid()::text
);

CREATE POLICY rls_questions_insert
ON public.questions
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR student_id::text = auth.uid()::text
);

CREATE POLICY rls_questions_update
ON public.questions
FOR UPDATE
USING (
  public.is_admin()
  OR student_id::text = auth.uid()::text
)
WITH CHECK (
  public.is_admin()
  OR student_id::text = auth.uid()::text
);

CREATE POLICY rls_questions_delete
ON public.questions
FOR DELETE
USING (
  public.is_admin()
  OR student_id::text = auth.uid()::text
);

CREATE POLICY rls_replies_select
ON public.question_replies
FOR SELECT
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.questions q
    WHERE q.id = question_id
      AND q.student_id::text = auth.uid()::text
  )
);

CREATE POLICY rls_replies_insert
ON public.question_replies
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR (
    author_role = 'student'
    AND author_name = public.current_profile_name()
    AND EXISTS (
      SELECT 1
      FROM public.questions q
      WHERE q.id = question_id
        AND q.student_id::text = auth.uid()::text
    )
  )
);

CREATE POLICY rls_replies_update
ON public.question_replies
FOR UPDATE
USING (
  public.is_admin()
  OR (
    author_role = 'student'
    AND author_name = public.current_profile_name()
    AND EXISTS (
      SELECT 1
      FROM public.questions q
      WHERE q.id = question_id
        AND q.student_id::text = auth.uid()::text
    )
  )
)
WITH CHECK (
  public.is_admin()
  OR (
    author_role = 'student'
    AND author_name = public.current_profile_name()
    AND EXISTS (
      SELECT 1
      FROM public.questions q
      WHERE q.id = question_id
        AND q.student_id::text = auth.uid()::text
    )
  )
);

CREATE POLICY rls_replies_delete
ON public.question_replies
FOR DELETE
USING (
  public.is_admin()
  OR (
    author_role = 'student'
    AND author_name = public.current_profile_name()
    AND EXISTS (
      SELECT 1
      FROM public.questions q
      WHERE q.id = question_id
        AND q.student_id::text = auth.uid()::text
    )
  )
);

-- ---------------------------------------------------------
-- files / field_observations / weather_records
-- ---------------------------------------------------------

CREATE POLICY rls_files_select
ON public.files
FOR SELECT
USING (
  public.is_admin()
  OR public.is_owner_by_name(student_name)
);

CREATE POLICY rls_files_insert
ON public.files
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY rls_files_update
ON public.files
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY rls_files_delete
ON public.files
FOR DELETE
USING (public.is_admin());

CREATE POLICY rls_observations_select
ON public.field_observations
FOR SELECT
USING (
  public.is_admin()
  OR public.is_owner_by_name(student_name)
);

CREATE POLICY rls_observations_insert
ON public.field_observations
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY rls_observations_update
ON public.field_observations
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY rls_observations_delete
ON public.field_observations
FOR DELETE
USING (public.is_admin());

CREATE POLICY rls_weather_select
ON public.weather_records
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY rls_weather_insert
ON public.weather_records
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY rls_weather_update
ON public.weather_records
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY rls_weather_delete
ON public.weather_records
FOR DELETE
USING (public.is_admin());

COMMIT;
