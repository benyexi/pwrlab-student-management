-- 学生功能升级 SQL（2026-04-09）
-- 在 Supabase Dashboard → SQL Editor 执行

-- ① papers 表加 paper_type 字段
ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS paper_type TEXT DEFAULT '期刊论文'
  CHECK (paper_type IN ('毕业论文', '期刊论文', '会议论文'));

-- ② papers INSERT/UPDATE 开放给学生（按 student_name 匹配）
DROP POLICY IF EXISTS rls_papers_insert ON public.papers;
CREATE POLICY rls_papers_insert ON public.papers
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR public.is_owner_by_name(student_name)
  );

DROP POLICY IF EXISTS rls_papers_update ON public.papers;
CREATE POLICY rls_papers_update ON public.papers
  FOR UPDATE
  USING (public.is_admin() OR public.is_owner_by_name(student_name))
  WITH CHECK (public.is_admin() OR public.is_owner_by_name(student_name));

-- ③ milestones UPDATE 开放给学生（学生可更新自己节点的 notes）
DROP POLICY IF EXISTS rls_milestones_update ON public.milestones;
CREATE POLICY rls_milestones_update ON public.milestones
  FOR UPDATE
  USING (
    public.is_admin()
    OR public.is_owner_by_student_ref(student_id, student_name)
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_owner_by_student_ref(student_id, student_name)
  );

-- 验证
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('papers', 'milestones')
ORDER BY tablename, cmd;
