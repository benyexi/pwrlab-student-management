-- 修复 paper_timeline 表 RLS（2026-04-09）
-- 问题：学生保存论文时 paper_timeline INSERT 被 RLS 拒绝
-- 在 Supabase Dashboard → SQL Editor 执行

-- ① 允许学生对自己论文的 timeline 行 INSERT
DROP POLICY IF EXISTS rls_paper_timeline_insert ON public.paper_timeline;
CREATE POLICY rls_paper_timeline_insert ON public.paper_timeline
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.papers
      WHERE papers.id = paper_timeline.paper_id
        AND public.is_owner_by_name(papers.student_name)
    )
  );

-- ② 允许学生查看自己论文的 timeline（如果还没开放 SELECT）
DROP POLICY IF EXISTS rls_paper_timeline_select ON public.paper_timeline;
CREATE POLICY rls_paper_timeline_select ON public.paper_timeline
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.papers
      WHERE papers.id = paper_timeline.paper_id
        AND public.is_owner_by_name(papers.student_name)
    )
  );

-- ③ 顺便把没有 student_name 的旧论文，按 authors 字段补填 student_name
-- （将 authors 里包含对应学生名字的论文打上标记）
-- 只补填能精确匹配的行（authors = 单个名字，或能确认归属）
UPDATE papers
SET student_name = p2.name
FROM (
  SELECT DISTINCT name FROM profiles WHERE role = 'student' AND name IS NOT NULL AND name != ''
) p2
WHERE papers.student_name IS NULL
  AND papers.authors = p2.name;

-- 验证
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'paper_timeline'
ORDER BY cmd;
